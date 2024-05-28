[LLobotoMy for Azure](../README.md) / Assistant

# Class: Assistant

## Table of contents

### Constructors

- [constructor](Assistant.md#constructor)

### Properties

- [client](Assistant.md#client)
- [deployment](Assistant.md#deployment)
- [instructions](Assistant.md#instructions)
- [temperature](Assistant.md#temperature)
- [tools](Assistant.md#tools)
- [topP](Assistant.md#topp)

### Methods

- [streamChatCompletions](Assistant.md#streamchatcompletions)

## Constructors

### constructor

• **new Assistant**(`params`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`AssistantCreateParams`](../interfaces/AssistantCreateParams.md) |

#### Defined in

[src/assistant/assistant.ts:33](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L33)

## Properties

### client

• `Readonly` **client**: `OpenAIClient`

#### Defined in

[src/assistant/assistant.ts:25](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L25)

___

### deployment

• `Private` `Readonly` **deployment**: `string`

#### Defined in

[src/assistant/assistant.ts:29](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L29)

___

### instructions

• `Private` `Readonly` **instructions**: `undefined` \| `string`

#### Defined in

[src/assistant/assistant.ts:27](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L27)

___

### temperature

• `Private` `Readonly` **temperature**: `undefined` \| `number`

#### Defined in

[src/assistant/assistant.ts:30](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L30)

___

### tools

• `Private` `Readonly` **tools**: `ChatCompletionsToolDefinition`[]

#### Defined in

[src/assistant/assistant.ts:28](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L28)

___

### topP

• `Private` `Readonly` **topP**: `undefined` \| `number`

#### Defined in

[src/assistant/assistant.ts:31](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L31)

## Methods

### streamChatCompletions

▸ **streamChatCompletions**(`messages`): `Promise`<`Readable`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `messages` | `ChatRequestMessage`[] |

#### Returns

`Promise`<`Readable`\>

#### Defined in

[src/assistant/assistant.ts:43](https://github.com/paztek/llobotomy-azure/blob/daad388/src/assistant/assistant.ts#L43)
