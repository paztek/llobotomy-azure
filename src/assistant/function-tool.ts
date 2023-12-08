import type { FunctionDefinition } from '@azure/openai';

export interface FunctionTool<
    T extends Record<string, unknown> = Record<string, unknown>,
    U = unknown,
> {
    definition: FunctionDefinition;
    execute(args: T): Promise<U>;
}
