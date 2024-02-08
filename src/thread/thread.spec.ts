import type {
    ChatChoice,
    ChatCompletions,
    ChatRequestUserMessage,
    ChatResponseMessage,
} from '@azure/openai';
import type { ChatRequestToolMessage } from '@azure/openai/types/src/models/models';
import { mock } from 'jest-mock-extended';
import { Readable } from 'stream';
import { Assistant } from '../assistant';
import type { ChatMessage } from '../message';
import { RequiredAction, Thread } from './thread';

describe('Thread', () => {
    let thread: Thread;

    const assistant = mock<Assistant>();
    let emitSpy: jest.SpyInstance;

    const id = 'my id';

    beforeEach(() => {
        thread = new Thread(id);

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

        it('emits a "message" and a "message:request" events', async () => {
            thread.addMessage(message);

            // The "message" event is sent asynchronously, we need to wait for it to be emitted
            await new Promise<void>((resolve, reject) => {
                thread.on('error', reject);
                thread.on('message', (message) => {
                    if (isChatRequestUserMessage(message)) {
                        resolve();
                    }
                });
            });
            expect(emitSpy).nthCalledWith(1, 'message', message);

            // The message:request event is sent asynchronously, we need to wait for it to be emitted
            await new Promise<void>((resolve, reject) => {
                thread.on('error', reject);
                thread.on('message:request', (message) => {
                    if (isChatRequestUserMessage(message)) {
                        resolve();
                    }
                });
            });

            expect(emitSpy).nthCalledWith(2, 'message:request', message);
        });
    });

    describe('run', () => {
        beforeEach(() => {
            assistant.streamChatCompletions.mockResolvedValue(
                Readable.from([]),
            );
        });

        it('emits an "in_progress" event', async () => {
            thread.run(assistant);

            // The "in_progress" event is sent asynchronously, we need to wait for it to be emitted
            await new Promise<void>((resolve, reject) => {
                thread.on('error', reject);
                thread.on('in_progress', resolve);
            });

            expect(emitSpy).toHaveBeenCalledWith('in_progress');
        });

        describe('when the completions from the assistant are about a single tool call', () => {
            const functionName = 'get_customer_profile';

            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            role: 'assistant',
                            toolCalls: [
                                {
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    index: 0,
                                    id: 'tool-call-1234abc',
                                    type: 'function',
                                    function: {
                                        name: functionName,
                                        arguments: '',
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
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    index: 0,
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
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    index: 0,
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
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    index: 0,
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

                assistant.streamChatCompletions.mockResolvedValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the tool calls parameters', async () => {
                await thread.run(assistant);

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

        describe('when the completions from the assistant are about multiple tool calls', () => {
            const functionName1 = 'get_customer_profile';
            const functionName2 = 'search_knowledge_base';

            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            role: 'assistant',
                            toolCalls: [
                                {
                                    id: 'tool-call-1234abc',
                                    type: 'function',
                                    function: {
                                        name: functionName1,
                                        arguments: '',
                                    },
                                },
                                {
                                    id: 'tool-call-567xyz',
                                    type: 'function',
                                    function: {
                                        name: functionName2,
                                        arguments: '',
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
                                    index: 0,
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
                                    index: 1,
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
                                    index: 1,
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments: 'query":"',
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
                                    index: 0,
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
                                    index: 1,
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments: 'foo',
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
                                    index: 0,
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
                        finishReason: null,
                        delta: {
                            toolCalls: [
                                {
                                    index: 1,
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments: '"}',
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

                assistant.streamChatCompletions.mockResolvedValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the tool calls parameters', async () => {
                await thread.run(assistant);

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
                                name: functionName1,
                                arguments: JSON.stringify({
                                    id: 'ABC',
                                }),
                            },
                        },
                        {
                            id: 'tool-call-567xyz',
                            type: 'function',
                            function: {
                                name: functionName2,
                                arguments: JSON.stringify({
                                    query: 'foo',
                                }),
                            },
                        },
                    ],
                });
            });

            it('emits a "requires_action" event with the required action', async () => {
                await thread.run(assistant);

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
                    functionName1,
                );
                expect(requiredAction.toolCalls[0]?.function.arguments).toEqual(
                    JSON.stringify({
                        id: 'ABC',
                    }),
                );
            });
        });

        describe('when the completions from the assistant are about a single weird multi_tool_use.parallel call', () => {
            // See https://community.openai.com/t/model-tries-to-call-unknown-function-multi-tool-use-parallel/490653/8
            const functionName1 = 'get_customer_profile';
            const functionName2 = 'search_knowledge_base';

            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            role: 'assistant',
                            toolCalls: [
                                {
                                    id: 'tool-call-1234abc',
                                    type: 'function',
                                    function: {
                                        name: 'multi_tool_use.parallel',
                                        arguments: '',
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
                                    index: 0,
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments:
                                            '{"tool_uses":[{"recipient_name":"functions.search_kn',
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
                                    index: 0,
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments:
                                            'owledge_base","parameters":{"query":"foo"}},{"recip',
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
                                    index: 0,
                                    function: {
                                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                        // @ts-ignore
                                        name: undefined,
                                        arguments:
                                            'ient_name":"functions.get_customer_profile","parameters":{"id":"ABC"}}]}',
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

                assistant.streamChatCompletions.mockResolvedValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the tool calls parameters', async () => {
                await thread.run(assistant);

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
                            id: 'tool-call-1234abc_0',
                            type: 'function',
                            function: {
                                name: functionName2,
                                arguments: JSON.stringify({
                                    query: 'foo',
                                }),
                            },
                        },
                        {
                            id: 'tool-call-1234abc_1',
                            type: 'function',
                            function: {
                                name: functionName1,
                                arguments: JSON.stringify({
                                    id: 'ABC',
                                }),
                            },
                        },
                    ],
                });
            });

            it('emits a "requires_action" event with the required action', async () => {
                await thread.run(assistant);

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
                    functionName2,
                );
                expect(requiredAction.toolCalls[0]?.function.arguments).toEqual(
                    JSON.stringify({
                        query: 'foo',
                    }),
                );
                expect(requiredAction.toolCalls[1]?.function.name).toEqual(
                    functionName1,
                );
                expect(requiredAction.toolCalls[1]?.function.arguments).toEqual(
                    JSON.stringify({
                        id: 'ABC',
                    }),
                );
            });
        });

        describe('when the completions from the assistant are a function call', () => {
            const functionName = 'get_customer_profile';

            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            role: 'assistant',
                            functionCall: {
                                name: functionName,
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                arguments: undefined,
                            },
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        delta: {
                            functionCall: {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                name: undefined,
                                arguments: '{"',
                            },
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        delta: {
                            functionCall: {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                name: undefined,
                                arguments: 'id":"',
                            },
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        delta: {
                            functionCall: {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                name: undefined,
                                arguments: 'ABC"}',
                            },
                        },
                    },
                    {
                        index: 0,
                        finishReason: 'function_call',
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

                assistant.streamChatCompletions.mockResolvedValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the function call parameters', async () => {
                await thread.run(assistant);

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
                            id: 'emulated_call_get_customer_profile',
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
                await thread.run(assistant);

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

                assistant.streamChatCompletions.mockResolvedValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the text message', async () => {
                await thread.run(assistant);

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
                await thread.run(assistant);

                // The "completed" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('completed', resolve);
                });

                expect(emitSpy).nthCalledWith(4, 'completed');
            });

            it('also writes to the stream of the thread', async () => {
                let response = '';

                await thread.run(assistant);

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

        describe('when submitting a tool output', () => {
            const functionName = 'get_customer_profile';
            const toolCallId = 'tool-call-1234abc';
            const profile = {
                id: 'ABC',
                name: 'John Doe',
                email: 'john.doe@example.com',
            };

            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            role: 'assistant',
                            toolCalls: [
                                {
                                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                    // @ts-ignore
                                    index: 0,
                                    id: toolCallId,
                                    type: 'function',
                                    function: {
                                        name: functionName,
                                        arguments: '{"id":"ABC"}',
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

                assistant.streamChatCompletions.mockResolvedValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a message event from the tool with the tool output', async () => {
                await thread.run(assistant);

                // The "requires_action" event is sent asynchronously, we need to wait for it to be emitted
                const requiredAction = await new Promise<RequiredAction>(
                    (resolve, reject) => {
                        thread.on('error', reject);
                        thread.on('requires_action', resolve);
                    },
                );

                await requiredAction.submitToolOutputs([
                    {
                        callId: toolCallId,
                        value: profile,
                    },
                ]);

                // The "message" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('message', (message) => {
                        if (isChatRequestToolMessage(message)) {
                            resolve();
                        }
                    });
                });

                expect(emitSpy).nthCalledWith(5, 'message', {
                    role: 'tool',
                    content: JSON.stringify(profile),
                    toolCallId,
                });
            });

            describe('when the tool output has metadata', () => {
                const metadata = {
                    foo: 'bar',
                    baz: true,
                };

                it('includes the metadata in the emitted tool message', async () => {
                    await thread.run(assistant);

                    // The "requires_action" event is sent asynchronously, we need to wait for it to be emitted
                    const requiredAction = await new Promise<RequiredAction>(
                        (resolve, reject) => {
                            thread.on('error', reject);
                            thread.on('requires_action', resolve);
                        },
                    );

                    await requiredAction.submitToolOutputs([
                        {
                            callId: toolCallId,
                            value: profile,
                            metadata,
                        },
                    ]);

                    // The "message" event is sent asynchronously, we need to wait for it to be emitted
                    await new Promise<void>((resolve, reject) => {
                        thread.on('error', reject);
                        thread.on('message', (message) => {
                            if (isChatRequestToolMessage(message)) {
                                resolve();
                            }
                        });
                    });

                    expect(emitSpy).nthCalledWith(5, 'message', {
                        role: 'tool',
                        content: JSON.stringify(profile),
                        toolCallId,
                        metadata,
                    });
                });
            });
        });
    });
});

async function* createAsyncIterable<T>(items: T[]): AsyncIterable<T> {
    for (const item of items) {
        yield item;
    }
}

function isChatRequestUserMessage(m: ChatMessage): m is ChatRequestUserMessage {
    return m.role === 'user';
}

function isChatResponseAssistantContentMessage(
    m: ChatMessage,
): m is ChatResponseMessage {
    return m.role === 'assistant' && m.content !== null;
}

function isChatResponseAssistantToolCallsMessage(
    m: ChatMessage,
): m is ChatResponseMessage {
    return (
        m.role === 'assistant' && 'toolCalls' in m && m.toolCalls?.length > 0
    );
}

function isChatRequestToolMessage(m: ChatMessage): m is ChatRequestToolMessage {
    return m.role === 'tool';
}
