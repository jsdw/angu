import * as interpreter from './interpreter'
import * as parser from './parser'
import * as errors from './errors'
import { isOk, Result, err, ok, mapErr } from './result';

// Re-export some useful functions:
export { Context, FunctionContext, Value } from './interpreter'
export { isOk, isErr } from './result'

/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export function evaluate(input: string, context: interpreter.Context): Result<any, errors.Error> {
    const parsed = parser.expression(context).parse(input)

    if (!isOk(parsed)) {
        return mapErr(parsed, e => errors.addPositionToError(input, e))
    }

    if (parsed.value.rest.length) {
        let e: errors.InterpretError = { kind: 'NOT_CONSUMED_ALL', input: parsed.value.rest }
        return err(errors.addPositionToError(input, e))
    }

    try {
        const value = interpreter.evaluate(parsed.value.output, context)
        return ok(value.eval())
    } catch(e) {
        return err(e)
    }
}
