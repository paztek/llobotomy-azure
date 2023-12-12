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

[src/thread/thread.ts:223](https://github.com/paztek/llobotomy-azure/blob/d316306/src/thread/thread.ts#L223)

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

[src/thread/thread.ts:217](https://github.com/paztek/llobotomy-azure/blob/d316306/src/thread/thread.ts#L217)
