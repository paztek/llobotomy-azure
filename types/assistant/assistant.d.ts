/// <reference types="node" />
import type { ChatRequestMessage, OpenAIClient } from '@azure/openai';
import type { ChatCompletionsToolDefinition } from '@azure/openai/types/src/models/models';
import { Readable } from 'stream';
export interface AssistantCreateParams {
    client: OpenAIClient;
    instructions: string;
    tools: ChatCompletionsToolDefinition[];
    deployment: string;
}
export declare class Assistant {
    readonly client: OpenAIClient;
    private readonly instructions;
    private readonly tools;
    private readonly deployment;
    constructor(params: AssistantCreateParams);
    listChatCompletions(messages: ChatRequestMessage[]): Readable;
}
//# sourceMappingURL=assistant.d.ts.map