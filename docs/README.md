LLobotoMy for Azure

# LLobotoMy for Azure

## Table of contents

### Classes

- [Assistant](classes/Assistant.md)
- [RequiredAction](classes/RequiredAction.md)
- [Thread](classes/Thread.md)

### Interfaces

- [AssistantCreateParams](interfaces/AssistantCreateParams.md)
- [ToolOutput](interfaces/ToolOutput.md)

### Functions

- [isChatRequestMessage](README.md#ischatrequestmessage)
- [isChatResponseMessage](README.md#ischatresponsemessage)

## Functions

### isChatRequestMessage

▸ **isChatRequestMessage**(`m`): m is ChatRequestMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `ChatRequestMessage` \| `ChatResponseMessage` |

#### Returns

m is ChatRequestMessage

#### Defined in

[src/thread/thread.ts:200](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/thread/thread.ts#L200)

___

### isChatResponseMessage

▸ **isChatResponseMessage**(`m`): m is ChatResponseMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `ChatRequestMessage` \| `ChatResponseMessage` |

#### Returns

m is ChatResponseMessage

#### Defined in

[src/thread/thread.ts:194](https://github.com/paztek/llobotomy-azure/blob/05b3f2e/src/thread/thread.ts#L194)
