[LLobotoMy for Azure](../README.md) / UnknownError

# Class: UnknownError

## Hierarchy

- `Error`

  ↳ **`UnknownError`**

## Table of contents

### Constructors

- [constructor](UnknownError.md#constructor)

### Properties

- [message](UnknownError.md#message)
- [name](UnknownError.md#name)
- [stack](UnknownError.md#stack)
- [prepareStackTrace](UnknownError.md#preparestacktrace)
- [stackTraceLimit](UnknownError.md#stacktracelimit)

### Methods

- [captureStackTrace](UnknownError.md#capturestacktrace)

## Constructors

### constructor

• **new UnknownError**(`message?`)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `message` | `string` | `'Unknown error'` |

#### Overrides

Error.constructor

#### Defined in

[src/thread/errors.ts:40](https://github.com/paztek/llobotomy-azure/blob/dd7663a/src/thread/errors.ts#L40)

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
