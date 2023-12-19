import type { ChatResponseMessage } from '@azure/openai';
import type {
    ChatRequestAssistantMessage,
    ChatRequestFunctionMessage,
    ChatRequestSystemMessage,
    ChatRequestToolMessage,
    ChatRequestUserMessage,
} from '@azure/openai/types/src/models/models';

export type WithMetadata<T, U = unknown> = T & { metadata?: U };

export type ChatRequestSystemMessageWithMetadata =
    WithMetadata<ChatRequestSystemMessage>;
export type ChatRequestUserMessageWithMetadata =
    WithMetadata<ChatRequestUserMessage>;
export type ChatRequestAssistantMessageWithMetadata =
    WithMetadata<ChatRequestAssistantMessage>;
export type ChatRequestToolMessageWithMetadata =
    WithMetadata<ChatRequestToolMessage>;
export type ChatRequestFunctionMessageWithMetadata =
    WithMetadata<ChatRequestFunctionMessage>;

export type ChatResponseMessageWithMetadata = WithMetadata<ChatResponseMessage>;

export type ChatRequestMessageWithMetadata =
    | ChatRequestSystemMessageWithMetadata
    | ChatRequestUserMessageWithMetadata
    | ChatRequestAssistantMessageWithMetadata
    | ChatRequestToolMessageWithMetadata
    | ChatRequestFunctionMessageWithMetadata;

export type ChatMessage =
    | ChatRequestMessageWithMetadata
    | ChatResponseMessageWithMetadata;
