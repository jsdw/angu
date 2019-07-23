import * as result from './result'
import { Result } from './result'

type ParseResult<T,E> = Result<{ output: T, rest: string },E>
type EvalResult<T,E> = Result<T,E>

export type Pos = {
    /** How long is the input string at the start of parsing? */
    startLen: number,
    /** How long is the input string at the end of parsing? */
    endLen: number
}

type Pattern
    = string
    | RegExp

/** Internal, low level parse errors */
export type LibParseError
    = LibParseErrorMatchString
    | LibParseErrorMustTakeWhile
    | LibParseErrorMustSepBy
    | LibParseErrorEndOfString
    | LibParseErrorNotANumber

type LibParseErrorNotANumber = {
    kind: 'NOT_A_NUMBER'
    input: string
}
type LibParseErrorEndOfString = {
    kind: 'EXPECTS_A_CHAR'
    input: ""
    expects?: string
}
type LibParseErrorMatchString = {
    kind: 'EXPECTS_A_STRING'
    expectedOneOf: string[]
    input: string
}
type LibParseErrorMustTakeWhile = {
    kind: 'EXPECTS_PATTERN'
    expectedPattern: RegExp | String
    input: string
}
type LibParseErrorMustSepBy = {
    kind: 'EXPECTS_A_SEPARATOR'
    input: string
}

export class Parser<T,E> {
    private constructor(readonly _fn_: (input: string) => ParseResult<T, E>) {}

    eval(input: string): EvalResult<T,E> {
        const res = this._fn_(input)
        return result.map(res, val => val.output)
    }

    parse(input: string): ParseResult<T,E> {
        return this._fn_(input)
    }

    /** A parser that does nothing */
    static ok<T,E>(val: T): Parser<T,E> {
        return new Parser(input => {
            return result.ok({ output: val, rest: input })
        })
    }

    /** Any one character. Only fails on an empty string */
    static anyChar(): Parser<string,LibParseError> {
        return new Parser(input => {
            if (input.length) {
                return result.ok({ output: input.slice(0,1), rest: input.slice(1) })
            } else {
                return result.err({ kind: 'EXPECTS_A_CHAR', input: "" })
            }
        })
    }

    /**
     * Parse a string.
     * Expects strings to be surrounded in single or double quotes.
     * backslash to escape; anything can be escaped.
     */
    static string(): Parser<string,LibParseError> {
        return new Parser(input => {
            const thisDelim = input[0]

            if (thisDelim !== '"' && thisDelim !== "'") {
                return result.err({
                    kind: 'EXPECTS_A_STRING',
                    expectedOneOf: ['"', "'"],
                    input
                })
            }

            let i = 1
            let lastEscape = false
            let s = ""
            while (i < input.length) {
                let char = input[i]

                // escape if backslash:
                if (!lastEscape && char === '\\') {
                    lastEscape = true
                }
                // return if closing delim, unescaped:
                else if (!lastEscape && char === thisDelim) {
                    return result.ok({ output: s, rest: input.slice(i+1) })
                }
                // Append char, unset escape mode if set:
                else {
                    s += char
                    lastEscape = false
                }

                i++
            }

            // We haven't returned a string, so we ran out of chars:
            return result.err({
                kind: 'EXPECTS_A_CHAR',
                input: ''
            })
        })
    }

    /** Parse a number as a string */
    static numberStr(): Parser<string,LibParseError> {
        return new Parser(input => {
            let idx = 0
            let nStr = ""

            // Return this on total failure:
            function nan(): ParseResult<string,LibParseError> {
                return result.err({
                    kind: 'NOT_A_NUMBER',
                    input
                })
            }
            // Prefix:
            function pushSign () {
                if (input[idx] === '+') {
                    idx++
                } else if (input[idx] === '-') {
                    idx++
                    nStr += '-'
                }
            }
            // Leading digits:
            function pushDigits () {
                let hasNumbers = false
                let charCode = input.charCodeAt(idx)
                while (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */) {
                    nStr += input[idx]
                    idx++
                    hasNumbers = true
                    charCode = input.charCodeAt(idx)
                }
                return hasNumbers
            }

            pushSign()
            const hasLeadingDigits = pushDigits()
            let hasDecimalPlaces = false

            // Decimal place and numbers after it:
            if (input[idx] === '.') {
                if (!hasLeadingDigits) nStr += '0'
                nStr += '.'
                idx++
                if (!pushDigits()) {
                    if (!hasLeadingDigits) {
                        return nan()
                    } else {
                        // failed to push digits, so remove the '.'
                        // and return the number we've got so far:
                        return result.ok({
                            output: nStr.slice(0, -1),
                            rest: input.slice(idx - 1)
                        })
                    }
                }
                hasDecimalPlaces = true
            }

            // A number has to have trailing digits or decimal
            // places, otherwise it's not valid:
            if (!hasLeadingDigits && !hasDecimalPlaces) {
                return nan()
            }

            // Exponent (e/E followed by optional sign and digits):
            let e = input[idx]
            if (e === 'e' || e === 'E') {
                const eIdx = idx
                nStr += 'e'
                idx++
                pushSign()
                if (!pushDigits()) {
                    // If no digits after E, roll back to last
                    // valid number and return that:
                    idx = eIdx
                    nStr = nStr.slice(0,eIdx)
                }
            }

            return result.ok({
                output: nStr,
                rest: input.slice(idx)
            })

        })
    }

