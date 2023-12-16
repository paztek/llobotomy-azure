/// <reference types="node" />
/// <reference types="node" />
import type { ChatCompletionsToolCall, ChatRequestMessage, ChatResponseMessage } from '@azure/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
export declare class Thread extends EventEmitter {
    private readonly messages;
    private _stream;
    constructor(messages?: (ChatRequestMessage | ChatResponseMessage)[]);
    get stream(): Readable | null;
    addMessage(message: ChatRequestMessage): void;
    run(assistant: Assistant): void;
    private doRun;
    /**
     * Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
     * so they can be sent again to the LLM.
     */
    private getRequestMessages;
    private doAddMessage;
}
export declare class RequiredAction extends EventEmitter {
    readonly toolCalls: ChatCompletionsToolCall[];
    constructor(toolCalls: ChatCompletionsToolCall[]);
    submitToolOutputs(toolOutputs: ToolOutput[]): void;
}
export interface ToolOutput {
    callId: string;
    value: unknown;
}
export declare function isChatResponseMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatResponseMessage;
export declare function isChatRequestMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatRequestMessage;
//# sourceMappingURL=thread.d.ts.map