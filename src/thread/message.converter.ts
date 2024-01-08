import type {
    ChatRequestAssistantMessage,
    ChatRequestFunctionMessage,
    ChatRequestMessage,
    ChatRequestSystemMessage,
    ChatRequestToolMessage,
    ChatRequestUserMessage,
} from '@azure/openai';
import type {
    ChatMessage,
    ChatRequestSystemMessageWithMetadata,
    ChatRequestToolMessageWithMetadata,
    ChatRequestUserMessageWithMetadata,
    ChatResponseMessageWithMetadata,
} from '../message';
import { ToolEmulator } from './tool.emulator';

export class ThreadMessageConverter {
    private readonly toolEmulator = new ToolEmulator();

    /**
     * Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
     * so they can be sent again to the LLM.
     */
    convert(messages: ChatMessage[]): ChatRequestMessage[] {
        return messages.map((m) => {
            switch (m.role) {
                case 'system': {
                    const systemMessage =
                        m as ChatRequestSystemMessageWithMetadata;
                    return {
                        role: 'system',
                        content: systemMessage.content,
                    } as ChatRequestSystemMessage;
                }
                case 'user': {
                    const userMessage = m as ChatRequestUserMessageWithMetadata;
                    return {
                        role: 'user',
                        content: userMessage.content,
                        name: userMessage.name,
                    } as ChatRequestUserMessage;
                }
                case 'tool': {
                    const toolMessage = m as ChatRequestToolMessageWithMetadata;
                    if (
                        this.toolEmulator.isEmulatedToolCallId(
                            toolMessage.toolCallId,
                        )
                    ) {
                        return {
                            role: 'function',
                            content: toolMessage.content,
                            name: this.toolEmulator.extractFunctionNameFromEmulatedToolCallId(
                                toolMessage.toolCallId,
                            ),
                        } as ChatRequestFunctionMessage;
                    }
                    return {
                        role: 'tool',
                        content: toolMessage.content,
                        toolCallId: toolMessage.toolCallId,
                    } as ChatRequestToolMessage;
                }
                case 'assistant': {
                    const assistantMessage =
                        m as ChatResponseMessageWithMetadata;

                    if (
                        assistantMessage.toolCalls[0] &&
                        this.toolEmulator.isEmulatedToolCallId(
                            assistantMessage.toolCalls[0].id,
                        )
                    ) {
                        // This is a function call
                        return {
                            role: 'assistant',
                            content: assistantMessage.content,
                            functionCall: {
                                name: this.toolEmulator.extractFunctionNameFromEmulatedToolCallId(
                                    assistantMessage.toolCalls[0].id,
                                ),
                                arguments:
                                    assistantMessage.toolCalls[0].function
                                        .arguments,
                            },
                        } as ChatRequestAssistantMessage;
                    }

                    return {
                        role: 'assistant',
                        content: assistantMessage.content,
                        toolCalls: assistantMessage.toolCalls,
                    } as ChatRequestAssistantMessage;
                }
                default:
                    throw new Error(`Unknown message role ${m.role}`);
            }
        });
    }
}
