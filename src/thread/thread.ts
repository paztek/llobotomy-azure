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

interface MultiToolUseParallelArguments {
    tool_uses: {
        recipient_name: string;
        parameters: string;
    }[];
}

export class Thread extends EventEmitter {
    private _stream: Readable | null = null;
    private readonly _messages: ChatMessage[] = [];
    private readonly converter = new ThreadMessageConverter();
    private readonly toolEmulator = new ToolEmulator();

    constructor(
        public readonly id: string,
        messages: ChatMessage[] = [],
    ) {
        super();
        this._messages = messages;
    }

    get stream(): Readable | null {
        return this._stream;
    }

    get messages(): ChatMessage[] {
        // TODO Return a deep copy
        return this._messages;
    }

    addMessage(message: ChatRequestMessageWithMetadata): void {
        this.doAddMessage(message);
    }

    async run(assistant: Assistant): Promise<void> {
        try {
            return await this.doRun(assistant);
        } catch (e) {
            this.emitImmediate('error', e);
        }
    }

    private async doRun(assistant: Assistant): Promise<void> {
        if (this._stream) {
            this._stream.push(null);
        }

        this._stream = new Readable({
            read: () => {},
        });

        this.emitImmediate('in_progress');

        const messages = this.converter.convert(this._messages);

        const stream = await assistant.streamChatCompletions(messages);

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
                const err = new Error('No completions returned');
                return this.emitImmediate('error', err);
            }

            const delta = choice.delta;
            if (!delta) {
                const err = new Error('No delta returned');
                return this.emitImmediate('error', err);
            }

            if (delta.content) {
                content = content ? content + delta.content : delta.content;

                // Write also to the stream of the thread
                if (!this._stream) {
                    const err = new Error('No stream available');
                    return this.emitImmediate('error', err);
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
                if (
                    toolCalls.length === 1 &&
                    toolCalls[0] &&
                    toolCalls[0].type === 'function' &&
                    toolCalls[0].function.name === 'multi_tool_use.parallel'
                ) {
                    /**
                     * That seems to be an hallucination from the model,
                     * we convert the payload into regular tool calls
                     * See https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653/8
                     */
                    const toolCall = toolCalls[0];
                    const args = JSON.parse(
                        toolCall.function.arguments,
                    ) as MultiToolUseParallelArguments;
                    /**
                     * the arguments follow the structure:
                     * {
                     *     tool_uses: [
                     *          {
                     *              recipient_name: "functions.actual_tool_name",
                     *              parameters: {
                     *                  foo: "bar",
                     *                  baz: true,
                     *              }
                     *          },
                     *          ...
                     *     ]
                     * }
                     */
                    finalToolCalls = args.tool_uses.map(
                        (
                            toolUse: {
                                recipient_name: string;
                                parameters: unknown;
                            },
                            index,
                        ) => {
                            return {
                                type: 'function',
                                function: {
                                    name: toolUse.recipient_name.replace(
                                        'functions.',
                                        '',
                                    ),
                                    arguments: JSON.stringify(
                                        toolUse.parameters,
                                    ),
                                },
                                id: `${toolCall.id}_${index}`,
                            };
                        },
                    );
                } else {
                    finalToolCalls = [...toolCalls];
                }
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
                        const err = new Error('No tool calls returned');
                        return this.emitImmediate('error', err);
                    }
                    this.dispatchRequiredAction(message.toolCalls, assistant);
                    break;
                }
                default: {
                    const err = new Error(
                        `Unknown finish reason ${choice.finishReason}`,
                    );
                    return this.emitImmediate('error', err);
                }
            }
        });
    }

    private dispatchRequiredAction(
        toolCalls: ChatCompletionsToolCall[],
        assistant: Assistant,
    ): void {
        const requiredAction = new RequiredAction(toolCalls);
        requiredAction.on('submitting', async (toolOutputs: ToolOutput[]) =>
            this.handleSubmittedToolOutputs(toolOutputs, assistant),
        );
        this.emitImmediate('requires_action', requiredAction);
    }

    private async handleSubmittedToolOutputs(
        toolOutputs: ToolOutput[],
        assistant: Assistant,
    ): Promise<void> {
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

        return this.doRun(assistant);
    }

    private doAddMessage(
        message: ChatRequestMessage | ChatResponseMessage,
    ): void {
        this._messages.push(message);

        this.emitImmediate('message', message);

        if (isChatRequestMessage(message)) {
            this.emitImmediate('message:request', message);
        } else {
            this.emitImmediate('message:response', message);
        }
    }

    private emitImmediate(event: string, ...args: unknown[]): void {
        if (event === 'error') {
            this.emit(event, ...args);
        } else {
            setImmediate(() => {
                this.emit(event, ...args);
            });
        }
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
