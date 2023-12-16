import type {
    ChatCompletions,
    ChatCompletionsToolCall,
    ChatRequestMessage,
    ChatRequestToolMessage,
    ChatResponseMessage,
} from '@azure/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';

export class Thread extends EventEmitter {
    private _stream: Readable | null = null;

    constructor(
        private readonly messages: (
            | ChatRequestMessage
            | ChatResponseMessage
        )[] = [],
    ) {
        super();
    }

    get stream(): Readable | null {
        if (!this._stream) {
            return null;
        }

        return this._stream;
    }

    addMessage(message: ChatRequestMessage): void {
        this.doAddMessage(message);
    }

    run(assistant: Assistant): void {
        this._stream = new Readable({
            read: () => {},
        });
        this.doRun(assistant);
    }

    private doRun(assistant: Assistant): void {
        this.emit('in_progress');

        const messages = this.getRequestMessages();

        const stream = assistant.listChatCompletions(messages);

        let content: string | null = null;
        const toolCalls: ChatCompletionsToolCall[] = [];

        stream.on('data', (completion: ChatCompletions) => {
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

            if (choice.finishReason === null) {
                return;
            }

            const finalToolCalls = [...toolCalls];

            const message: ChatResponseMessage = {
                role: 'assistant',
                content,
                toolCalls: finalToolCalls,
            };

            content = null;
            toolCalls.splice(0, toolCalls.length);

            this.doAddMessage(message);

            switch (choice.finishReason) {
                case 'stop':
                    this._stream?.push(null);
                    this.emit('completed');
                    break;
                case 'tool_calls': {
                    const requiredAction = new RequiredAction(finalToolCalls);
                    requiredAction.on(
                        'submitting',
                        (toolOutputs: ToolOutput[]) => {
                            // Adds the tool outputs to the messages
                            for (const toolOutput of toolOutputs) {
                                const message: ChatRequestToolMessage = {
                                    role: 'tool',
                                    content: JSON.stringify(toolOutput.value),
                                    toolCallId: toolOutput.callId,
                                };
                                this.doAddMessage(message);
                            }

                            this.doRun(assistant);
                        },
                    );
                    this.emit('requires_action', requiredAction);
                    break;
                }
                default:
                    throw new Error(
                        `Unknown finish reason ${choice.finishReason}`,
                    );
            }
        });
    }

    /**
     * Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
     * so they can be sent again to the LLM.
     */
    private getRequestMessages(): ChatRequestMessage[] {
        return this.messages.map((m) => {
            if (m.role === 'system' || m.role === 'user' || m.role === 'tool') {
                // These are messages from the application (a.k.a request messages)
                return m as ChatRequestMessage;
            } else {
                // These are messages from the assistant (a.k.a response messages)
                const responseMessage = m as ChatResponseMessage;
                return {
                    role: 'assistant',
                    content: responseMessage.content,
                    toolCalls: responseMessage.toolCalls,
                };
            }
        });
    }

    private doAddMessage(
        message: ChatRequestMessage | ChatResponseMessage,
    ): void {
        this.messages.push(message);
        this.emit('message', message);

        if (isChatRequestMessage(message)) {
            this.emit('message:request', message);
        } else {
            this.emit('message:response', message);
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
