export interface ExternalContext {
    /**
     * Order ops from high to low precedence, and optionally
     * pick an associativity for them(default left). Ops declared
     * first are evaluated first.
     *
     * ops not defined here will have a lower precedence than anything
     * that is defined.
     */
    precedence?: ({
        ops: string[];
        associativity?: 'right' | 'left';
    } | string[])[];
    /** Variables and functions that are in scope during evaluation */
    scope?: {
        [name: string]: any;
    };
}
export interface InternalContext {
    /** This is used internally only */
    _internal_: true;
    /** A map from op name to precedence. Higher = tighter binding. Default 5 */
    precedence: PrecedenceMap;
    /** Is the operator left or right associative? Default left */
    associativity: AssociativityMap;
    /** A sorted list of valid ops to try parsing */
    ops: string[];
    /** Variables and functions that are in scope during evaluation */
    scope?: {
        [name: string]: any;
    };
}
export declare type PrecedenceMap = {
    [op: string]: number;
};
export declare type AssociativityMap = {
    [op: string]: 'left' | 'right';
};
export declare function toInternalContext(ctx: ExternalContext): InternalContext;
