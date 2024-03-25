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
- [useLegacyFunctions](Assistant.md#uselegacyfunctions)

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

[src/assistant/assistant.ts:35](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L35)

## Properties

### client

• `Readonly` **client**: `OpenAIClient`

#### Defined in

[src/assistant/assistant.ts:26](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L26)

___

### deployment

• `Private` `Readonly` **deployment**: `string`

#### Defined in

[src/assistant/assistant.ts:30](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L30)

___

### instructions

• `Private` `Readonly` **instructions**: `undefined` \| `string`

#### Defined in

[src/assistant/assistant.ts:28](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L28)

___

### temperature

• `Private` `Readonly` **temperature**: `undefined` \| `number`

#### Defined in

[src/assistant/assistant.ts:31](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L31)

___

### tools

• `Private` `Readonly` **tools**: `ChatCompletionsFunctionToolDefinition`[]

#### Defined in

[src/assistant/assistant.ts:29](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L29)

___

### topP

• `Private` `Readonly` **topP**: `undefined` \| `number`

#### Defined in

[src/assistant/assistant.ts:32](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L32)

___

### useLegacyFunctions

• `Private` `Readonly` **useLegacyFunctions**: `boolean`

#### Defined in

[src/assistant/assistant.ts:33](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L33)

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

[src/assistant/assistant.ts:47](https://github.com/paztek/llobotomy-azure/blob/f426db6/src/assistant/assistant.ts#L47)
