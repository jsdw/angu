import { Expression, ExprVariable, ExprNumber, ExprBool, ExprFunctioncall } from './expression'
import { EvalError } from './errors'
import { ExpressionOpts } from './parser'

/**
 * The context in which an expression will be evaluated.
 * This defines the variables, operators and functions that
 * are available to use.
 */
export type Context = ExpressionOpts

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

export function evaluate(expr: Expression, context: Context): Value {
    switch(expr.kind) {
        case 'variable': return evaluateVariable(expr, context)
        case 'number': return evaluateNumber(expr, context)
        case 'bool': return evaluateBool(expr, context)
        case 'functioncall': return evaluateFunctioncall(expr, context)
    }
}

function evaluateVariable(expr: ExprVariable, context: Context): Value {
    // If the variable doesn't exist, return its name. Assuming assignment
    // isn't implemented, this allows for primitive tokens.
    return new Value(expr, () => {
        const res = (context.scope || EMPTY)[expr.name] as unknown
        return typeof res === 'undefined'
            ? expr.name
            : res
    })
}

function evaluateNumber(expr: ExprNumber, _context: Context): Value<number> {
    return new Value(expr, () => expr.value)
}

function evaluateBool(expr: ExprBool, _context: Context): Value<boolean> {
    return new Value(expr, () => expr.value)
}

function evaluateFunctioncall(expr: ExprFunctioncall, context: Context): Value {
    return new Value(expr, () => {
        const fn = (context.scope || EMPTY)[expr.name]
        if (typeof fn === 'function') {
            try {
                return fn.apply({ context }, expr.args.map(arg => evaluate(arg, context)))
            } catch (e) {
                const err: EvalError = {
                    kind: 'EVAL_THROW',
                    expr,
                    error: e
                }
                throw err
            }
        } else if (!fn) {
            const err: EvalError = {
                kind: 'FUNCTION_NOT_DEFINED',
                expr
            }
            throw err
        } else {
            const err: EvalError = {
                kind: 'NOT_A_FUNCTION',
                expr,
                value: fn
            }
            throw err
        }
    })
}

export class Value<T = any> {
    constructor(readonly expr: Expression, readonly evaluate: () => T) {}

    /** Evaluate the expression and return the result */
    eval() {
        return this.evaluate()
    }

    /** Return the raw, unevaluated expression */
    raw() {
        return this.expr
    }
}

const EMPTY = {}