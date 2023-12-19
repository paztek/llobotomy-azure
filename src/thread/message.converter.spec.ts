import type { ChatMessage } from '../message';
import { ThreadMessageConverter } from './message.converter';

describe('ThreadMessageConverter', () => {
    let converter: ThreadMessageConverter;

    beforeEach(() => {
        converter = new ThreadMessageConverter();
    });

    describe('convert', () => {
        it('converts a mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only', () => {
            const messages: ChatMessage[] = [
                {
                    // A ChatRequestSystemMessage
                    role: 'system',
                    content: 'Hello',
                },
                {
                    // A ChatRequestUserMessage
                    role: 'user',
                    content: 'Hi',
                    name: 'John',
                },
                {
                    // A ChatResponseAssistantMessage
                    role: 'assistant',
                    content: null,
                    toolCalls: [
                        {
                            id: 'tool-call-123abc',
                            type: 'function',
                            function: {
                                name: 'test',
                                arguments: '{}',
                            },
                        },
                    ],
                },
                {
                    // A ChatRequestToolMessage with some metadata
                    role: 'tool',
                    content: 'Hello',
                    toolCallId: '1',
                    metadata: {
                        foo: 'bar',
                        baz: true,
                    },
                },
                {
                    // A ChatRequestUserMessage
                    role: 'user',
                    content: 'Hi again',
                    name: 'John',
                },
                {
                    // A ChatResponseAssistantMessage
                    role: 'assistant',
                    content: 'Good to see you again',
                    toolCalls: [],
                },
            ];

            const convertedMessages = converter.convert(messages);

            expect(convertedMessages).toEqual([
                {
                    role: 'system',
                    content: 'Hello',
                },
                {
                    role: 'user',
                    content: 'Hi',
                    name: 'John',
                },
                {
                    role: 'assistant',
                    content: null,
                    toolCalls: [
                        {
                            id: 'tool-call-123abc',
                            type: 'function',
                            function: {
                                name: 'test',
                                arguments: '{}',
                            },
                        },
                    ],
                },
                {
                    role: 'tool',
                    content: 'Hello',
                    toolCallId: '1',
                },
                {
                    role: 'user',
                    content: 'Hi again',
                    name: 'John',
                },
                {
                    role: 'assistant',
                    content: 'Good to see you again',
                    toolCalls: [],
                },
            ]);
        });
    });
});
