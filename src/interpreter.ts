import { Expression, ExprVariable, ExprNumber, ExprBool, ExprFunctioncall } from './expression'
import { ExpressionOpts } from './parser'

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

export function evaluate(expr: Expression, context: Context): any {
    switch(expr.kind) {
        case 'variable': return evaluateVariable(expr, context)
        case 'number': return evaluateNumber(expr, context)
        case 'bool': return evaluateBool(expr, context)
        case 'functioncall': return evaluateFunctioncall(expr, context)
    }
}

function evaluateVariable(expr: ExprVariable, context: Context): any {
    // If the variable doesn't exist, return its name. Assuming assignment
    // isn't implemented, this allows for primitive tokens.
    const res = context.scope[expr.name]
    return typeof res === 'undefined'
        ? expr.name
        : res
}

function evaluateNumber(expr: ExprNumber, _context: Context): any {
    return expr.value
}

function evaluateBool(expr: ExprBool, _context: Context): any {
    return expr.value
}

function evaluateFunctioncall(expr: ExprFunctioncall, context: Context): any {
    const fn = context.scope[expr.name]
    if (typeof fn === 'function') {
        const self = { context, rawArgs: expr.args }
        return fn.apply(self, expr.args.map(arg => evaluate(arg, context)))
    } else if (!fn) {
        throw new Error(`The function ${expr.name} is not defined`)
    } else {
        throw new Error(`${expr.name} is being called like a function but is not one`)
    }
}