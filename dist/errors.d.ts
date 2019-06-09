import { Expression } from './expression';
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
/** Parse error */
export declare type ParseError = ParseErrorMatchString | ParseErrorMustTakeWhile | ParseErrorMustSepBy;
export declare type ParseErrorMatchString = {
    kind: 'MATCH_STRING';
    expected: string;
    input: string;
};
export declare type ParseErrorMustTakeWhile = {
    kind: 'MUST_TAKE_WHILE';
    input: string;
};
export declare type ParseErrorMustSepBy = {
    kind: 'MUST_SEP_BY';
    input: string;
};
