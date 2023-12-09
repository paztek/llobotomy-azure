import type { FunctionDefinition, OpenAIClient } from '@azure/openai';
import type { GetChatCompletionsOptions } from '@azure/openai/types/src/api/models';
import type { ChatMessage } from '@azure/openai/types/src/models/models';
import { Readable } from 'stream';

export interface AssistantCreateParams {
    client: OpenAIClient;
    instructions: string;
    functions: FunctionDefinition[];
    deployment: string;
}

export class Assistant {
    public readonly client: OpenAIClient;

    private readonly instructions: string;
    private readonly functions: FunctionDefinition[];
    private readonly deployment: string;

    constructor(params: AssistantCreateParams) {
        this.client = params.client;
        this.instructions = params.instructions;
        this.functions = params.functions;
        this.deployment = params.deployment;
    }

    listChatCompletions(messages: ChatMessage[]): Readable {
        // Prepend the messages with our instructions as a "system" message
        const systemMessage: ChatMessage = {
            role: 'system',
            content: this.instructions,
        };
        messages = [systemMessage, ...messages];

        const options: GetChatCompletionsOptions = {
            functions: this.functions,
        };

        const completions = this.client.listChatCompletions(
            this.deployment,
            messages,
            options,
        );

        return Readable.from(completions, {
            objectMode: true,
        });
    }
}
