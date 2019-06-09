import { Expression, ExprVariable, ExprNumber, ExprBool, ExprFunctioncall } from './expression'
import { EvalError } from './errors'
import { ExpressionOpts } from './parser'
import { Result, ok, err, isOk } from './result'

/**
 * The context in which an expression will be evaluated.
 * This defines the variables, operators and functions that
 * are available to use.
 */
export interface Context extends ExpressionOpts {
    /** Variables and functions that the evaluator can use */
    scope: { [name: string]: any }
}

/**
 * This context is provided to any functions on scope that are called
 * by the interpreter.
 */
export interface FunctionContext extends Context {
    /**
     * Raw, unevaluated Expressions (the evaluated forms of which have)
     * been provided as the function args
     */
    rawArgs: Expression[]
}

export function evaluate(expr: Expression, context: Context): Result<unknown, EvalError> {
    switch(expr.kind) {
        case 'variable': return evaluateVariable(expr, context)
        case 'number': return evaluateNumber(expr, context)
        case 'bool': return evaluateBool(expr, context)
        case 'functioncall': return evaluateFunctioncall(expr, context)
    }
}

function evaluateVariable(expr: ExprVariable, context: Context): Result<unknown, EvalError> {
    // If the variable doesn't exist, return its name. Assuming assignment
    // isn't implemented, this allows for primitive tokens.
    const res = context.scope[expr.name] as unknown
    return typeof res === 'undefined'
        ? ok(expr.name)
        : ok(res)
}

function evaluateNumber(expr: ExprNumber, _context: Context): Result<unknown, EvalError> {
    return ok(expr.value)
}

function evaluateBool(expr: ExprBool, _context: Context): Result<unknown, EvalError> {
    return ok(expr.value)
}

function evaluateFunctioncall(expr: ExprFunctioncall, context: Context): Result<unknown, EvalError> {
    const fn = context.scope[expr.name]
    if (typeof fn === 'function') {
        const self = { context, rawArgs: expr.args }
        // Evaluate each arg before passing it in, threading out any errors:
        const evaluatedArgs = []
        for (const arg of expr.args) {
            const res = evaluate(arg, context)
            if (isOk(res)) {
                evaluatedArgs.push(res.value)
            } else {
                // Something went wrong evaluating a sub expr; pass that error on:
                return res
            }
        }
        try {
            return ok(fn.apply(self, evaluatedArgs))
        } catch (e) {
            return err({
                kind: 'EVAL_THROW',
                expr,
                error: e
            })
        }
    } else if (!fn) {
        return err({
            kind: 'FUNCTION_NOT_DEFINED',
            expr
        })
    } else {
        return err({
            kind: 'NOT_A_FUNCTION',
            expr,
            value: fn
        })
    }
}