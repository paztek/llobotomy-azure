import type {
    ChatCompletions,
    ChatCompletionsToolCall,
    ChatRequestMessage,
    ChatResponseMessage,
    FunctionCall,
} from '@azure/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
import type {
    ChatMessage,
    ChatRequestMessageWithMetadata,
    ChatRequestToolMessageWithMetadata,
} from '../message';
import { ThreadMessageConverter } from './message.converter';
import { ToolEmulator } from './tool.emulator';

export class Thread extends EventEmitter {
    private _stream: Readable | null = null;
    private readonly converter = new ThreadMessageConverter();
    private readonly toolEmulator = new ToolEmulator();

    constructor(private readonly messages: ChatMessage[] = []) {
        super();
    }

    get stream(): Readable | null {
        if (!this._stream) {
            return null;
        }

        return this._stream;
    }

    addMessage(message: ChatRequestMessageWithMetadata): void {
        this.doAddMessage(message);
    }

    run(assistant: Assistant): void {
        this._stream = new Readable({
            read: () => {},
        });
        this.doRun(assistant);
    }

    private doRun(assistant: Assistant): void {
        this.emitImmediate('in_progress');

        const messages = this.converter.convert(this.messages);

        const stream = assistant.listChatCompletions(messages);

        let content: string | null = null;
        const toolCalls: ChatCompletionsToolCall[] = [];
        let functionCall: FunctionCall | undefined = undefined;

        stream.on('data', (completion: ChatCompletions) => {
            if (!completion.id || completion.id === '') {
                // First completion is empty when using old models like gpt-35-turbo
                return;
            }
            const choice = completion.choices[0];
            if (!choice) {
                throw new Error('No completions returned');
            }

            const delta = choice.delta;
            if (!delta) {
                throw new Error('No delta returned');
            }

            if (delta.content) {
                content = content ? content + delta.content : delta.content;

                // Write also to the stream of the thread
                if (!this._stream) {
                    throw new Error('No stream available');
                }
                this._stream?.push(delta.content);
            }

            // Merge toolCalls
            if (delta.toolCalls) {
                for (const toolCall of delta.toolCalls) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const index = toolCall['index']; // Not typed yet by the @azure/openai package
                    const existingToolCall = toolCalls[index];

                    if (existingToolCall) {
                        existingToolCall.function.arguments +=
                            toolCall.function.arguments;
                    } else {
                        toolCalls.push({
                            type: toolCall.type,
                            function: toolCall.function,
                            id: toolCall.id,
                        });
                    }
                }
            }

            // Merge functionCalls
            if (delta.functionCall) {
                if (functionCall) {
                    functionCall.arguments += delta.functionCall.arguments;
                } else {
                    functionCall = {
                        ...delta.functionCall,
                        arguments: '',
                    };
                }
            }

            if (choice.finishReason === null) {
                return;
            }

            let finalToolCalls: ChatCompletionsToolCall[];

            if (toolCalls.length > 0) {
                finalToolCalls = [...toolCalls];
            } else if (functionCall) {
                /**
                 * We received a legacy function call, we convert it to a tool call with an emulated ID
                 */
                const toolCall: ChatCompletionsToolCall = {
                    type: 'function',
                    function: functionCall,
                    id: this.toolEmulator.generateEmulatedToolCallId(
                        functionCall,
                    ),
                };
                finalToolCalls = [toolCall];
            } else {
                finalToolCalls = [];
            }

            const message: ChatResponseMessage = {
                role: 'assistant',
                content,
                toolCalls: finalToolCalls,
            };

            content = null;
            toolCalls.splice(0, toolCalls.length);
            functionCall = undefined;

            this.doAddMessage(message);

            switch (choice.finishReason) {
                case 'stop':
                    this._stream?.push(null);
                    this.emitImmediate('completed');
                    break;
                case 'tool_calls':
                case 'function_call': {
                    if (message.toolCalls.length === 0) {
                        throw new Error('No tool calls returned');
                    }
                    this.dispatchRequiredAction(message.toolCalls, assistant);
                    break;
                }
                default:
                    throw new Error(
                        `Unknown finish reason ${choice.finishReason}`,
                    );
            }
        });
    }

    private dispatchRequiredAction(
        toolCalls: ChatCompletionsToolCall[],
        assistant: Assistant,
    ): void {
        const requiredAction = new RequiredAction(toolCalls);
        requiredAction.on('submitting', (toolOutputs: ToolOutput[]) =>
            this.handleSubmittedToolOutputs(toolOutputs, assistant),
        );
        this.emitImmediate('requires_action', requiredAction);
    }

    private handleSubmittedToolOutputs(
        toolOutputs: ToolOutput[],
        assistant: Assistant,
    ): void {
        // Adds the tool outputs to the messages
        for (const toolOutput of toolOutputs) {
            const message: ChatRequestToolMessageWithMetadata = {
                role: 'tool',
                content: JSON.stringify(toolOutput.value),
                toolCallId: toolOutput.callId,
            };
            if (toolOutput.metadata !== void 0) {
                message.metadata = toolOutput.metadata;
            }
            this.doAddMessage(message);
        }

        this.doRun(assistant);
    }

    private doAddMessage(
        message: ChatRequestMessage | ChatResponseMessage,
    ): void {
        this.messages.push(message);

        this.emitImmediate('message', message);

        if (isChatRequestMessage(message)) {
            this.emitImmediate('message:request', message);
        } else {
            this.emitImmediate('message:response', message);
        }
    }

    private emitImmediate(event: string, ...args: unknown[]): void {
        setImmediate(() => {
            this.emit(event, ...args);
        });
    }
}

export class RequiredAction extends EventEmitter {
    constructor(public readonly toolCalls: ChatCompletionsToolCall[]) {
        super();
    }

    submitToolOutputs(toolOutputs: ToolOutput[]): void {
        this.emit('submitting', toolOutputs);
    }
}

export interface ToolOutput {
    callId: string;
    value: unknown;
    metadata?: unknown;
}

export function isChatResponseMessage(
    m: ChatRequestMessage | ChatResponseMessage,
): m is ChatResponseMessage {
    return 'toolCalls' in m;
}

export function isChatRequestMessage(
    m: ChatRequestMessage | ChatResponseMessage,
): m is ChatRequestMessage {
    return !isChatResponseMessage(m);
}
