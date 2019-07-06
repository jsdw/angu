import * as thunk from './thunk'
import * as parser from './parser'
import * as errors from './errors'
import { isOk, Result, err, ok, mapErr, toOutputResult, OutputResult } from './result';
import { ExternalContext, InternalContext, toInternalContext } from './context'

// Re-export the Value type, since it's handed to functions in scope:
export { Value } from './thunk'

// Re-export the Context type required by the evaluate method:
export type Context = ExternalContext

/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export function evaluate(input: string, context: Context | PreparedContext): OutputResult<any, errors.Error> {
    const internalCtx = toInternalContext(context)
    return toOutputResult(doEvaluate(input, internalCtx))
}
function doEvaluate(input: string, internalCtx: InternalContext): Result<any, errors.Error> {
    const parsed = parser.expression(internalCtx).parse(input)

    if (!isOk(parsed)) {
        return mapErr(parsed, e => errors.toOutputError(input, e))
    }

    if (parsed.value.rest.length) {
        let e: errors.InterpretError = { kind: 'NOT_CONSUMED_ALL', input: parsed.value.rest }
        return err(errors.toOutputError(input, e))
    }

    try {
        const value = thunk.create(parsed.value.output, internalCtx, input.length)
        return ok(value.eval())
    } catch(e) {
        return err(e)
    }
}

/**
 * Prepare a context to be used in an `evaluate` call. This allows you to
 * reuse a context across evaluations to avoid needing to prepare a new
 * context each time and to share state across evaluations.
 *
 * NOTE: Without preparing a context, we do not make any special attempt
 * to avoid mutating the context provided, but neither do we guarantee that
 * it will be mutated and thus can be passed to several `evaluate` calls
 * to share state. If you'd like to share state across calls, please use
 * this method. If you don't want to share state, create a brand new
 * context each time (for instance, via a function call)
 */
export function prepareContext(context: Context): PreparedContext {
    return toInternalContext(context)
}

/**
 * A context that's been prepared to be evaluated. This should not
 * be edited itself, but can be reused across evaluations to
 * reuse state and avoid needing to prepare a context each eval.
 */
type PreparedContext = {
    // This type is empty to provide tampering at the type level.
}
