import * as interpreter from './interpreter'
import * as parser from './parser'
import { isOk } from './result';

export { Context, FunctionContext } from './interpreter'

/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export function evaluate(input: string, context: interpreter.Context): any {
    const parsed = parser.expression(context).parse(input)

    if (!isOk(parsed)) {
        throw Error(`Parse error: ${parsed.value}`)
    }

    if (parsed.value.rest.length) {
        throw Error(`Parse error: input string not entirely consumed`)
    }

    return interpreter.evaluate(parsed.value.output, context)
}