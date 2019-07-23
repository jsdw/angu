import { Result } from './result';
declare type ParseResult<T, E> = Result<{
    output: T;
    rest: string;
}, E>;
declare type EvalResult<T, E> = Result<T, E>;
export declare type Pos = {
    /** How long is the input string at the start of parsing? */
    startLen: number;
    /** How long is the input string at the end of parsing? */
    endLen: number;
};
declare type Pattern = string | RegExp;
/** Internal, low level parse errors */
export declare type LibParseError = LibParseErrorMatchString | LibParseErrorMustTakeWhile | LibParseErrorMustSepBy | LibParseErrorEndOfString | LibParseErrorNotANumber;
declare type LibParseErrorNotANumber = {
    kind: 'NOT_A_NUMBER';
    input: string;
};
declare type LibParseErrorEndOfString = {
    kind: 'EXPECTS_A_CHAR';
    input: "";
    expects?: string;
};
declare type LibParseErrorMatchString = {
    kind: 'EXPECTS_A_STRING';
    expectedOneOf: string[];
    input: string;
};
declare type LibParseErrorMustTakeWhile = {
    kind: 'EXPECTS_PATTERN';
    expectedPattern: RegExp | String;
    input: string;
};
declare type LibParseErrorMustSepBy = {
    kind: 'EXPECTS_A_SEPARATOR';
    input: string;
};
export declare class Parser<T, E> {
    readonly _fn_: (input: string) => ParseResult<T, E>;
    private constructor();
    eval(input: string): EvalResult<T, E>;
    parse(input: string): ParseResult<T, E>;
    /** A parser that does nothing */
    static ok<T, E>(val: T): Parser<T, E>;
    /** Any one character. Only fails on an empty string */
    static anyChar(): Parser<string, LibParseError>;
    /**
     * Parse a string.
     * Expects strings to be surrounded in single or double quotes.
     * backslash to escape; anything can be escaped.
     */
    static string(): Parser<string, LibParseError>;
    /** Parse a number as a string */
    static numberStr(): Parser<string, LibParseError>;
    /** A convenience function to turn a function scope into a parser to avoid reuse of vars */
    static lazy<T, E>(fn: () => Parser<T, E>): Parser<T, E>;
    /** Return a parser that matches a given string */
    static matchString(...strings: string[]): Parser<string, LibParseError>;
    /** Take characters while the fn provided matches them to a max of n */
    static takeWhileN(n: number, pat: Pattern): Parser<string, never>;
    static takeWhile(pat: Pattern): Parser<string, never>;
    /** Take characters while the fn provided matches them to a max of n */
    static mustTakeWhileN(n: number, pat: Pattern): Parser<string, LibParseError>;
    static mustTakeWhile(pat: Pattern): Parser<string, LibParseError>;
    /** Run this on a parser to peek at the available position information (distances from end) */
    mapWithPosition<T2>(fn: (res: T, pos: Pos) => T2): Parser<T2, E>;
    /** Make the success of this parser optional */
    optional(): Parser<Result<T, E>, E>;
    /** Map this parser result into something else */
    map<T2>(fn: (result: T) => T2): Parser<T2, E>;
    mapErr<E2>(fn: (err: E) => E2): Parser<T, E2>;
    /** Succeeds if the current parser or the one provided succeeds */
    or(other: Parser<T, E>): Parser<T, E>;
    /** Pass the result of the this parser to a function which returns the next parser */
    andThen<T2>(next: (result: T) => Parser<T2, E>): Parser<T2, E>;
    sepBy<S>(sep: Parser<S, unknown>): Parser<{
        results: T[];
        separators: S[];
    }, never>;
    mustSepBy<S>(sep: Parser<S, unknown>): Parser<{
        results: T[];
        separators: S[];
    }, LibParseError>;
}
export {};
