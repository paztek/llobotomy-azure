[LLobotoMy for Azure](../README.md) / ThreadMessageConverter

# Class: ThreadMessageConverter

## Table of contents

### Constructors

- [constructor](ThreadMessageConverter.md#constructor)

### Properties

- [toolEmulator](ThreadMessageConverter.md#toolemulator)

### Methods

- [convert](ThreadMessageConverter.md#convert)

## Constructors

### constructor

• **new ThreadMessageConverter**()

## Properties

### toolEmulator

• `Private` `Readonly` **toolEmulator**: `ToolEmulator`

#### Defined in

[src/thread/message.converter.ts:19](https://github.com/paztek/llobotomy-azure/blob/debbf07/src/thread/message.converter.ts#L19)

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

[src/thread/message.converter.ts:25](https://github.com/paztek/llobotomy-azure/blob/debbf07/src/thread/message.converter.ts#L25)
