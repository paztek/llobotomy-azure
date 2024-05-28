import type {
    ChatRequestAssistantMessage,
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

export class ThreadMessageConverter {
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
                    return {
                        role: 'tool',
                        content: toolMessage.content,
                        toolCallId: toolMessage.toolCallId,
                    } as ChatRequestToolMessage;
                }
                case 'assistant': {
                    const assistantMessage =
                        m as ChatResponseMessageWithMetadata;

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
