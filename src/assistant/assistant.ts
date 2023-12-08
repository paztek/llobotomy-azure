import type { ChatCompletions, OpenAIClient } from '@azure/openai';
import type { FunctionDefinition } from '@azure/openai';
import type { GetChatCompletionsOptions } from '@azure/openai/types/src/api/models';
import type { ChatMessage } from '@azure/openai/types/src/models/models';

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

    getChatCompletions(messages: ChatMessage[]): Promise<ChatCompletions> {
        // Prepend the messages with our instructions as a "system" message
        const systemMessage: ChatMessage = {
            role: 'system',
            content: this.instructions,
        };
        messages = [systemMessage, ...messages];

        const options: GetChatCompletionsOptions = {
            functions: this.functions,
        };

        return this.client.getChatCompletions(
            this.deployment,
            messages,
            options,
        );
    }
}
