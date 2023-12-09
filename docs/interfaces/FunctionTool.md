[LLobotoMy for Azure](../README.md) / FunctionTool

# Interface: FunctionTool<T, U\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `Record`<`string`, `unknown`\> = `Record`<`string`, `unknown`\> |
| `U` | `unknown` |

## Table of contents

### Properties

- [definition](FunctionTool.md#definition)

### Methods

- [execute](FunctionTool.md#execute)

## Properties

### definition

• **definition**: `FunctionDefinition`

#### Defined in

[src/assistant/function-tool.ts:7](https://github.com/paztek/llobotomy-azure/blob/a12ace7/src/assistant/function-tool.ts#L7)

## Methods

### execute

▸ **execute**(`args`): `Promise`<`U`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `T` |

#### Returns

`Promise`<`U`\>

#### Defined in

[src/assistant/function-tool.ts:8](https://github.com/paztek/llobotomy-azure/blob/a12ace7/src/assistant/function-tool.ts#L8)
