import { Expression, ExprVariable, ExprNumber, ExprBool, ExprFunctioncall } from './expression'
import { ExpressionOpts } from './parser'

export interface Context extends ExpressionOpts {
    /** Variables and functions that the evaluator can use */
    scope: { [name: string]: any }
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
    // if the variable doesn't exist, store the variable name as itself.
    // This allows evaluators to find out the name for eg assignment, and
    // sortof means that we have a basic token type.
    const res = context.scope[expr.name]
    if (typeof res === 'undefined') {
        context.scope[expr.name] = expr.name
        return expr.name
    } else {
        return res
    }
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
        const self = { context }
        return fn.apply(self, expr.args.map(arg => evaluate(arg, context)))
    } else if (!fn) {
        throw new Error(`The function ${expr.name} is not defined`)
    } else {
        throw new Error(`${expr.name} is being called like a function but is not one`)
    }
}