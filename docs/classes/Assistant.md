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
- [useLegacyFunctions](Assistant.md#uselegacyfunctions)

### Methods

- [getChatCompletions](Assistant.md#getchatcompletions)
- [listChatCompletions](Assistant.md#listchatcompletions)

## Constructors

### constructor

• **new Assistant**(`params`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `params` | [`AssistantCreateParams`](../interfaces/AssistantCreateParams.md) |

#### Defined in

[src/assistant/assistant.ts:26](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L26)

## Properties

### client

• `Readonly` **client**: `OpenAIClient`

#### Defined in

[src/assistant/assistant.ts:19](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L19)

___

### deployment

• `Private` `Readonly` **deployment**: `string`

#### Defined in

[src/assistant/assistant.ts:23](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L23)

___

### instructions

• `Private` `Readonly` **instructions**: `string`

#### Defined in

[src/assistant/assistant.ts:21](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L21)

___

### tools

• `Private` `Readonly` **tools**: `ChatCompletionsFunctionToolDefinition`[]

#### Defined in

[src/assistant/assistant.ts:22](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L22)

___

### useLegacyFunctions

• `Private` `Readonly` **useLegacyFunctions**: `boolean`

#### Defined in

[src/assistant/assistant.ts:24](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L24)

## Methods

### getChatCompletions

▸ **getChatCompletions**(`messages`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `messages` | `ChatRequestMessage`[] |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/assistant/assistant.ts:66](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L66)

___

### listChatCompletions

▸ **listChatCompletions**(`messages`): `Readable`

#### Parameters

| Name | Type |
| :------ | :------ |
| `messages` | `ChatRequestMessage`[] |

#### Returns

`Readable`

#### Defined in

[src/assistant/assistant.ts:34](https://github.com/paztek/llobotomy-azure/blob/7f25ee2/src/assistant/assistant.ts#L34)
