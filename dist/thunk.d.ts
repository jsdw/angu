import { Expression } from './expression';
import { InternalContext } from './context';
/**
 * This context is provided to any functions on scope that are called
 * by the interpreter.
 */
export interface FunctionContext extends InternalContext {
    /**
     * Raw, unevaluated Expressions (the evaluated forms of which have)
     * been provided as the function args
     */
    rawArgs: Expression[];
}
export declare function create(expr: Expression, context: InternalContext): Value;
export declare class Value<T = any> {
    readonly expr: Expression;
    readonly evaluateThunk: () => T;
    constructor(expr: Expression, evaluateThunk: () => T);
    /** Evaluate the thunk and return the resulting value */
    eval(): T;
    /** Return the raw, unevaluated expression */
    raw(): Expression;
}
