[LLobotoMy for Azure](../README.md) / Assistant

# Class: Assistant

## Table of contents

### Constructors

- [constructor](Assistant.md#constructor)

### Properties

- [client](Assistant.md#client)
- [deployment](Assistant.md#deployment)
- [instructions](Assistant.md#instructions)
- [tools](Assistant.md#tools)

### Methods

- [listChatCompletions](Assistant.md#listchatcompletions)

## Constructors

### constructor

• **new Assistant**(`params`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`AssistantCreateParams`](../interfaces/AssistantCreateParams.md) |

#### Defined in

[src/assistant/assistant.ts:24](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/assistant/assistant.ts#L24)

## Properties

### client

• `Readonly` **client**: `OpenAIClient`

#### Defined in

[src/assistant/assistant.ts:18](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/assistant/assistant.ts#L18)

___

### deployment

• `Private` `Readonly` **deployment**: `string`

#### Defined in

[src/assistant/assistant.ts:22](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/assistant/assistant.ts#L22)

___

### instructions

• `Private` `Readonly` **instructions**: `string`

#### Defined in

[src/assistant/assistant.ts:20](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/assistant/assistant.ts#L20)

___

### tools

• `Private` `Readonly` **tools**: `ChatCompletionsFunctionToolDefinition`[]

#### Defined in

[src/assistant/assistant.ts:21](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/assistant/assistant.ts#L21)

## Methods

### listChatCompletions

▸ **listChatCompletions**(`messages`): `Readable`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messages` | `ChatRequestMessage`[] |

#### Returns

`Readable`

#### Defined in

[src/assistant/assistant.ts:31](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/assistant/assistant.ts#L31)
