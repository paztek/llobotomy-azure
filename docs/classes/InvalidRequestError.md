[LLobotoMy for Azure](../README.md) / InvalidRequestError

# Class: InvalidRequestError

## Hierarchy

- `Error`

  ↳ **`InvalidRequestError`**

  ↳↳ [`ContextLengthExceededError`](ContextLengthExceededError.md)

  ↳↳ [`ContentFilterError`](ContentFilterError.md)

## Table of contents

### Constructors

- [constructor](InvalidRequestError.md#constructor)

### Properties

- [message](InvalidRequestError.md#message)
- [name](InvalidRequestError.md#name)
- [stack](InvalidRequestError.md#stack)
- [prepareStackTrace](InvalidRequestError.md#preparestacktrace)
- [stackTraceLimit](InvalidRequestError.md#stacktracelimit)

### Methods

- [captureStackTrace](InvalidRequestError.md#capturestacktrace)

## Constructors

### constructor

• **new InvalidRequestError**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

#### Overrides

Error.constructor

#### Defined in

[src/thread/errors.ts:16](https://github.com/paztek/llobotomy-azure/blob/e7a9b63/src/thread/errors.ts#L16)

## Properties

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1068

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1067

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

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

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:28

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

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

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:21
