import { Expression } from './expression'

// This file contains all of the possible errors that can be returned.
// You can match on the `kind` in order to narrow the error down.
//
// Expressions all contain positions (as offsets from end of string),
// so that you can, where applicable, highlight the failing area.
//
// Parse errors contain the remaining (unparsed) string at their point of
// failure, so once again you can, given the original input string,
// figure out exactly the point at which the error occurred.

/** Evaluation error */
export type EvalError
    = EvalErrorThrow
    | EvalErrorNotAFunction
    | EvalErrorFunctionNotDefined

export type EvalErrorThrow = {
    kind: 'EVAL_THROW'
    expr: Expression
    error: any
}
export type EvalErrorFunctionNotDefined = {
    kind: 'FUNCTION_NOT_DEFINED',
    expr: Expression
}
export type EvalErrorNotAFunction = {
    kind: 'NOT_A_FUNCTION',
    expr: Expression,
    value: any
}

/** A misc interpreter error */
export type InterpretError = {
    kind: 'NOT_CONSUMED_ALL',
    input: string
}

/** Parse error */
export type ParseError
    = ParseErrorMatchString
    | ParseErrorMustTakeWhile
    | ParseErrorMustSepBy

export type ParseErrorMatchString = {
    kind: 'MATCH_STRING'
    expected: string
    input: string
}
export type ParseErrorMustTakeWhile = {
    kind: 'MUST_TAKE_WHILE'
    input: string
}
export type ParseErrorMustSepBy = {
    kind: 'MUST_SEP_BY'
    input: string
}