    /** A convenience function to turn a function scope into a parser to avoid reuse of vars */
    static lazy<T,E>(fn: () => Parser<T,E>): Parser<T,E> {
        return new Parser(input => {
            return fn().parse(input)
        })
    }

    /** Return a parser that matches a given string */
    static matchString(...strings: string[]): Parser<string,LibParseError> {
        return new Parser(input => {
            for(const s of strings) {
                if (input.slice(0, s.length) === s) {
                    return result.ok({ output: s, rest: input.slice(s.length) })
                }
            }
            return result.err({ kind: 'EXPECTS_A_STRING', expectedOneOf: strings, input })
        })
    }

    /** Take characters while the fn provided matches them to a max of n */
    static takeWhileN(n: number, pat: Pattern): Parser<string,never> {
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

    static takeWhile(pat: Pattern): Parser<string,never> {
        return Parser.takeWhileN(Infinity, pat)
    }

    /** Take characters while the fn provided matches them to a max of n */
    static mustTakeWhileN(n: number, pat: Pattern): Parser<string,LibParseError> {
        return new Parser(input => {
            const res = Parser.takeWhileN(n, pat).parse(input)
            if (result.isOk(res) && !res.value.output.length) {
                return result.err({ kind: 'EXPECTS_PATTERN', expectedPattern: pat, input })
            } else {
                return res
            }
        })
    }

    static mustTakeWhile(pat: Pattern): Parser<string,LibParseError> {
        return Parser.mustTakeWhileN(Infinity, pat)
    }

    /** Run this on a parser to peek at the available position information (distances from end) */
    mapWithPosition<T2>(fn: (res: T, pos: Pos) => T2): Parser<T2,E> {
        return new Parser(input => {
            return result.map(this.parse(input), val => {
                const startLen = input.length
                const endLen = val.rest.length
                return { output: fn(val.output, { startLen, endLen }), rest: val.rest }
            })
        })
    }

    /** Make the success of this parser optional */
    optional(): Parser<Result<T,E>,E> {
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
    map<T2>(fn: (result: T) => T2): Parser<T2,E> {
        return new Parser(input => {
            return result.map(this.parse(input), val => {
                return { output: fn(val.output), rest: val.rest }
            })
        })
    }

    mapErr<E2>(fn: (err: E) => E2): Parser<T,E2> {
        return new Parser(input => {
            return result.mapErr(this.parse(input), err => {
                return fn(err)
            })
        })
    }

    /** Succeeds if the current parser or the one provided succeeds */
    or(other: Parser<T,E>): Parser<T,E> {
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
    andThen<T2>(next: (result: T) => Parser<T2,E>): Parser<T2,E> {
        return new Parser(input => {
            const res1 = this.parse(input)
            if (result.isOk(res1)) {
                return next(res1.value.output).parse(res1.value.rest)
            } else {
                return res1
            }
        })
    }

    sepBy<S>(sep: Parser<S,unknown>): Parser<{ results: T[], separators: S[]},never> {
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

    mustSepBy<S>(sep: Parser<S,unknown>): Parser<{ results: T[], separators: S[]},LibParseError>  {
        return new Parser(input => {
            const res = this.sepBy(sep).parse(input)
            if (result.isOk(res) && !res.value.output.separators.length) {
                return result.err({ kind: 'EXPECTS_A_SEPARATOR', input })
            } else {
                return res
            }
        })
    }

}
