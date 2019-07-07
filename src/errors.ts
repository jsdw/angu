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

/** The main error type returned */
export type Error = ErrorWithoutPosition & WithPosition
type ErrorWithoutPosition
    = ParseError
    | EvalError
    | InterpretError

/** Position information for an error. All output errors have this. */
type WithPosition = {
    pos: {
        start: number
        end: number
    }
}

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
    kind: 'FUNCTION_NOT_DEFINED'
    expr: Expression
}
export type EvalErrorNotAFunction = {
    kind: 'NOT_A_FUNCTION'
    expr: Expression
    value: any
}

/** A misc interpreter error */
export type InterpretError = {
    kind: 'NOT_CONSUMED_ALL'
    input: string
}

/** Externally facing parse errors */
export type ParseError = LibParseError

/** Internal parse errors from libparser */
export type LibParseError
    = LibParseErrorMatchString
    | LibParseErrorMustTakeWhile
    | LibParseErrorMustSepBy
    | LibParseErrorEndOfString
    | LibParseErrorNotANumber


export type LibParseErrorNotANumber = {
    kind: 'NOT_A_NUMBER'
    input: string
}
export type LibParseErrorEndOfString = {
    kind: 'EXPECTS_A_CHAR'
    input: ""
    expects?: string
}
export type LibParseErrorMatchString = {
    kind: 'EXPECTS_A_STRING'
    expectedOneOf: string[]
    input: string
}
export type LibParseErrorMustTakeWhile = {
    kind: 'EXPECTS_PATTERN'
    expectedPattern: RegExp | String
    input: string
}
export type LibParseErrorMustSepBy = {
    kind: 'EXPECTS_A_SEPARATOR'
    input: string
}

/** Given the original input string, this function adds position info to the provided Error  */
export function toOutputError(fullInput: string, error: ErrorWithoutPosition): Error {
    let start: number
    let end: number
    switch(error.kind) {
        case 'EXPECTS_A_STRING':
        case 'EXPECTS_PATTERN':
        case 'EXPECTS_A_SEPARATOR':
        case 'NOT_CONSUMED_ALL':
        case 'EXPECTS_A_CHAR':
        case 'NOT_A_NUMBER':
            start = fullInput.length - error.input.length
            end = start
            return { ...error, pos: { start, end } }
        case 'EVAL_THROW':
        case 'FUNCTION_NOT_DEFINED':
        case 'NOT_A_FUNCTION':
            start = fullInput.length - error.expr.pos.startLen
            end = fullInput.length - error.expr.pos.endLen
            return { ...error, pos: { start, end } }
    }
    neverHappens(error)
}

function neverHappens(_: never): never {
    throw new Error('Cannot happen')
}