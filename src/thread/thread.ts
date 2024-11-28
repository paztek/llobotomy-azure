import type {
    ChatCompletions,
    ChatRequestMessage,
    ChatResponseMessage,
} from '@azure/openai';
import type { ChatCompletionsFunctionToolCall } from '@azure/openai/types/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
import type {
    ChatMessage,
    ChatRequestToolMessageWithMetadata,
} from '../message';
import {
    AccessDeniedError,
    ContentFilterError,
    ContextLengthExceededError,
    InvalidRequestError,
    InvalidToolOutputsError,
    UnknownError,
} from './errors';
import { ThreadMessageConverter } from './message.converter';

const TOKEN_JSON_START = '{"';

export class Thread extends EventEmitter {
    private _stream: Readable | null = null;
    private readonly _messages: ChatMessage[] = [];
    private readonly converter = new ThreadMessageConverter();

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

    addMessage(message: ChatMessage): void {
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

        let stream: Readable;

        try {
            stream = await assistant.streamChatCompletions(messages);
        } catch (e) {
            const error = this.buildError(e);
            return this.emitImmediate('error', error);
        }

        let content: string | null = null;
        let toolCalls: ChatCompletionsFunctionToolCall[] = [];

        let inHallucinatedToolCallInContent = false;
        let hallucinatedJSONInContent = '';

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

            if (delta.content && delta.content.length) {
                if (
                    content === null &&
                    !inHallucinatedToolCallInContent &&
                    delta.content.startsWith(TOKEN_JSON_START)
                ) {
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
                    } catch (e) {
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
                for (const toolCall of delta.toolCalls as ChatCompletionsFunctionToolCall[]) {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    const index = toolCall['index'] as number; // Not typed yet by the @azure/openai package
                    const existingToolCall = toolCalls[index] as
                        | ChatCompletionsFunctionToolCall
                        | undefined;

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

            const message: ChatResponseMessage = {
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
                    this.dispatchRequiredAction(
                        message.toolCalls as ChatCompletionsFunctionToolCall[],
                        assistant,
                    );
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
        toolCalls: ChatCompletionsFunctionToolCall[],
        assistant: Assistant,
    ): void {
        const callback = async (toolOutputs: ToolOutput[]) =>
            this.handleSubmittedToolOutputs(toolOutputs, assistant);
        const requiredAction = new RequiredAction(toolCalls, callback);
        this.emitImmediate('requires_action', requiredAction);
    }

    private async handleSubmittedToolOutputs(
        toolOutputs: ToolOutput[],
        assistant: Assistant,
    ): Promise<void> {
        try {
            // Adds the tool outputs to the messages
            for (const toolOutput of toolOutputs) {
                const message: ChatRequestToolMessageWithMetadata = {
                    role: 'tool',
                    content:
                        typeof toolOutput.value === 'string'
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
        } catch (e) {
            if (e instanceof Error) {
                this.emitImmediate(
                    'error',
                    new InvalidToolOutputsError(e.message),
                );
            } else {
                this.emitImmediate(
                    'error',
                    new InvalidToolOutputsError(String(e)),
                );
            }
        }
    }

    private doAddMessage(message: ChatMessage): void {
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

    /**
     * Errors come in all shapes and sizes depending on whether they are raised by the API (authn & authz errors),
     * the model (invalid tool definitions, maximum content length exceeded, etc.) or by the Azure content filtering
     *
     * We try here to handle most of them and return a consistent error type
     */
    private buildError(e: unknown): Error {
        if (!e) {
            return new UnknownError();
        }

        if (typeof e === 'string') {
            return new UnknownError(e);
        }

        if (
            typeof e === 'object' &&
            'message' in e &&
            typeof e.message === 'string'
        ) {
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
                } else {
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

export class RequiredAction extends EventEmitter {
    constructor(
        public readonly toolCalls: ChatCompletionsFunctionToolCall[],
        private readonly callback: (toolOutputs: ToolOutput[]) => Promise<void>,
    ) {
        super();
    }

    submitToolOutputs(toolOutputs: ToolOutput[]): Promise<void> {
        return this.callback(toolOutputs);
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
