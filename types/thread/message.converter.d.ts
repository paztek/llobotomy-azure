import type { ChatRequestMessage } from '@azure/openai';
import type { ChatMessage } from '../message';
export declare class ThreadMessageConverter {
    /**
     * Convert the mix of ChatRequestMessages and ChatResponseMessages to ChatRequestMessages only
     * so they can be sent again to the LLM.
     */
    convert(messages: ChatMessage[]): ChatRequestMessage[];
}
//# sourceMappingURL=message.converter.d.ts.map