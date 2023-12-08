import type { ChatMessage, FunctionCall } from '@azure/openai';
import EventEmitter from 'events';
import { Assistant } from '../assistant';

export class Thread extends EventEmitter {
    messages: ChatMessage[] = [];

    constructor() {
        super();
    }

    async query(text: string, assistant: Assistant): Promise<void> {
        const userMessage: ChatMessage = {
            role: 'user',
            content: text,
        };

        this.messages.push(userMessage);

        await this.doRun(assistant);
    }

    private async doRun(assistant: Assistant): Promise<void> {
        this.emit('in_progress');

        const completions = await assistant.getChatCompletions(this.messages);

        if (!completions.choices[0]) {
            throw new Error('No completions returned');
        }

        const message = completions.choices[0].message as ChatMessage;

        // Adds the assistant's response to the messages
        this.messages.push(message);

        if (message.functionCall) {
            const functionCall = message.functionCall;

            const requiredAction = new RequiredAction(functionCall);
            requiredAction.on('submitting', (toolOutput: ToolOutput) => {
                // Adds the tool output to the messages
                this.messages.push({
                    role: 'function',
                    name: functionCall.name,
                    content: JSON.stringify(toolOutput),
                });

                this.doRun(assistant);
            });

            this.emit('requires_action', requiredAction);
        } else {
            this.emit('message', message.content);
        }
    }
}

export class RequiredAction extends EventEmitter {
    toolCall: ToolCall;

    constructor(functionCall: FunctionCall) {
        super();

        this.toolCall = {
            name: functionCall.name,
            arguments: JSON.parse(functionCall.arguments),
        };
    }

    submitToolOutput(toolOutput: ToolOutput): void {
        this.emit('submitting', toolOutput);
    }
}

export interface ToolCall {
    name: string;
    arguments: Record<string, unknown>;
}

export interface ToolOutput {
    value: unknown;
}
