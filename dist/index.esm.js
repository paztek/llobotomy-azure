/*!
 * llobotomy-azure v0.0.10
 * (c) Matthieu Balmes
 * Released under the MIT License.
 */

import { Readable } from 'stream';
import EventEmitter from 'events';

class Assistant {
    constructor(params) {
        this.client = params.client;
        this.instructions = params.instructions;
        this.tools = params.tools;
        this.deployment = params.deployment;
        this.temperature = params.temperature;
        this.topP = params.topP;
    }
    async streamChatCompletions(messages) {
        if (this.instructions &&
            messages.length >= 1 &&
            messages[0]?.role !== 'system') {
            // Prepend the messages with our instructions as a "system" message
            const systemMessage = {
                role: 'system',
                content: this.instructions,
            };
            messages = [systemMessage, ...messages];
        }
        const options = {};
        if (this.temperature !== undefined) {
            options.temperature = this.temperature;
        }
        if (this.topP !== undefined) {
            options.topP = this.topP;
        }
        if (this.tools.length > 0) {
            options.tools = this.tools;
        }
        const events = await this.client.streamChatCompletions(this.deployment, messages, options);
        return Readable.from(events);
    }
}

/**
 * See https://stackoverflow.com/a/41102306/674722 and
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
 * for why we need to set the prototype of the error classes.
 */
