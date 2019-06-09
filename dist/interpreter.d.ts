import { Expression } from './expression';
import { EvalError } from './errors';
import { ExpressionOpts } from './parser';
import { Result } from './result';
/**
 * The context in which an expression will be evaluated.
 * This defines the variables, operators and functions that
 * are available to use.
 */
export interface Context extends ExpressionOpts {
    /** Variables and functions that the evaluator can use */
    scope: {
        [name: string]: any;
    };
}
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
export declare function evaluate(expr: Expression, context: Context): Result<unknown, EvalError>;
