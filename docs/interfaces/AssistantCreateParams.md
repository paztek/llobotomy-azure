[LLobotoMy for Azure](../README.md) / AssistantCreateParams

# Interface: AssistantCreateParams

## Table of contents

### Properties

- [client](AssistantCreateParams.md#client)
- [deployment](AssistantCreateParams.md#deployment)
- [instructions](AssistantCreateParams.md#instructions)
- [temperature](AssistantCreateParams.md#temperature)
- [tools](AssistantCreateParams.md#tools)
- [topP](AssistantCreateParams.md#topp)

## Properties

### client

• **client**: `OpenAIClient`

#### Defined in

[src/assistant/assistant.ts:11](https://github.com/paztek/llobotomy-azure/blob/93d2d7b/src/assistant/assistant.ts#L11)

___

### deployment

• **deployment**: `string`

#### Defined in

[src/assistant/assistant.ts:19](https://github.com/paztek/llobotomy-azure/blob/93d2d7b/src/assistant/assistant.ts#L19)

___

### instructions

• `Optional` **instructions**: `string`

If provided and if there is no "system" message at the beginning of an array of messages,
then the assistant will prepend a "system" message with these instructions.

#### Defined in

[src/assistant/assistant.ts:17](https://github.com/paztek/llobotomy-azure/blob/93d2d7b/src/assistant/assistant.ts#L17)

___

### temperature

• `Optional` **temperature**: `number`

#### Defined in

[src/assistant/assistant.ts:20](https://github.com/paztek/llobotomy-azure/blob/93d2d7b/src/assistant/assistant.ts#L20)

___

### tools

• **tools**: `ChatCompletionsToolDefinition`[]

#### Defined in

[src/assistant/assistant.ts:18](https://github.com/paztek/llobotomy-azure/blob/93d2d7b/src/assistant/assistant.ts#L18)

___

### topP

• `Optional` **topP**: `number`

#### Defined in

[src/assistant/assistant.ts:21](https://github.com/paztek/llobotomy-azure/blob/93d2d7b/src/assistant/assistant.ts#L21)
