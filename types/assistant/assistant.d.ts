/// <reference types="node" />
import type { ChatRequestMessage, OpenAIClient } from '@azure/openai';
import type { ChatCompletionsToolDefinition } from '@azure/openai/types/src/models/models';
import { Readable } from 'stream';
export interface AssistantCreateParams {
    client: OpenAIClient;
    instructions: string;
    tools: ChatCompletionsToolDefinition[];
    deployment: string;
    useLegacyFunctions?: boolean;
    temperature?: number;
    topP?: number;
}
export declare class Assistant {
    readonly client: OpenAIClient;
    private readonly instructions;
    private readonly tools;
    private readonly deployment;
    private readonly temperature;
    private readonly topP;
    private readonly useLegacyFunctions;
    constructor(params: AssistantCreateParams);
    streamChatCompletions(messages: ChatRequestMessage[]): Promise<Readable>;
}
//# sourceMappingURL=assistant.d.ts.map