import * as errors from './errors';
import { Result } from './result';
import { ExternalContext } from './context';
export { FunctionContext, Value } from './thunk';
export { isOk, isErr } from './result';
export declare type Context = ExternalContext;
/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export declare function evaluate(input: string, context: Context): Result<any, errors.Error>;
