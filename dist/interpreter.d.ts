import { Expression } from './expression';
import { ExpressionOpts } from './parser';
/**
 * The context in which an expression will be evaluated.
 * This defines the variables, operators and functions that
 * are available to use.
 */
export declare type Context = ExpressionOpts;
/**
 * This context is provided to any functions on scope that are called
 * by the interpreter.
 */
export interface FunctionContext extends Context {
    /**
     * Raw, unevaluated Expressions (the evaluated forms of which have)
     * been provided as the function args
     */
    rawArgs: Expression[];
}
export declare function evaluate(expr: Expression, context: Context): Value;
export declare class Value<T = any> {
    readonly expr: Expression;
    readonly evaluate: () => T;
    constructor(expr: Expression, evaluate: () => T);
    /** Evaluate the expression and return the result */
    val(): T;
    /** Return the raw, unevaluated expression */
    raw(): Expression;
}
