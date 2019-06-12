import { Expression } from './expression';
import { InternalContext } from './context';
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
