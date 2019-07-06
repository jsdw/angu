import { Expression } from './expression';
/** The main error type returned */
export declare type Error = ErrorWithoutPosition & WithPosition;
declare type ErrorWithoutPosition = ParseError | EvalError | InterpretError;
/** Position information for an error. All output errors have this. */
declare type WithPosition = {
    pos: {
        start: number;
        end: number;
    };
};
/** Evaluation error */
export declare type EvalError = EvalErrorThrow | EvalErrorNotAFunction | EvalErrorFunctionNotDefined;
export declare type EvalErrorThrow = {
    kind: 'EVAL_THROW';
    expr: Expression;
    error: any;
};
export declare type EvalErrorFunctionNotDefined = {
    kind: 'FUNCTION_NOT_DEFINED';
    expr: Expression;
};
export declare type EvalErrorNotAFunction = {
    kind: 'NOT_A_FUNCTION';
    expr: Expression;
    value: any;
};
/** A misc interpreter error */
export declare type InterpretError = {
    kind: 'NOT_CONSUMED_ALL';
    input: string;
};
/** Externally facing parse errors */
export declare type ParseError = LibParseError;
/** Internal parse errors from libparser */
export declare type LibParseError = LibParseErrorMatchString | LibParseErrorMustTakeWhile | LibParseErrorMustSepBy | LibParseErrorEndOfString;
export declare type LibParseErrorEndOfString = {
    kind: 'EXPECTS_A_CHAR';
    input: "";
    expects?: string;
};
export declare type LibParseErrorMatchString = {
    kind: 'EXPECTS_A_STRING';
    expectedOneOf: string[];
    input: string;
};
export declare type LibParseErrorMustTakeWhile = {
    kind: 'EXPECTS_PATTERN';
    expectedPattern: RegExp | String;
    input: string;
};
export declare type LibParseErrorMustSepBy = {
    kind: 'EXPECTS_A_SEPARATOR';
    input: string;
};
/** Given the original input string, this function adds position info to the provided Error  */
export declare function toOutputError(fullInput: string, error: ErrorWithoutPosition): Error;
export {};
