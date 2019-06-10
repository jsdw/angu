import { Result } from './result';
import { ParseError } from './errors';
declare type ParseResult<T> = Result<{
    output: T;
    rest: string;
}, ParseError>;
declare type EvalResult<T> = Result<T, ParseError>;
export declare type Pos = {
    /** How long is the input string at the start of parsing? */
    startLen: number;
    /** How long is the input string at the end of parsing? */
    endLen: number;
};
declare type Pattern = ((char: string) => boolean) | string | RegExp;
export default class Parser<T> {
    readonly _fn_: (input: string) => ParseResult<T>;
    private constructor();
    eval(input: string): EvalResult<T>;
    parse(input: string): ParseResult<T>;
    /** A parser that does nothing */
    static ok<T>(val: T): Parser<T>;
    /** Any one character. Only fails on an empty string */
    static anyChar(): Parser<string>;
    /** A convenience function to turn a function scope into a parser to avoid reuse of vars */
    static lazy<T>(fn: () => Parser<T>): Parser<T>;
    /** Return a parser that matches a given string */
    static matchString(...strings: string[]): Parser<string>;
    /** Take characters while the fn provided matches them to a max of n */
    static takeWhileN(n: number, pat: Pattern): Parser<string>;
    static takeWhile(pat: Pattern): Parser<string>;
    /** Take characters while the fn provided matches them to a max of n */
    static mustTakeWhileN(n: number, pat: Pattern): Parser<string>;
    static mustTakeWhile(pat: Pattern): Parser<string>;
    /** Run this on a parser to peek at the available position information (distances from end) */
    mapWithPosition<T2>(fn: (res: T, pos: Pos) => T2): Parser<T2>;
    /** Make the success of this parser optional */
    optional(): Parser<Result<T, ParseError>>;
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
    static takeUntil<T>(untilParser: Parser<T>): Parser<{
        result: string;
        until: T;
    }>;
}
export {};
