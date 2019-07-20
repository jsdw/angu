import { Expression, ExprVariable, ExprNumber, ExprBool, ExprFunctioncall, ExprString } from './expression'
import { InternalContext, Scope } from './context'
import { EvalError } from './errors'

export function create(expr: Expression, context: InternalContext, inputLength: number, locals?: Scope): Value {
    switch(expr.kind) {
        case 'variable': return thunkVariable(expr, context, inputLength, locals)
        case 'number': return thunkNumber(expr, context, inputLength)
        case 'bool': return thunkBool(expr, context, inputLength)
        case 'functioncall': return thunkFunctioncall(expr, context, inputLength, locals)
        case 'string': return thunkString(expr, context, inputLength)
    }
}

function thunkVariable(expr: ExprVariable, context: InternalContext, inputLength: number, locals?: Scope): Value {
    return new Value(inputLength, expr, () => {
        // Search locals first for the variable,
        // falling back to context.scope if no local:
        return locals && expr.name in locals
            ? locals[expr.name]
            : (context.scope || EMPTY)[expr.name]
    })
}

function thunkNumber(expr: ExprNumber, _context: InternalContext, inputLength: number): Value<number> {
    return new Value(inputLength, expr, () => expr.value)
}

function thunkBool(expr: ExprBool, _context: InternalContext, inputLength: number): Value<boolean> {
    return new Value(inputLength, expr, () => expr.value)
}

function thunkString(expr: ExprString, _context: InternalContext, inputLength: number): Value {
    return new Value(inputLength, expr, () => expr.value)
}

function thunkFunctioncall(expr: ExprFunctioncall, context: InternalContext, inputLength: number, locals?: Scope): Value {
    return new Value(inputLength, expr, () => {

        const fn = locals && expr.name in locals
            ? locals[expr.name]
            : (context.scope || EMPTY)[expr.name]

        if (typeof fn === 'function') {
            try {
                return fn.apply({ context }, expr.args.map(arg => create(arg, context, inputLength, locals)))
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
    constructor(
        readonly inputLength: number,
        readonly expr: Expression,
        readonly evaluateThunk: () => T
    ) {}

    /** Evaluate the thunk and return the resulting value */
    eval(): T {
        return this.evaluateThunk()
    }

    /** Return the kind of the expression */
    kind(): Expression['kind'] {
        return this.expr.kind
    }

    /** Return the start and end position of the expression */
    pos(): { start: number, end: number } {
        const pos = this.expr.pos
        const len = this.inputLength
        return {
            start: len - pos.startLen,
            end: len - pos.endLen
        }
    }

    /** Return the string rep we have for this thing */
    toString(): string {
        return stringifyExpr(this.expr)
    }

    /** Return the name of the thing (variable name/function name, or else string rep) */
    name(): string {
        return nameOfExpr(this.expr)
    }
}

function nameOfExpr(e: Expression): string {
    switch (e.kind) {
        case 'variable': return e.name
        case 'bool': return String(e.value)
        case 'number': return e.string
        case 'string': return e.value
        case 'functioncall': return e.name
    }
    // type error if we can get here.
}

function stringifyExpr(e: Expression): string {
    switch (e.kind) {
        case 'variable': return e.name
        case 'bool': return String(e.value)
        case 'number': return e.string
        case 'string': return stringifyString(e)
        case 'functioncall': return stringifyFunctionCall(e)
    }
    // type error if we can get here.
}

function stringifyFunctionCall(e: ExprFunctioncall): string {
    if (e.infix) {
        if (e.args.length == 1) {
            return e.name + "(" + stringifyExpr(e.args[0]) + ")"
        } else {
            return "(" + stringifyExpr(e.args[0]) + " " + e.name + " " + stringifyExpr(e.args[1]) + ")"
        }
    } else {
        return e.name + "(" + e.args.map(stringifyExpr).join(", ") + ")"
    }
}

function stringifyString(e: ExprString): string {
    const s = e.value
    // crude escaping of things:
    return '"' + s.replace(/(["\\])/g, '\\$1') + '"'
}

const EMPTY = {}