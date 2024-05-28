[LLobotoMy for Azure](../README.md) / ThreadMessageConverter

# Class: ThreadMessageConverter

## Table of contents

### Constructors

- [constructor](ThreadMessageConverter.md#constructor)

### Methods

- [convert](ThreadMessageConverter.md#convert)

## Constructors

### constructor

• **new ThreadMessageConverter**()

## Methods

### convert

▸ **convert**(`messages`): `ChatRequestMessage`[]

Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
so they can be sent again to the LLM.

#### Parameters

| Name | Type |
| :------ | :------ |
| `messages` | [`ChatMessage`](../README.md#chatmessage)[] |

#### Returns

`ChatRequestMessage`[]

#### Defined in

[src/thread/message.converter.ts:21](https://github.com/paztek/llobotomy-azure/blob/daad388/src/thread/message.converter.ts#L21)
