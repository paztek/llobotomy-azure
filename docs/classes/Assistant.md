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

[src/assistant/assistant.ts:30](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L30)

## Properties

### client

• `Readonly` **client**: `OpenAIClient`

#### Defined in

[src/assistant/assistant.ts:21](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L21)

___

### deployment

• `Private` `Readonly` **deployment**: `string`

#### Defined in

[src/assistant/assistant.ts:25](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L25)

___

### instructions

• `Private` `Readonly` **instructions**: `string`

#### Defined in

[src/assistant/assistant.ts:23](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L23)

___

### temperature

• `Private` `Readonly` **temperature**: `undefined` \| `number`

#### Defined in

[src/assistant/assistant.ts:26](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L26)

___

### tools

• `Private` `Readonly` **tools**: `ChatCompletionsFunctionToolDefinition`[]

#### Defined in

[src/assistant/assistant.ts:24](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L24)

___

### topP

• `Private` `Readonly` **topP**: `undefined` \| `number`

#### Defined in

[src/assistant/assistant.ts:27](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L27)

___

### useLegacyFunctions

• `Private` `Readonly` **useLegacyFunctions**: `boolean`

#### Defined in

[src/assistant/assistant.ts:28](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L28)

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

[src/assistant/assistant.ts:42](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/assistant/assistant.ts#L42)
