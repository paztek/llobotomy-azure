import type { FunctionCall } from '@azure/openai';
/**
 * Helps with the conversion of tool calls to function calls and vice versa.
 */
export declare class ToolEmulator {
    generateEmulatedToolCallId(functionCall: FunctionCall): string;
    isEmulatedToolCallId(toolCallId: string): boolean;
    extractFunctionNameFromEmulatedToolCallId(toolCallId: string): string;
}
//# sourceMappingURL=tool.emulator.d.ts.map