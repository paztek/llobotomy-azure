[LLobotoMy for Azure](../README.md) / ContextLengthExceededError

# Class: ContextLengthExceededError

## Hierarchy

- [`InvalidRequestError`](InvalidRequestError.md)

  ↳ **`ContextLengthExceededError`**

## Table of contents

### Constructors

- [constructor](ContextLengthExceededError.md#constructor)

### Properties

- [message](ContextLengthExceededError.md#message)
- [name](ContextLengthExceededError.md#name)
- [stack](ContextLengthExceededError.md#stack)
- [prepareStackTrace](ContextLengthExceededError.md#preparestacktrace)
- [stackTraceLimit](ContextLengthExceededError.md#stacktracelimit)

### Methods

- [captureStackTrace](ContextLengthExceededError.md#capturestacktrace)

## Constructors

### constructor

• **new ContextLengthExceededError**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

#### Overrides

[InvalidRequestError](InvalidRequestError.md).[constructor](InvalidRequestError.md#constructor)

#### Defined in

[src/thread/errors.ts:24](https://github.com/paztek/llobotomy-azure/blob/daad388/src/thread/errors.ts#L24)

## Properties

### message

• **message**: `string`

#### Inherited from

[InvalidRequestError](InvalidRequestError.md).[message](InvalidRequestError.md#message)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1068

___

### name

• **name**: `string`

#### Inherited from

[InvalidRequestError](InvalidRequestError.md).[name](InvalidRequestError.md#name)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1067

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[InvalidRequestError](InvalidRequestError.md).[stack](InvalidRequestError.md#stack)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1069

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Inherited from

[InvalidRequestError](InvalidRequestError.md).[prepareStackTrace](InvalidRequestError.md#preparestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:28

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[InvalidRequestError](InvalidRequestError.md).[stackTraceLimit](InvalidRequestError.md#stacktracelimit)

#### Defined in

node_modules/@types/node/globals.d.ts:30

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

[InvalidRequestError](InvalidRequestError.md).[captureStackTrace](InvalidRequestError.md#capturestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:21
