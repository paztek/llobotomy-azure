import type { ChatChoice, ChatCompletions, ChatMessage } from '@azure/openai';
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
        const message: ChatMessage = {
            role: 'user',
            content: 'Hello',
        };

        it('emits a "message" event', () => {
            thread.addMessage(message);
            expect(emitSpy).toHaveBeenCalledWith('message', message);
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

        describe('when the completions from the assistant are a function call', () => {
            const functionName = 'get_customer_profile';

            beforeEach(() => {
                const choices: ChatChoice[] = [
                    {
                        index: 0,
                        finishReason: null,
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
                    }),
                );

                assistant.listChatCompletions.mockReturnValue(
                    Readable.from(
                        createAsyncIterable<ChatCompletions>(completions),
                    ),
                );
            });

            it('emits a "message" event from the assistant, with the function call parameters', async () => {
                thread.run(assistant);

                // The "message" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('message', (message) => {
                        if (isFunctionCallMessage(message)) {
                            resolve();
                        }
                    });
                });

                expect(emitSpy).nthCalledWith(2, 'message', {
                    role: 'assistant',
                    content: null,
                    functionCall: {
                        name: functionName,
                        arguments: JSON.stringify({
                            id: 'ABC',
                        }),
                    },
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
                    3,
                    'requires_action',
                    expect.any(RequiredAction),
                );

                const requiredAction = emitSpy.mock
                    .calls[2][1] as RequiredAction;
                expect(requiredAction.toolCall).toBeDefined();
                expect(requiredAction.toolCall.name).toEqual(functionName);
                expect(requiredAction.toolCall.arguments).toEqual({
                    id: 'ABC',
                });
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
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            content: 'Lorem ipsum',
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            content: ' dolor sit',
                        },
                    },
                    {
                        index: 0,
                        finishReason: null,
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-ignore
                        delta: {
                            content: ' amet',
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
                        if (isTextMessage(message)) {
                            resolve();
                        }
                    });
                });

                expect(emitSpy).nthCalledWith(2, 'message', {
                    role: 'assistant',
                    content: 'Lorem ipsum dolor sit amet',
                });
            });

            it('emits a "completed" event', async () => {
                thread.run(assistant);

                // The "completed" event is sent asynchronously, we need to wait for it to be emitted
                await new Promise<void>((resolve, reject) => {
                    thread.on('error', reject);
                    thread.on('completed', resolve);
                });

                expect(emitSpy).nthCalledWith(3, 'completed');
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

function isFunctionCallMessage(message: ChatMessage): boolean {
    return (
        message.role === 'assistant' && message.functionCall?.name !== undefined
    );
}

function isTextMessage(message: ChatMessage): boolean {
    return message.role === 'assistant' && message.functionCall === undefined;
}
