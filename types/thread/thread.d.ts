/// <reference types="node" />
/// <reference types="node" />
import type { ChatRequestMessage, ChatResponseMessage } from '@azure/openai';
import type { ChatCompletionsFunctionToolCall } from '@azure/openai/types/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
import type { ChatMessage } from '../message';
export declare class Thread extends EventEmitter {
    readonly id: string;
    private _stream;
    private readonly _messages;
    private readonly converter;
    constructor(id: string, messages?: ChatMessage[]);
    get stream(): Readable | null;
    get messages(): ChatMessage[];
    addMessage(message: ChatMessage): void;
    run(assistant: Assistant): Promise<void>;
    private doRun;
    private dispatchRequiredAction;
    private handleSubmittedToolOutputs;
    private doAddMessage;
    private emitImmediate;
    /**
     * Errors come in all shapes and sizes depending on whether they are raised by the API (authn & authz errors),
     * the model (invalid tool definitions, maximum content length exceeded, etc.) or by the Azure content filtering
     *
     * We try here to handle most of them and return a consistent error type
     */
    private buildError;
}
export declare class RequiredAction extends EventEmitter {
    readonly toolCalls: ChatCompletionsFunctionToolCall[];
    private readonly callback;
    constructor(toolCalls: ChatCompletionsFunctionToolCall[], callback: (toolOutputs: ToolOutput[]) => Promise<void>);
    submitToolOutputs(toolOutputs: ToolOutput[]): Promise<void>;
}
export interface ToolOutput {
    callId: string;
    value: unknown;
    metadata?: unknown;
}
export declare function isChatResponseMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatResponseMessage;
export declare function isChatRequestMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatRequestMessage;
//# sourceMappingURL=thread.d.ts.map