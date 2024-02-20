[LLobotoMy for Azure](../README.md) / ToolEmulator

# Class: ToolEmulator

Helps with the conversion of tool calls to function calls and vice versa.

## Table of contents

### Constructors

- [constructor](ToolEmulator.md#constructor)

### Methods

- [extractFunctionNameFromEmulatedToolCallId](ToolEmulator.md#extractfunctionnamefromemulatedtoolcallid)
- [generateEmulatedToolCallId](ToolEmulator.md#generateemulatedtoolcallid)
- [isEmulatedToolCallId](ToolEmulator.md#isemulatedtoolcallid)

## Constructors

### constructor

• **new ToolEmulator**()

## Methods

### extractFunctionNameFromEmulatedToolCallId

▸ **extractFunctionNameFromEmulatedToolCallId**(`toolCallId`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `toolCallId` | `string` |

#### Returns

`string`

#### Defined in

[src/thread/tool.emulator.ts:17](https://github.com/paztek/llobotomy-azure/blob/dd7663a/src/thread/tool.emulator.ts#L17)

___

### generateEmulatedToolCallId

▸ **generateEmulatedToolCallId**(`functionCall`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `functionCall` | `FunctionCall` |

#### Returns

`string`

#### Defined in

[src/thread/tool.emulator.ts:9](https://github.com/paztek/llobotomy-azure/blob/dd7663a/src/thread/tool.emulator.ts#L9)

___

### isEmulatedToolCallId

▸ **isEmulatedToolCallId**(`toolCallId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `toolCallId` | `string` |

#### Returns

`boolean`

#### Defined in

[src/thread/tool.emulator.ts:13](https://github.com/paztek/llobotomy-azure/blob/dd7663a/src/thread/tool.emulator.ts#L13)
