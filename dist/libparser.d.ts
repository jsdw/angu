import { Result } from './result';
declare type Input = string;
declare type ParseResult<T> = Result<{
    output: T;
    rest: Input;
}, Err>;
declare type EvalResult<T> = Result<T, Err>;
export declare type Err = ErrMatchString | ErrMustTakeWhile | ErrMustSepBy;
export declare type ErrMatchString = {
    kind: ErrKind.MatchString;
    expected: string;
    input: Input;
};
export declare type ErrMustTakeWhile = {
    kind: ErrKind.MustTakeWhile;
    input: Input;
};
export declare type ErrMustSepBy = {
    kind: ErrKind.MustSepBy;
    input: Input;
};
export declare enum ErrKind {
    MatchString = "MATCH_STRING",
    MustTakeWhile = "MUST_TAKE_WHILE",
    MustSepBy = "MUST_SEP_BY"
}
declare type Pattern = ((char: string) => boolean) | string | RegExp;
export default class Parser<T> {
    readonly _fn_: (input: Input) => ParseResult<T>;
    private constructor();
    eval(input: Input): EvalResult<T>;
    parse(input: Input): ParseResult<T>;
    /** A parser that does nothing */
    static ok<T>(val: T): Parser<T>;
    /** A convenience function to turn a function scope into a parser to avoid reuse of vars */
    static lazy<T>(fn: () => Parser<T>): Parser<T>;
    /** Return a parser that matches a given string */
    static matchString(s: Input): Parser<string>;
    /** Take characters while the fn provided matches them to a max of n */
    static takeWhileN(n: number, pat: Pattern): Parser<string>;
    static takeWhile(pat: Pattern): Parser<string>;
    /** Take characters while the fn provided matches them to a max of n */
    static mustTakeWhileN(n: number, pat: Pattern): Parser<string>;
    static mustTakeWhile(pat: Pattern): Parser<string>;
    /** Make the success of this parser optional */
    optional(): Parser<Result<T, Err>>;
    /** Map this parser result into something else */
    map<T2>(fn: (result: T) => T2): Parser<T2>;
    /** Succeeds if the current parser or the one provided succeeds */
    or(other: Parser<T>): Parser<T>;
    /** Pass the result of the this parser to a function which returns the next parser */
    andThen<T2>(next: (result: T) => Parser<T2>): Parser<T2>;
    sepBy<S>(sep: Parser<S>): Parser<{
        results: T[];
        separators: S[];
    }>;
    mustSepBy<S>(sep: Parser<S>): Parser<{
        results: T[];
        separators: S[];
    }>;
}
export {};
