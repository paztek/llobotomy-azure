/*!
 * llobotomy-azure v0.0.2
 * (c) Matthieu Balmes
 * Released under the MIT License.
 */

'use strict';

var stream = require('stream');
var EventEmitter = require('events');

class Assistant {
    constructor(params) {
        this.client = params.client;
        this.instructions = params.instructions;
        this.functions = params.functions;
        this.deployment = params.deployment;
    }
    listChatCompletions(messages) {
        // Prepend the messages with our instructions as a "system" message
        const systemMessage = {
            role: 'system',
            content: this.instructions,
        };
        messages = [systemMessage, ...messages];
        const options = {
            functions: this.functions,
        };
        const completions = this.client.listChatCompletions(this.deployment, messages, options);
        return stream.Readable.from(completions, {
            objectMode: true,
        });
    }
}

class Thread extends EventEmitter {
    constructor(messages = []) {
        super();
        this.messages = messages;
        this._stream = null;
    }
    get stream() {
        if (!this._stream) {
            return null;
        }
        return this._stream;
    }
    addMessage(message) {
        this.messages.push(message);
        this.emit('message', message);
    }
    run(assistant) {
        this._stream = new stream.Readable({
            read: () => { },
        });
        this.doRun(assistant);
    }
    doRun(assistant) {
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
        stream.once('data', (completion) => {
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
            }
            else {
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
    handleStreamAsFunctionCall(name, stream, assistant) {
        let args = '';
        stream.on('data', (completions) => {
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
                const functionCall = {
                    name,
                    arguments: args,
                };
                // Adds the assistant's response to the messages
                const message = {
                    role: 'assistant',
                    content: null,
                    functionCall,
                };
                this.addMessage(message);
                const requiredAction = new RequiredAction({
                    name,
                    arguments: args,
                });
                requiredAction.on('submitting', (toolOutput) => {
                    // Adds the tool output to the messages
                    const message = {
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
    handleStreamAsChatMessage(stream) {
        let content = '';
        stream.on('data', (completions) => {
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
                const message = {
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
class RequiredAction extends EventEmitter {
    constructor(functionCall) {
        super();
        this.toolCall = {
            name: functionCall.name,
            arguments: JSON.parse(functionCall.arguments),
        };
    }
    submitToolOutput(toolOutput) {
        this.emit('submitting', toolOutput);
    }
}

exports.Assistant = Assistant;
exports.RequiredAction = RequiredAction;
exports.Thread = Thread;
//# sourceMappingURL=index.cjs.map
