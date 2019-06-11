import { Expression, ExprVariable, ExprNumber, ExprBool, ExprFunctioncall, ExprString } from './expression'
import { InternalContext } from './context'
import { EvalError } from './errors'

/**
 * This context is provided to any functions on scope that are called
 * by the interpreter.
 */
export interface FunctionContext extends InternalContext {
    /**
     * Raw, unevaluated Expressions (the evaluated forms of which have)
     * been provided as the function args
     */
    rawArgs: Expression[]
}

export function create(expr: Expression, context: InternalContext): Value {
    switch(expr.kind) {
        case 'variable': return thunkVariable(expr, context)
        case 'number': return thunkNumber(expr, context)
        case 'bool': return thunkBool(expr, context)
        case 'functioncall': return thunkFunctioncall(expr, context)
        case 'string': return thunkString(expr, context)
    }
}

function thunkVariable(expr: ExprVariable, context: InternalContext): Value {
    // If the variable doesn't exist, return its name. Assuming assignment
    // isn't implemented, this allows for primitive tokens.
    return new Value(expr, () => {
        const res = (context.scope || EMPTY)[expr.name] as unknown
        return typeof res === 'undefined'
            ? expr.name
            : res
    })
}

function thunkNumber(expr: ExprNumber, _context: InternalContext): Value<number> {
    return new Value(expr, () => expr.value)
}

function thunkBool(expr: ExprBool, _context: InternalContext): Value<boolean> {
    return new Value(expr, () => expr.value)
}

function thunkString(expr: ExprString, _context: InternalContext): Value {
    return new Value(expr, () => expr.value)
}

function thunkFunctioncall(expr: ExprFunctioncall, context: InternalContext): Value {
    return new Value(expr, () => {
        const fn = (context.scope || EMPTY)[expr.name]
        if (typeof fn === 'function') {
            try {
                return fn.apply({ context }, expr.args.map(arg => create(arg, context)))
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
    constructor(readonly expr: Expression, readonly evaluateThunk: () => T) {}

    /** Evaluate the thunk and return the resulting value */
    eval() {
        return this.evaluateThunk()
    }

    /** Return the raw, unevaluated expression */
    raw() {
        return this.expr
    }
}

const EMPTY = {}