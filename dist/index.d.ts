import * as interpreter from './interpreter';
export { Context, FunctionContext } from './interpreter';
/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
export declare function evaluate(input: string, context: interpreter.Context): any;
