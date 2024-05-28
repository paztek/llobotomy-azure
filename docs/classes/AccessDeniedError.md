[LLobotoMy for Azure](../README.md) / AccessDeniedError

# Class: AccessDeniedError

See https://stackoverflow.com/a/41102306/674722 and
https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
for why we need to set the prototype of the error classes.

## Hierarchy

- `Error`

  ↳ **`AccessDeniedError`**

## Table of contents

### Constructors

- [constructor](AccessDeniedError.md#constructor)

### Properties

- [message](AccessDeniedError.md#message)
- [name](AccessDeniedError.md#name)
- [stack](AccessDeniedError.md#stack)
- [prepareStackTrace](AccessDeniedError.md#preparestacktrace)
- [stackTraceLimit](AccessDeniedError.md#stacktracelimit)

### Methods

- [captureStackTrace](AccessDeniedError.md#capturestacktrace)

## Constructors

### constructor

• **new AccessDeniedError**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

#### Overrides

Error.constructor

#### Defined in

[src/thread/errors.ts:8](https://github.com/paztek/llobotomy-azure/blob/daad388/src/thread/errors.ts#L8)

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
