import type {
    ChatRequestMessage,
    ChatRequestSystemMessage,
    GetChatCompletionsOptions,
    OpenAIClient,
} from '@azure/openai';
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

export class Assistant {
    public readonly client: OpenAIClient;

    private readonly instructions: string;
    private readonly tools: ChatCompletionsToolDefinition[];
    private readonly deployment: string;
    private readonly temperature: number | undefined;
    private readonly topP: number | undefined;
    private readonly useLegacyFunctions: boolean;

    constructor(params: AssistantCreateParams) {
        this.client = params.client;
        this.instructions = params.instructions;
        this.tools = params.tools;
        this.deployment = params.deployment;

        this.temperature = params.temperature;
        this.topP = params.topP;

        this.useLegacyFunctions = params.useLegacyFunctions ?? false;
    }

    async streamChatCompletions(
        messages: ChatRequestMessage[],
    ): Promise<Readable> {
        // Prepend the messages with our instructions as a "system" message
        const systemMessage: ChatRequestSystemMessage = {
            role: 'system',
            content: this.instructions,
        };
        messages = [systemMessage, ...messages];

        const options: GetChatCompletionsOptions = {};

        if (this.temperature !== undefined) {
            options.temperature = this.temperature;
        }

        if (this.topP !== undefined) {
            options.topP = this.topP;
        }

        if (this.tools.length > 0) {
            if (this.useLegacyFunctions) {
                // Convert tools to functions
                options.functions = this.tools.map((tool) => {
                    return tool.function;
                });
            } else {
                options.tools = this.tools;
            }
        }
        const events = await this.client.streamChatCompletions(
            this.deployment,
            messages,
            options,
        );

        return Readable.from(events);
    }
}
