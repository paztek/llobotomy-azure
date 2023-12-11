import type {
    ChatChoice,
    ChatCompletions,
    ChatRequestMessage,
    ChatRequestUserMessage,
    ChatResponseMessage,
} from '@azure/openai';
import { mock } from 'jest-mock-extended';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
import { RequiredAction, Thread } from './thread';

describe('Thread', () => {
    let thread: Thread;

    const assistant = mock<Assistant>();
    let emitSpy: jest.SpyInstance;

    beforeEach(() => {
        thread = new Thread();

        emitSpy = jest.spyOn(thread, 'emit');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('addMessage', () => {
        const message: ChatRequestUserMessage = {
            role: 'user',
            content: 'Hello',
        };

        it('emits a "message" and a "message:request" events', () => {
            thread.addMessage(message);
            expect(emitSpy).nthCalledWith(1, 'message', message);
            expect(emitSpy).nthCalledWith(2, 'message:request', message);
        });
    });

    describe('run', () => {
        beforeEach(() => {
            assistant.listChatCompletions.mockReturnValue(Readable.from([]));
        });

        it('emits an "in_progress" event', () => {
            thread.run(assistant);
            expect(emitSpy).toHaveBeenCalledWith('in_progress');
        });

        describe('when the completions from the assistant are some tool calls', () => {
            const functionName = 'get_customer_profile';

            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
                        delta: {
                            role: 'assistant',
                            toolCalls: [
                                {
                                    id: 'tool-call-1234abc',
                                    type: 'function',
                                    function: {
                                        name: functionName,
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        arguments: undefined,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        delta: {
                            toolCalls: [
                                {
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments: '{"',
                                    },
                                },
                            ],
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        delta: {
                            toolCalls: [
                                {
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments: 'id":"',
                                    },
                                },
                            ],
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        delta: {
                            toolCalls: [
                                {
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments: 'ABC"}',
                                    },
                                },
                            ],
                        },
                    },
                    {
                        index: 0,
                        finishReason: 'tool_calls',
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            toolCalls: [],
                        },
                    },
                ];
                const completions: ChatCompletions[] = choices.map(
                    (choice) => ({
                        id: 'chat-cmpl-1234abc',
                        created: new Date(),
                        choices: [choice],
                        promptFilterResults: [],
                    }),
                );

                assistant.listChatCompletions.mockReturnValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the tool calls parameters', async () => {
                thread.run(assistant);

                // The "message" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('message', (message) => {
                        if (isChatResponseAssistantToolCallsMessage(message)) {
                            resolve();
                        }
                    });
                });

                expect(emitSpy).nthCalledWith(2, 'message', {
                    role: 'assistant',
                    content: null,
                    toolCalls: [
                        {
                            id: 'tool-call-1234abc',
                            type: 'function',
                            function: {
                                name: functionName,
                                arguments: JSON.stringify({
                                    id: 'ABC',
                                }),
                            },
                        },
                    ],
                });
            });

            it('emits a "requires_action" event with the required action', async () => {
                thread.run(assistant);

                // The "requires_action" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('requires_action', resolve);
                });

                expect(emitSpy).nthCalledWith(
                    4,
                    'requires_action',
                    expect.any(RequiredAction),
                );

                const requiredAction = emitSpy.mock
                    .calls[2][1] as RequiredAction;
                expect(requiredAction.toolCalls).toBeDefined();
                expect(requiredAction.toolCalls[0]?.function.name).toEqual(
                    functionName,
                );
                expect(requiredAction.toolCalls[0]?.function.arguments).toEqual(
                    JSON.stringify({
                        id: 'ABC',
                    }),
                );
            });
        });

        describe('when the completions from the assistant are a text message', () => {
            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            role: 'assistant',
                            toolCalls: [],
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            content: 'Lorem ipsum',
                            toolCalls: [],
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            content: ' dolor sit',
                            toolCalls: [],
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            content: ' amet',
                            toolCalls: [],
                        },
                    },
                    {
                        index: 0,
                        finishReason: 'stop',
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {},
                    },
                ];
                const completions: ChatCompletions[] = choices.map(
                    (choice) => ({
                        id: 'chat-cmpl-1234abc',
                        created: new Date(),
                        choices: [choice],
                        promptFilterResults: [],
                    }),
                );

                assistant.listChatCompletions.mockReturnValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the text message', async () => {
                thread.run(assistant);

                // The "message" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('message', (message) => {
                        if (isChatResponseAssistantContentMessage(message)) {
                            resolve();
                        }
                    });
                });

                expect(emitSpy).nthCalledWith(2, 'message', {
                    role: 'assistant',
                    content: 'Lorem ipsum dolor sit amet',
                    toolCalls: [],
                });
            });

            it('emits a "completed" event', async () => {
                thread.run(assistant);

                // The "completed" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('completed', resolve);
                });

                expect(emitSpy).nthCalledWith(4, 'completed');
            });

            it('also writes to the stream of the thread', async () => {
                let response = '';

                thread.run(assistant);

                thread.stream?.on('data', (data) => {
                    response += data;
                });

                // The "completed" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('completed', resolve);
                });

                expect(response).toEqual('Lorem ipsum dolor sit amet');
            });
        });
    });
});

async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
    for (const item of items) {
        yield item;
    }
}

function isChatResponseAssistantContentMessage(
    m: ChatRequestMessage | ChatResponseMessage,
): m is ChatResponseMessage {
    return m.role === 'assistant' && m.content !== null;
}

function isChatResponseAssistantToolCallsMessage(
    m: ChatRequestMessage | ChatResponseMessage,
): m is ChatResponseMessage {
    return (
        m.role === 'assistant' && 'toolCalls' in m && m.toolCalls?.length > 0
    );
}
