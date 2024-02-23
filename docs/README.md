LLobotoMy for Azure

# LLobotoMy for Azure

## Table of contents

### Classes

- [AccessDeniedError](classes/AccessDeniedError.md)
- [Assistant](classes/Assistant.md)
- [ContentFilterError](classes/ContentFilterError.md)
- [ContextLengthExceededError](classes/ContextLengthExceededError.md)
- [InvalidRequestError](classes/InvalidRequestError.md)
- [InvalidToolOutputsError](classes/InvalidToolOutputsError.md)
- [RequiredAction](classes/RequiredAction.md)
- [Thread](classes/Thread.md)
- [ThreadMessageConverter](classes/ThreadMessageConverter.md)
- [ToolEmulator](classes/ToolEmulator.md)
- [UnknownError](classes/UnknownError.md)

### Interfaces

- [AssistantCreateParams](interfaces/AssistantCreateParams.md)
- [ToolOutput](interfaces/ToolOutput.md)

### Type Aliases

- [ChatMessage](README.md#chatmessage)
- [ChatRequestAssistantMessageWithMetadata](README.md#chatrequestassistantmessagewithmetadata)
- [ChatRequestFunctionMessageWithMetadata](README.md#chatrequestfunctionmessagewithmetadata)
- [ChatRequestMessageWithMetadata](README.md#chatrequestmessagewithmetadata)
- [ChatRequestSystemMessageWithMetadata](README.md#chatrequestsystemmessagewithmetadata)
- [ChatRequestToolMessageWithMetadata](README.md#chatrequesttoolmessagewithmetadata)
- [ChatRequestUserMessageWithMetadata](README.md#chatrequestusermessagewithmetadata)
- [ChatResponseMessageWithMetadata](README.md#chatresponsemessagewithmetadata)
- [WithMetadata](README.md#withmetadata)

### Functions

- [isChatRequestMessage](README.md#ischatrequestmessage)
- [isChatResponseMessage](README.md#ischatresponsemessage)

## Type Aliases

### ChatMessage

Ƭ **ChatMessage**: [`ChatRequestMessageWithMetadata`](README.md#chatrequestmessagewithmetadata) \| [`ChatResponseMessageWithMetadata`](README.md#chatresponsemessagewithmetadata)

#### Defined in

[src/message/message.ts:32](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L32)

___

### ChatRequestAssistantMessageWithMetadata

Ƭ **ChatRequestAssistantMessageWithMetadata**: [`WithMetadata`](README.md#withmetadata)<`ChatRequestAssistantMessage`\>

#### Defined in

[src/message/message.ts:16](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L16)

___

### ChatRequestFunctionMessageWithMetadata

Ƭ **ChatRequestFunctionMessageWithMetadata**: [`WithMetadata`](README.md#withmetadata)<`ChatRequestFunctionMessage`\>

#### Defined in

[src/message/message.ts:20](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L20)

___

### ChatRequestMessageWithMetadata

Ƭ **ChatRequestMessageWithMetadata**: [`ChatRequestSystemMessageWithMetadata`](README.md#chatrequestsystemmessagewithmetadata) \| [`ChatRequestUserMessageWithMetadata`](README.md#chatrequestusermessagewithmetadata) \| [`ChatRequestAssistantMessageWithMetadata`](README.md#chatrequestassistantmessagewithmetadata) \| [`ChatRequestToolMessageWithMetadata`](README.md#chatrequesttoolmessagewithmetadata) \| [`ChatRequestFunctionMessageWithMetadata`](README.md#chatrequestfunctionmessagewithmetadata)

#### Defined in

[src/message/message.ts:25](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L25)

___

### ChatRequestSystemMessageWithMetadata

Ƭ **ChatRequestSystemMessageWithMetadata**: [`WithMetadata`](README.md#withmetadata)<`ChatRequestSystemMessage`\>

#### Defined in

[src/message/message.ts:12](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L12)

___

### ChatRequestToolMessageWithMetadata

Ƭ **ChatRequestToolMessageWithMetadata**: [`WithMetadata`](README.md#withmetadata)<`ChatRequestToolMessage`\>

#### Defined in

[src/message/message.ts:18](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L18)

___

### ChatRequestUserMessageWithMetadata

Ƭ **ChatRequestUserMessageWithMetadata**: [`WithMetadata`](README.md#withmetadata)<`ChatRequestUserMessage`\>

#### Defined in

[src/message/message.ts:14](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L14)

___

### ChatResponseMessageWithMetadata

Ƭ **ChatResponseMessageWithMetadata**: [`WithMetadata`](README.md#withmetadata)<`ChatResponseMessage`\>

#### Defined in

[src/message/message.ts:23](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L23)

___

### WithMetadata

Ƭ **WithMetadata**<`T`, `U`\>: `T` & { `metadata?`: `U`  }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | `T` |
| `U` | `unknown` |

#### Defined in

[src/message/message.ts:10](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/message/message.ts#L10)

## Functions

### isChatRequestMessage

▸ **isChatRequestMessage**(`m`): m is ChatRequestMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `ChatRequestMessage` \| `ChatResponseMessage` |

#### Returns

m is ChatRequestMessage

#### Defined in

[src/thread/thread.ts:429](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/thread/thread.ts#L429)

___

### isChatResponseMessage

▸ **isChatResponseMessage**(`m`): m is ChatResponseMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `ChatRequestMessage` \| `ChatResponseMessage` |

#### Returns

m is ChatResponseMessage

#### Defined in

[src/thread/thread.ts:423](https://github.com/paztek/llobotomy-azure/blob/5212bc9/src/thread/thread.ts#L423)
