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
        const options = {};
        if (this.tools.length > 0) {
            options.tools = this.tools;
        }
        const completions = this.client.listChatCompletions(this.deployment, messages, options);
        return stream.Readable.from(completions, {
            objectMode: true,
        });
    }
}

class ThreadMessageConverter {
    /**
     * Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
     * so they can be sent again to the LLM.
     */
    convert(messages) {
        return messages.map((m) => {
            switch (m.role) {
                case 'system': {
                    const systemMessage = m;
                    return {
                        role: 'system',
                        content: systemMessage.content,
                    };
                }
                case 'user': {
                    const userMessage = m;
                    return {
                        role: 'user',
                        content: userMessage.content,
                        name: userMessage.name,
                    };
                }
                case 'tool': {
                    const toolMessage = m;
                    return {
                        role: 'tool',
                        content: toolMessage.content,
                        toolCallId: toolMessage.toolCallId,
                    };
                }
                case 'assistant': {
                    const assistantMessage = m;
                    return {
                        role: 'assistant',
                        content: assistantMessage.content,
                        toolCalls: assistantMessage.toolCalls,
                    };
                }
                default:
                    throw new Error(`Unknown message role ${m.role}`);
            }
        });
    }
}

class Thread extends EventEmitter {
    constructor(messages = []) {
        super();
        this.messages = messages;
        this._stream = null;
        this.converter = new ThreadMessageConverter();
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
        this.emitImmediate('in_progress');
        const messages = this.converter.convert(this.messages);
        const stream = assistant.listChatCompletions(messages);
        let content = null;
        const toolCalls = [];
        stream.on('data', (completion) => {
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
                    }
                    else {
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
            const message = {
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
                    this.emitImmediate('completed');
                    break;
                case 'tool_calls': {
                    const requiredAction = new RequiredAction(finalToolCalls);
                    requiredAction.on('submitting', (toolOutputs) => {
                        // Adds the tool outputs to the messages
                        for (const toolOutput of toolOutputs) {
                            const message = {
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
                    });
                    this.emitImmediate('requires_action', requiredAction);
                    break;
                }
                default:
                    throw new Error(`Unknown finish reason ${choice.finishReason}`);
            }
        });
    }
    doAddMessage(message) {
        this.messages.push(message);
        this.emitImmediate('message', message);
        if (isChatRequestMessage(message)) {
            this.emitImmediate('message:request', message);
        }
        else {
            this.emitImmediate('message:response', message);
        }
    }
    emitImmediate(event, ...args) {
        setImmediate(() => {
            this.emit(event, ...args);
        });
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
