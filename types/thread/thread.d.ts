/// <reference types="node" />
/// <reference types="node" />
import type { ChatMessage, FunctionCall } from '@azure/openai';
import EventEmitter from 'events';
import { type Readable } from 'stream';
import { Assistant } from '../assistant';
export declare class Thread extends EventEmitter {
    private readonly messages;
    private _stream;
    constructor(messages?: ChatMessage[]);
    get stream(): Readable;
    addMessage(message: ChatMessage): void;
    run(assistant: Assistant): void;
    private doRun;
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
    private handleStreamAsFunctionCall;
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
    private handleStreamAsChatMessage;
}
export declare class RequiredAction extends EventEmitter {
    toolCall: ToolCall;
    constructor(functionCall: FunctionCall);
    submitToolOutput(toolOutput: ToolOutput): void;
}
export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}
export interface ToolOutput {
    value: unknown;
}
//# sourceMappingURL=thread.d.ts.map