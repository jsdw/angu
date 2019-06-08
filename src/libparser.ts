import * as result from './result'
import { Result } from './result'

type Input = string

type ParseResult<T> = Result<{ output: T, rest: Input }, Err>
type EvalResult<T> = Result<T, Err>

type Err = {
    kind: ErrKind
    input: Input
}

enum ErrKind {
    MatchString,
    MustTakeWhile,
    MustSepBy
}

type Pattern
    = ((char: string) => boolean)
    | string
    | RegExp

export default class Parser<T> {
    private constructor(readonly _fn_: (input: Input) => ParseResult<T>) {}

    eval(input: Input): EvalResult<T> {
        const res = this._fn_(input)
        return result.map(res, val => val.output)
    }

    parse(input: Input): ParseResult<T> {
        return this._fn_(input)
    }

    /** A parser that does nothing */
    static ok<T>(val: T): Parser<T> {
        return new Parser(input => {
            return result.ok({ output: val, rest: input })
        })
    }

    /** A convenience function to turn a function scope into a parser to avoid reuse of vars */
    static lazy<T>(fn: () => Parser<T>): Parser<T> {
        return new Parser(input => {
            return fn().parse(input)
        })
    }

    /** Return a parser that matches a given string */
    static matchString(s: Input): Parser<string> {
        return new Parser(input => {
            if (input.slice(0, s.length) === s) {
                return result.ok({ output: s, rest: input.slice(s.length) })
            } else {
                return result.err({ kind: ErrKind.MatchString, input })
            }
        })
    }

    /** Take characters while the fn provided matches them to a max of n */
    static takeWhileN(n: number, pat: Pattern): Parser<string> {
        const fn
            = pat instanceof RegExp ? (c: string) => pat.test(c)
            : typeof pat === 'string' ? (c: string) => pat === c
            : pat
        return new Parser(input => {
            let i = 0
            while (i < n && fn(input.charAt(i))) {
                i++
            }
            return result.ok({ output: input.slice(0,i), rest: input.slice(i) })
        })
    }

    static takeWhile(pat: Pattern): Parser<string> {
        return Parser.takeWhileN(Infinity, pat)
    }

    /** Take characters while the fn provided matches them to a max of n */
    static mustTakeWhileN(n: number, pat: Pattern): Parser<string> {
        return new Parser(input => {
            const res = Parser.takeWhileN(n, pat).parse(input)
            if (result.isOk(res) && !res.value.output.length) {
                return result.err({ kind: ErrKind.MustTakeWhile, input })
            } else {
                return res
            }
        })
    }

    static mustTakeWhile(pat: Pattern): Parser<string> {
        return Parser.mustTakeWhileN(Infinity, pat)
    }

    /** Make the success of this parser optional */
    optional(): Parser<Result<T, Err>> {
        return new Parser(input => {
            const res = this.parse(input)
            if (result.isOk(res)) {
                return result.map(res, o => {
                    return { output: result.ok(o.output), rest: o.rest }
                })
            } else {
                return result.ok({
                    output: result.err(res.value), rest: input
                })
            }
        })
    }

    /** Map this parser result into something else */
    map<T2>(fn: (result: T) => T2): Parser<T2> {
        return new Parser(input => {
            return result.map(this.parse(input), val => {
                return { output: fn(val.output), rest: val.rest }
            })
        })
    }

    /** Succeeds if the current parser or the one provided succeeds */
    or(other: Parser<T>): Parser<T> {
        return new Parser(input => {
            const res1 = this.parse(input)
            if (result.isErr(res1)) {
                return other.parse(input)
            } else {
                return res1
            }
        })
    }

    /** Pass the result of the this parser to a function which returns the next parser */
    andThen<T2>(next: (result: T) => Parser<T2>): Parser<T2> {
        return new Parser(input => {
            const res1 = this.parse(input)
            if (result.isOk(res1)) {
                return next(res1.value.output).parse(res1.value.rest)
            } else {
                return res1
            }
        })
    }

    sepBy<S>(sep: Parser<S>): Parser<{ results: T[], separators: S[]}> {
        return new Parser(input => {
            let results: T[] = []
            let separators: S[] = []
            let restOfInput = input
            while (true) {
                const res = this.parse(restOfInput)
                if (result.isOk(res)) {
                    results.push(res.value.output)
                    restOfInput = res.value.rest
                    const sepRes = sep.parse(restOfInput)
                    if (result.isOk(sepRes)) {
                        restOfInput = sepRes.value.rest
                        separators.push(sepRes.value.output)
                    } else {
                        break
                    }
                } else {
                    break
                }
            }
            return result.ok({
                output: { results, separators },
                rest: restOfInput
            })
        })
    }

    mustSepBy<S>(sep: Parser<S>): Parser<{ results: T[], separators: S[]}>  {
        return new Parser(input => {
            const res = this.sepBy(sep).parse(input)
            if (result.isOk(res) && !res.value.output.separators.length) {
                return result.err({ kind: ErrKind.MustSepBy, input })
            } else {
                return res
            }
        })
    }
}
