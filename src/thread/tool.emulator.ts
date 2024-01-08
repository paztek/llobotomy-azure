import type { FunctionCall } from '@azure/openai';

const EMULATED_CALL_PREFIX = 'emulated_call_';

/**
 * Helps with the conversion of tool calls to function calls and vice versa.
 */
export class ToolEmulator {
    generateEmulatedToolCallId(functionCall: FunctionCall): string {
        return `${EMULATED_CALL_PREFIX}${functionCall.name}`;
    }

    isEmulatedToolCallId(toolCallId: string): boolean {
        return toolCallId.startsWith(EMULATED_CALL_PREFIX);
    }

    extractFunctionNameFromEmulatedToolCallId(toolCallId: string): string {
        return toolCallId.replace(EMULATED_CALL_PREFIX, '');
    }
}
