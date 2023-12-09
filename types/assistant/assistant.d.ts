/// <reference types="node" />
import type { FunctionDefinition, OpenAIClient } from '@azure/openai';
import type { ChatMessage } from '@azure/openai/types/src/models/models';
import { Readable } from 'stream';
export interface AssistantCreateParams {
    client: OpenAIClient;
    instructions: string;
    functions: FunctionDefinition[];
    deployment: string;
}
export declare class Assistant {
    readonly client: OpenAIClient;
    private readonly instructions;
    private readonly functions;
    private readonly deployment;
    constructor(params: AssistantCreateParams);
    listChatCompletions(messages: ChatMessage[]): Readable;
}
//# sourceMappingURL=assistant.d.ts.map