import { Expression } from './expression';
import { InternalContext, Scope } from './context';
export declare function create(expr: Expression, context: InternalContext, inputLength: number, locals?: Scope): Value;
export declare class Value<T = any> {
    readonly inputLength: number;
    readonly expr: Expression;
    readonly evaluateThunk: () => T;
    constructor(inputLength: number, expr: Expression, evaluateThunk: () => T);
    /** Evaluate the thunk and return the resulting value */
    eval(): T;
    /** Return the kind of the expression */
    kind(): Expression['kind'];
    /** Return the start and end position of the expression */
    pos(): {
        start: number;
        end: number;
    };
    /** Return the string rep we have for this thing */
    toString(): string;
    /** Return the name of the thing (variable name/function name, or else string rep) */
    name(): string;
}
