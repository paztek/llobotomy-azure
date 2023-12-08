[LLobotoMy for Azure](../README.md) / Assistant

# Class: Assistant

## Table of contents

### Constructors

- [constructor](Assistant.md#constructor)

### Properties

- [client](Assistant.md#client)
- [deployment](Assistant.md#deployment)
- [functions](Assistant.md#functions)
- [instructions](Assistant.md#instructions)

### Methods

- [getChatCompletions](Assistant.md#getchatcompletions)

## Constructors

### constructor

• **new Assistant**(`params`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`AssistantCreateParams`](../interfaces/AssistantCreateParams.md) |

#### Defined in

[src/assistant/assistant.ts:20](https://github.com/paztek/llobotomy-azure/blob/1acaa38/src/assistant/assistant.ts#L20)

## Properties

### client

• `Readonly` **client**: `OpenAIClient`

#### Defined in

[src/assistant/assistant.ts:14](https://github.com/paztek/llobotomy-azure/blob/1acaa38/src/assistant/assistant.ts#L14)

___

### deployment

• `Private` `Readonly` **deployment**: `string`

#### Defined in

[src/assistant/assistant.ts:18](https://github.com/paztek/llobotomy-azure/blob/1acaa38/src/assistant/assistant.ts#L18)

___

### functions

• `Private` `Readonly` **functions**: `FunctionDefinition`[]

#### Defined in

[src/assistant/assistant.ts:17](https://github.com/paztek/llobotomy-azure/blob/1acaa38/src/assistant/assistant.ts#L17)

___

### instructions

• `Private` `Readonly` **instructions**: `string`

#### Defined in

[src/assistant/assistant.ts:16](https://github.com/paztek/llobotomy-azure/blob/1acaa38/src/assistant/assistant.ts#L16)

## Methods

### getChatCompletions

▸ **getChatCompletions**(`messages`): `Promise`<`ChatCompletions`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `messages` | `ChatMessage`[] |

#### Returns

`Promise`<`ChatCompletions`\>

#### Defined in

[src/assistant/assistant.ts:27](https://github.com/paztek/llobotomy-azure/blob/1acaa38/src/assistant/assistant.ts#L27)
