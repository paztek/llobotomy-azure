/// <reference types="node" />
import type { ChatRequestMessage, OpenAIClient } from '@azure/openai';
import type { ChatCompletionsToolDefinition } from '@azure/openai/types/src/models/models';
import { Readable } from 'stream';
export interface AssistantCreateParams {
    client: OpenAIClient;
    /**
     * If provided and if there is no "system" message at the beginning of an array of messages,
     * then the assistant will prepend a "system" message with these instructions.
     */
    instructions?: string;
    tools: ChatCompletionsToolDefinition[];
    deployment: string;
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
    constructor(params: AssistantCreateParams);
    streamChatCompletions(messages: ChatRequestMessage[]): Promise<Readable>;
}
//# sourceMappingURL=assistant.d.ts.map