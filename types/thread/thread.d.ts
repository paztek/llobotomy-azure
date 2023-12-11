/// <reference types="node" />
/// <reference types="node" />
import type { ChatCompletionsToolCall, ChatRequestMessage, ChatResponseMessage } from '@azure/openai';
import EventEmitter from 'events';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
export declare class Thread extends EventEmitter {
    private readonly messages;
    private _stream;
    constructor(messages?: ChatRequestMessage[]);
    get stream(): Readable | null;
    addMessage(message: ChatRequestMessage): void;
    run(assistant: Assistant): void;
    private doRun;
    /**
     * Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
     * so they can be sent again to the LLM.
     */
    private getRequestMessages;
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
    private handleStreamAsToolCalls;
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
    private handleStreamAsChatResponseMessage;
    private doAddMessage;
}
export declare class RequiredAction extends EventEmitter {
    readonly toolCalls: ChatCompletionsToolCall[];
    constructor(toolCalls: ChatCompletionsToolCall[]);
    submitToolOutputs(toolOutputs: ToolOutput[]): void;
}
export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}
export interface ToolOutput {
    callId: string;
    value: unknown;
}
export declare function isChatResponseMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatResponseMessage;
export declare function isChatRequestMessage(m: ChatRequestMessage | ChatResponseMessage): m is ChatRequestMessage;
//# sourceMappingURL=thread.d.ts.map