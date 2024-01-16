/*!
 * llobotomy-azure v0.0.4
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
        this.useLegacyFunctions = params.useLegacyFunctions ?? false;
    }
    async streamChatCompletions(messages) {
        // Prepend the messages with our instructions as a "system" message
        const systemMessage = {
            role: 'system',
            content: this.instructions,
        };
        messages = [systemMessage, ...messages];
        const options = {};
        if (this.tools.length > 0) {
            if (this.useLegacyFunctions) {
                // Convert tools to functions
                options.functions = this.tools.map((tool) => {
                    return tool.function;
                });
            }
            else {
                options.tools = this.tools;
            }
        }
        const events = await this.client.streamChatCompletions(this.deployment, messages, options);
        return stream.Readable.from(events);
    }
}

const EMULATED_CALL_PREFIX = 'emulated_call_';
/**
 * Helps with the conversion of tool calls to function calls and vice versa.
 */
class ToolEmulator {
    generateEmulatedToolCallId(functionCall) {
        return `${EMULATED_CALL_PREFIX}${functionCall.name}`;
    }
    isEmulatedToolCallId(toolCallId) {
        return toolCallId.startsWith(EMULATED_CALL_PREFIX);
    }
    extractFunctionNameFromEmulatedToolCallId(toolCallId) {
        return toolCallId.replace(EMULATED_CALL_PREFIX, '');
    }
}

class ThreadMessageConverter {
    constructor() {
        this.toolEmulator = new ToolEmulator();
    }
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
                    if (this.toolEmulator.isEmulatedToolCallId(toolMessage.toolCallId)) {
                        return {
                            role: 'function',
                            content: toolMessage.content,
                            name: this.toolEmulator.extractFunctionNameFromEmulatedToolCallId(toolMessage.toolCallId),
                        };
                    }
                    return {
                        role: 'tool',
                        content: toolMessage.content,
                        toolCallId: toolMessage.toolCallId,
                    };
                }
                case 'assistant': {
                    const assistantMessage = m;
                    if (assistantMessage.toolCalls[0] &&
                        this.toolEmulator.isEmulatedToolCallId(assistantMessage.toolCalls[0].id)) {
                        // This is a function call
                        return {
                            role: 'assistant',
                            content: assistantMessage.content,
                            functionCall: {
                                name: this.toolEmulator.extractFunctionNameFromEmulatedToolCallId(assistantMessage.toolCalls[0].id),
                                arguments: assistantMessage.toolCalls[0].function
                                    .arguments,
                            },
                        };
                    }
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
        this.toolEmulator = new ToolEmulator();
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
    async run(assistant) {
        this._stream = new stream.Readable({
            read: () => { },
        });
        try {
            return await this.doRun(assistant);
        }
        catch (e) {
            this.emitImmediate('error', e);
        }
    }
    async doRun(assistant) {
        this.emitImmediate('in_progress');
        const messages = this.converter.convert(this.messages);
        const stream = await assistant.streamChatCompletions(messages);
        let content = null;
        const toolCalls = [];
        let functionCall = undefined;
        stream.on('data', (completion) => {
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
            // Merge functionCalls
            if (delta.functionCall) {
                if (functionCall) {
                    functionCall.arguments += delta.functionCall.arguments;
                }
                else {
                    functionCall = {
                        ...delta.functionCall,
                        arguments: '',
                    };
                }
            }
            if (choice.finishReason === null) {
                return;
            }
            let finalToolCalls;
            if (toolCalls.length > 0) {
                finalToolCalls = [...toolCalls];
            }
            else if (functionCall) {
                /**
                 * We received a legacy function call, we convert it to a tool call with an emulated ID
                 */
                const toolCall = {
                    type: 'function',
                    function: functionCall,
                    id: this.toolEmulator.generateEmulatedToolCallId(functionCall),
                };
                finalToolCalls = [toolCall];
            }
            else {
                finalToolCalls = [];
            }
            const message = {
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
                    const err = new Error(`Unknown finish reason ${choice.finishReason}`);
                    return this.emitImmediate('error', err);
                }
            }
        });
    }
    dispatchRequiredAction(toolCalls, assistant) {
        const requiredAction = new RequiredAction(toolCalls);
        requiredAction.on('submitting', async (toolOutputs) => this.handleSubmittedToolOutputs(toolOutputs, assistant));
        this.emitImmediate('requires_action', requiredAction);
    }
    async handleSubmittedToolOutputs(toolOutputs, assistant) {
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
        return this.doRun(assistant);
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
        if (event === 'error') {
            this.emit(event, ...args);
        }
        else {
            setImmediate(() => {
                this.emit(event, ...args);
            });
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
//# sourceMappingURL=index.js.map
