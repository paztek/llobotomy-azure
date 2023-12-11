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
    private readonly messages: (ChatRequestMessage | ChatResponseMessage)[] =
        [];
    private _stream: Readable | null = null;

    constructor(messages: ChatRequestMessage[] = []) {
        super();
        this.messages = messages;
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

        /**
         * When the LLM responds with a function call, the first completion's first choice looks like this:
         * {
         *   index: 0,
         *   finishReason: null,
         *   delta: {
         *     role: 'assistant',
         *     functionCall: { name: 'get_customer_profile', arguments: undefined }
         *   },
         *   contentFilterResults: {}
         * }
         *
         * When the LLM responds with a message, the first completion's first choice looks like this:
         * {
         *   index: 0,
         *   finishReason: null,
         *   delta: {
         *     role: 'assistant',
         *   },
         *   contentFilterResults: {}
         *
         * We're only interested in the first completion and then we let the dedicated handler handle the rest of the stream
         */
        stream.once('data', (completion: ChatCompletions) => {
            const choice = completion.choices[0];
            if (!choice) {
                throw new Error('No completions returned');
            }

            const delta = choice.delta;
            if (!delta) {
                throw new Error('No delta returned');
            }

            if (delta.toolCalls.length > 0) {
                this.handleStreamAsToolCalls(
                    delta.toolCalls,
                    stream,
                    assistant,
                );
            } else {
                this.handleStreamAsChatResponseMessage(stream);
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

    /**
     * Handles the stream as a function call after we determined from the beginning of the stream that it is a function call.
     * The stream emits some completions.
     * The first choice of these completions successively looks like this:
     * {
     *   index: 0,
     *   finishReason: null,
     *   delta: { functionCall: { name: undefined, arguments: '{"' } }, <---- beginning of the arguments as a stringified JSON
     *   contentFilterResults: {}
     * }
     * ... <---- more completions
     * {
     *   index: 0,
     *   finishReason: null,
     *   delta: { functionCall: { name: undefined, arguments: '"}' } } <---- end of the arguments as a stringified JSON
     * }
     * { index: 0, finishReason: 'function_call', delta: {} } <---- end of the function call
     */
    private handleStreamAsToolCalls(
        toolCalls: ChatCompletionsToolCall[],
        stream: Readable,
        assistant: Assistant,
    ): void {
        const argsList = Array(toolCalls.length).fill('');

        stream.on('data', (completions: ChatCompletions) => {
            const choice = completions.choices[0];
            if (!choice) {
                throw new Error('No completions returned');
            }
            const delta = choice.delta;
            if (!delta) {
                throw new Error('No delta returned');
            }

            delta.toolCalls.forEach((toolCall, index) => {
                argsList[index] += toolCall.function.arguments;
            });

            if (choice.finishReason === 'tool_calls') {
                const finalToolCalls: ChatCompletionsToolCall[] = toolCalls.map(
                    (toolCall, index) => ({
                        ...toolCall,
                        function: {
                            ...toolCall.function,
                            arguments: argsList[index],
                        },
                    }),
                );

                // Adds the assistant's response to the messages
                const message: ChatResponseMessage = {
                    role: 'assistant',
                    content: null,
                    toolCalls: finalToolCalls,
                };
                this.doAddMessage(message);

                const requiredAction = new RequiredAction(finalToolCalls);

                requiredAction.on('submitting', (toolOutputs: ToolOutput[]) => {
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
                });

                this.emit('requires_action', requiredAction);
            }
        });
    }

    /**
     * Handles the stream as a chat message after we determined from the beginning of the stream that it is a chat message.
     * The stream emits some completions.
     * The first choice of these completions successively looks like this:
     * {
     *   index: 0,
     *   finishReason: null,
     *   delta: { content: "Lorem" }, <---- beginning of the response
     *   contentFilterResults: {}
     * }
     * ... <---- more completions
     * {
     *   index: 0,
     *   finishReason: null,
     *   delta: { content: " ipsum" } <---- end of the response
     * }
     * { index: 0, finishReason: 'stop', delta: {} } <---- end of the message
     */
    private handleStreamAsChatResponseMessage(stream: Readable): void {
        let content = '';

        stream.on('data', (completions: ChatCompletions) => {
            const choice = completions.choices[0];
            if (!choice) {
                throw new Error('No completions returned');
            }
            const delta = choice.delta;
            if (!delta) {
                throw new Error('No delta returned');
            }

            if (delta.content) {
                content += delta.content;

                // Write also to the stream of the thread
                if (!this._stream) {
                    throw new Error('No stream available');
                }
                this._stream?.push(delta.content);
            }

            if (choice.finishReason === 'stop') {
                // Adds the assistant's response to the messages
                const message: ChatResponseMessage = {
                    role: 'assistant',
                    content,
                    toolCalls: [],
                };
                this.doAddMessage(message);

                this.emit('completed');
                this._stream?.push(null);
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

export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
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
