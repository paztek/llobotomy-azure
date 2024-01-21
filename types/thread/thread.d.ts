/// <reference types="node" />
/// <reference types="node" />
import type { ChatCompletionsToolCall, ChatRequestMessage, ChatResponseMessage } from '@azure/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
import type { ChatMessage, ChatRequestMessageWithMetadata } from '../message';
export declare class Thread extends EventEmitter {
    readonly id: string;
    private readonly messages;
    private _stream;
    private readonly converter;
    private readonly toolEmulator;
    constructor(id: string, messages?: ChatMessage[]);
    get stream(): Readable | null;
    addMessage(message: ChatRequestMessageWithMetadata): void;
    run(assistant: Assistant): Promise<void>;
    private doRun;
    private dispatchRequiredAction;
    private handleSubmittedToolOutputs;
    private doAddMessage;
    private emitImmediate;
}
export declare class RequiredAction extends EventEmitter {
    readonly toolCalls: ChatCompletionsToolCall[];
    constructor(toolCalls: ChatCompletionsToolCall[]);
    submitToolOutputs(toolOutputs: ToolOutput[]): void;
}
export interface ToolOutput {
    callId: string;
    value: unknown;
    metadata?: unknown;
}
export declare function isChatResponseMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatResponseMessage;
export declare function isChatRequestMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatRequestMessage;
//# sourceMappingURL=thread.d.ts.map