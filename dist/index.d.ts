import * as errors from './errors';
import { OutputResult } from './result';
import { ExternalContext } from './context';
export { Value } from './thunk';
export declare type Context = ExternalContext;
/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export declare function evaluate(input: string, context: Context | PreparedContext): OutputResult<any, errors.Error>;
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
export declare function prepareContext(context: Context): PreparedContext;
/**
 * A context that's been prepared to be evaluated. This should not
 * be edited itself, but can be reused across evaluations to
 * reuse state and avoid needing to prepare a context each eval.
 */
declare type PreparedContext = {};
