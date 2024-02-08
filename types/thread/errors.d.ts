/**
 * See https://stackoverflow.com/a/41102306/674722 and
 * https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-2.html#support-for-newtarget
 * for why we need to set the prototype of the error classes.
 */
export declare class AccessDeniedError extends Error {
    constructor(message: string);
}
export declare class InvalidRequestError extends Error {
    constructor(message: string);
}
export declare class ContextLengthExceededError extends InvalidRequestError {
    constructor(message: string);
}
export declare class ContentFilterError extends InvalidRequestError {
    constructor(message: string);
}
export declare class UnknownError extends Error {
    constructor(message?: string);
}
export declare class InvalidToolOutputsError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map