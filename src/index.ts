import * as thunk from './thunk'
import * as parser from './parser'
import * as errors from './errors'
import { isOk, Result, err, ok, mapErr } from './result';
import { ExternalContext, toInternalContext } from './context'

// Re-export some useful functions:
export { FunctionContext, Value } from './thunk'
export { isOk, isErr } from './result'

export type Context = ExternalContext

/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export function evaluate(input: string, context: Context): Result<any, errors.Error> {
    const internalCtx = toInternalContext(context)
    const parsed = parser.expression(internalCtx).parse(input)

    if (!isOk(parsed)) {
        return mapErr(parsed, e => errors.addPositionToError(input, e))
    }

    if (parsed.value.rest.length) {
        let e: errors.InterpretError = { kind: 'NOT_CONSUMED_ALL', input: parsed.value.rest }
        return err(errors.addPositionToError(input, e))
    }

    try {
        const value = thunk.create(parsed.value.output, internalCtx)
        return ok(value.eval())
    } catch(e) {
        return err(e)
    }
}