class AccessDeniedError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
class InvalidRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
class ContextLengthExceededError extends InvalidRequestError {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
class ContentFilterError extends InvalidRequestError {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
class UnknownError extends Error {
    constructor(message = 'Unknown error') {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
class InvalidToolOutputsError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
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

const TOKEN_JSON_START = '{"';
class Thread extends EventEmitter {
    constructor(id, messages = []) {
        super();
        this.id = id;
        this._stream = null;
        this._messages = [];
        this.converter = new ThreadMessageConverter();
        this._messages = messages;
    }
    get stream() {
        return this._stream;
    }
    get messages() {
        // TODO Return a deep copy
        return this._messages;
    }
    addMessage(message) {
        this.doAddMessage(message);
    }
    async run(assistant) {
        try {
            return await this.doRun(assistant);
        }
        catch (e) {
            this.emitImmediate('error', e);
        }
    }
    async doRun(assistant) {
        if (this._stream) {
            this._stream.push(null);
        }
        this._stream = new Readable({
            read: () => { },
        });
        this.emitImmediate('in_progress');
        const messages = this.converter.convert(this._messages);
        let stream;
        try {
            stream = await assistant.streamChatCompletions(messages);
        }
        catch (e) {
            const error = this.buildError(e);
            return this.emitImmediate('error', error);
        }
        let content = null;
        let toolCalls = [];
        let inHallucinatedToolCallInContent = false;
        let hallucinatedJSONInContent = '';
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
            if (delta.content && delta.content.length) {
                if (content === null &&
                    !inHallucinatedToolCallInContent &&
                    delta.content.startsWith(TOKEN_JSON_START)) {
                    inHallucinatedToolCallInContent = true;
                    hallucinatedJSONInContent += delta.content;
                    return;
                }
                if (content === null && inHallucinatedToolCallInContent) {
                    hallucinatedJSONInContent += delta.content;
                    // If the hallucinated JSON becomes parseable, it means we're at the end of the hallucinated tool call
                    try {
                        JSON.parse(hallucinatedJSONInContent);
                        inHallucinatedToolCallInContent = false;
                        hallucinatedJSONInContent = '';
                        return;
                    }
                    catch (e) {
                        return;
                    }
                }
                /**
                 * Sometimes, especially after some hallucinated JSON, the LLM adds a line break before the actual content
                 */
                if (content === null && delta.content.startsWith('\n')) {
                    delta.content = delta.content.slice(1);
                }
                content = content ? content + delta.content : delta.content;
                // Write also to the stream of the thread
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
            const message = {
                role: 'assistant',
                content,
                toolCalls,
            };
            content = null;
            toolCalls = [];
            this.doAddMessage(message);
            switch (choice.finishReason) {
                case 'stop':
                    this._stream?.push(null);
                    this.emitImmediate('completed');
                    break;
                case 'tool_calls': {
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
        const callback = async (toolOutputs) => this.handleSubmittedToolOutputs(toolOutputs, assistant);
        const requiredAction = new RequiredAction(toolCalls, callback);
        this.emitImmediate('requires_action', requiredAction);
    }
    async handleSubmittedToolOutputs(toolOutputs, assistant) {
        try {
            // Adds the tool outputs to the messages
            for (const toolOutput of toolOutputs) {
                const message = {
                    role: 'tool',
                    content: typeof toolOutput.value === 'string'
                        ? toolOutput.value
                        : JSON.stringify(toolOutput.value),
                    toolCallId: toolOutput.callId,
                };
                if (toolOutput.metadata !== void 0) {
                    message.metadata = toolOutput.metadata;
                }
                this.doAddMessage(message);
            }
            return this.doRun(assistant);
        }
        catch (e) {
            if (e instanceof Error) {
                this.emitImmediate('error', new InvalidToolOutputsError(e.message));
            }
            else {
                this.emitImmediate('error', new InvalidToolOutputsError(String(e)));
            }
        }
    }
    doAddMessage(message) {
        this._messages.push(message);
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
    /**
     * Errors come in all shapes and sizes depending on whether they are raised by the API (authn & authz errors),
     * the model (invalid tool definitions, maximum content length exceeded, etc.) or by the Azure content filtering
     *
     * We try here to handle most of them and return a consistent error type
     */
    buildError(e) {
        if (!e) {
            return new UnknownError();
        }
        if (typeof e === 'string') {
            return new UnknownError(e);
        }
        if (typeof e === 'object' &&
            'message' in e &&
            typeof e.message === 'string') {
            /**
             * The errors that I know of have the following structure:
             * {
             *     message: string;
             *     type: string | null;
             *     code: string | null;
             *     param: string | null;
             *     status?: number;
             * }
             *
             * For HTTP errors, only the "code" is present and looks like "401", "403", etc.
             * For model errors, the "type" seems always present and looks like "invalid_request_error" while the "code" may be present and provide more details on why the request is invalid
             * For content filtering errors, the "code" is "content_filter", the "type" is null and status = 400 (which is why we return a ContentFilterError that extends InvalidRequestError)
             */
            if ('code' in e && typeof e.code === 'string') {
                if (isNaN(parseInt(e.code, 10))) {
                    if (e.code === 'content_filter') {
                        return new ContentFilterError(e.message);
                    }
                }
                else {
                    const code = parseInt(e.code, 10);
                    switch (code) {
                        case 400:
                            return new InvalidRequestError(e.message);
                        case 401:
                        case 403: // I know the difference, we just don't care here
                            return new AccessDeniedError(e.message);
                        default:
                            return new UnknownError(e.message);
                    }
                }
            }
            if ('type' in e && typeof e.type === 'string') {
                if (e.type === 'invalid_request_error') {
                    if ('code' in e && typeof e.code === 'string') {
                        if (e.code === 'context_length_exceeded') {
                            return new ContextLengthExceededError(e.message);
                        }
                    }
                    return new InvalidRequestError(e.message);
                }
            }
        }
        return new UnknownError(String(e));
    }
}
class RequiredAction extends EventEmitter {
    constructor(toolCalls, callback) {
        super();
        this.toolCalls = toolCalls;
        this.callback = callback;
    }
    submitToolOutputs(toolOutputs) {
        return this.callback(toolOutputs);
    }
}
function isChatResponseMessage(m) {
    return 'toolCalls' in m;
}
function isChatRequestMessage(m) {
    return !isChatResponseMessage(m);
}

export { AccessDeniedError, Assistant, ContentFilterError, ContextLengthExceededError, InvalidRequestError, InvalidToolOutputsError, RequiredAction, Thread, ThreadMessageConverter, UnknownError, isChatRequestMessage, isChatResponseMessage };
//# sourceMappingURL=index.esm.js.map
