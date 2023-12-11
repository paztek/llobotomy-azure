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
        this.tools = params.tools;
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
            tools: this.tools,
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
        this.messages = [];
        this._stream = null;
        this.messages = messages;
    }
    get stream() {
        if (!this._stream) {
            return null;
        }
        return this._stream;
    }
    addMessage(message) {
        this.doAddMessage(message);
    }
    run(assistant) {
        this._stream = new stream.Readable({
            read: () => { },
        });
        this.doRun(assistant);
    }
    doRun(assistant) {
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
        stream.once('data', (completion) => {
            const choice = completion.choices[0];
            if (!choice) {
                throw new Error('No completions returned');
            }
            const delta = choice.delta;
            if (!delta) {
                throw new Error('No delta returned');
            }
            if (delta.toolCalls.length > 0) {
                this.handleStreamAsToolCalls(delta.toolCalls, stream, assistant);
            }
            else {
                this.handleStreamAsChatResponseMessage(stream);
            }
        });
    }
    /**
     * Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
     * so they can be sent again to the LLM.
     */
    getRequestMessages() {
        return this.messages.map((m) => {
            if (m.role === 'system' || m.role === 'user' || m.role === 'tool') {
                // These are messages from the application (a.k.a request messages)
                return m;
            }
            else {
                // These are messages from the assistant (a.k.a response messages)
                const responseMessage = m;
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
    handleStreamAsToolCalls(toolCalls, stream, assistant) {
        const argsList = Array(toolCalls.length).fill('');
        stream.on('data', (completions) => {
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
                const finalToolCalls = toolCalls.map((toolCall, index) => ({
                    ...toolCall,
                    function: {
                        ...toolCall.function,
                        arguments: argsList[index],
                    },
                }));
                // Adds the assistant's response to the messages
                const message = {
                    role: 'assistant',
                    content: null,
                    toolCalls: finalToolCalls,
                };
                this.doAddMessage(message);
                const requiredAction = new RequiredAction(finalToolCalls);
                requiredAction.on('submitting', (toolOutputs) => {
                    // Adds the tool outputs to the messages
                    for (const toolOutput of toolOutputs) {
                        const message = {
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
    handleStreamAsChatResponseMessage(stream) {
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
                    toolCalls: [],
                };
                this.doAddMessage(message);
                this.emit('completed');
                this._stream?.push(null);
            }
        });
    }
    doAddMessage(message) {
        this.messages.push(message);
        this.emit('message', message);
        if (isChatRequestMessage(message)) {
            this.emit('message:request', message);
        }
        else {
            this.emit('message:response', message);
        }
    }
}
class RequiredAction extends EventEmitter {
    constructor(toolCalls) {
        super();
        this.toolCalls = toolCalls;
    }
    submitToolOutputs(toolOutputs) {
        this.emit('submitting', toolOutputs);
    }
}
function isChatResponseMessage(m) {
    return 'toolCalls' in m;
}
function isChatRequestMessage(m) {
    return !isChatResponseMessage(m);
}

exports.Assistant = Assistant;
exports.RequiredAction = RequiredAction;
exports.Thread = Thread;
exports.isChatRequestMessage = isChatRequestMessage;
exports.isChatResponseMessage = isChatResponseMessage;
//# sourceMappingURL=index.cjs.map
