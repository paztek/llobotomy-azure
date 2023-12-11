import type { ChatCompletions, ChatMessage, FunctionCall } from '@azure/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';

export class Thread extends EventEmitter {
    private _stream: Readable | null = null;

    constructor(private readonly messages: ChatMessage[] = []) {
        super();
    }

    get stream(): Readable | null {
        if (!this._stream) {
            return null;
        }

        return this._stream;
    }

    addMessage(message: ChatMessage): void {
        this.messages.push(message);
        this.emit('message', message);
    }

    run(assistant: Assistant): void {
        this._stream = new Readable({
            read: () => {},
        });
        this.doRun(assistant);
    }

    private doRun(assistant: Assistant): void {
        this.emit('in_progress');

        const stream = assistant.listChatCompletions(this.messages);

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

            if (delta.functionCall) {
                const name = delta.functionCall.name;
                this.handleStreamAsFunctionCall(name, stream, assistant);
            } else {
                this.handleStreamAsChatMessage(stream);
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
    private handleStreamAsFunctionCall(
        name: string,
        stream: Readable,
        assistant: Assistant,
    ): void {
        let args = '';

        stream.on('data', (completions: ChatCompletions) => {
            const choice = completions.choices[0];
            if (!choice) {
                throw new Error('No completions returned');
            }
            const delta = choice.delta;
            if (!delta) {
                throw new Error('No delta returned');
            }

            if (delta.functionCall) {
                const functionCall = delta.functionCall;
                if (functionCall.arguments) {
                    args += functionCall.arguments;
                }
            }

            if (choice.finishReason === 'function_call') {
                const functionCall: FunctionCall = {
                    name,
                    arguments: args,
                };

                // Adds the assistant's response to the messages
                const message: ChatMessage = {
                    role: 'assistant',
                    content: null,
                    functionCall,
                };
                this.addMessage(message);

                const requiredAction = new RequiredAction({
                    name,
                    arguments: args,
                });

                requiredAction.on('submitting', (toolOutput: ToolOutput) => {
                    // Adds the tool output to the messages
                    const message: ChatMessage = {
                        role: 'function',
                        name: functionCall.name,
                        content: JSON.stringify(toolOutput),
                    };
                    this.addMessage(message);

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
    private handleStreamAsChatMessage(stream: Readable): void {
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
                const message: ChatMessage = {
                    role: 'assistant',
                    content,
                };
                this.addMessage(message);

                this.emit('completed');
                this._stream?.push(null);
            }
        });
    }
}

export class RequiredAction extends EventEmitter {
    toolCall: ToolCall;

    constructor(functionCall: FunctionCall) {
        super();

        this.toolCall = {
            name: functionCall.name,
            arguments: JSON.parse(functionCall.arguments),
        };
    }

    submitToolOutput(toolOutput: ToolOutput): void {
        this.emit('submitting', toolOutput);
    }
}

export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

export interface ToolOutput {
    value: unknown;
}
