import * as interpreter from './interpreter';
import * as errors from './errors';
import { Result } from './result';
export { Context, FunctionContext, Value } from './interpreter';
export { isOk, isErr } from './result';
/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export declare function evaluate(input: string, context: interpreter.Context): Result<any, errors.Error>;
