import Parser from './libparser'
import { Expression } from './expression'
import { isOk } from './result';

const NUMBER_REGEX = /[0-9]/
const TOKEN_START_REGEX = /[a-zA-Z]/
const TOKEN_BODY_REGEX = /[a-zA-Z0-9_]/
const OP_REGEX = /[!£$%^&*@#~?<>|/+=;:-]/
const WHITESPACE_REGEX = /\s/
const INFIX_TOK_SURROUND = "`"

// Configure precedence of ops:

export interface ExpressionOpts {
    /**
     * Order ops from high to low precedence, and optionally
     * pick an associativity for them(default left). Ops declared
     * first are evaluated first.
     *
     * ops not defined here will have a lower precedence than anything
     * that is defined.
     */
    precedence?: ({ ops: string[], associativity?: 'right' | 'left' } | string[])[]
    /** Variables and functions that are in scope during evaluation */
    scope?: { [name: string]: any }
}

type InternalExpressionOpts = {
    /** A map from op name to precedence. Higher = tighter binding. Default 5 */
    precedence: PrecedenceMap
    /** Is the operator left or right associative? Default left */
    associativity: AssociativityMap
    /** A sorted list of valid ops to try parsing */
    ops: string[]
}

type PrecedenceMap = { [op: string]: number }
type AssociativityMap = { [op: string]: 'left' | 'right' }

/** Parse any expression, consuming surrounding space.This is the primary entry point: */
export function expression(opts: ExpressionOpts): Parser<Expression> {
    // Convert opts to an internal format that's easier to work with.
    const precedenceArray = opts.precedence || []
    const precedenceMap: PrecedenceMap = {}
    const associativityMap: AssociativityMap = {}
    let precedenceValue = precedenceArray.length
    for(const rawEntry of precedenceArray) {
        // entry could be ['+','-',..] or { ops: ['+', '-',..], associativity: 'left }
        // for convenience. Convert to the more general form to iterate over:
        const entry = Array.isArray(rawEntry) ? { ops: rawEntry } : rawEntry
        const ops = entry.ops
        const associativity = entry.associativity || 'left'
        // Note precedence and associativity of each op:
        for(const op of ops) {
            precedenceMap[op] = precedenceValue
            associativityMap[op] = associativity
        }
        precedenceValue--
    }

    // Look through scope to find all valid ops that have been declared.
    // We can then parse  exactly those, rejecting characters that aren't declared.
    // sort them longest first so we match most specific first.
    const scope = opts.scope || {}
    const validOps: string[] = []
    for (const key in scope) {
        // The op in scope must be a function:
        if (typeof scope[key] !== 'function') {
            continue
        }
        // Each character must be a valid op charatcer:
        for(let i = 0; i < key.length; i++) {
            const char = key.charAt(i)
            if (!OP_REGEX.test(char)) continue
        }
        validOps.push(key)
    }
    validOps.sort((a, b) => {
        return a.length > b.length ? -1
        : a.length < b.length ? 1
        : 0
    })

    return anyExpression({
        precedence: precedenceMap,
        associativity: associativityMap,
        ops: validOps
    })
}

export function anyExpression(opts: InternalExpressionOpts): Parser<Expression> {
    const exprParser = binaryOpExpression(opts).or(binaryOpSubExpression(opts))

    return ignoreWhitespace()
        .andThen(_ => exprParser)
        .andThen(e => ignoreWhitespace().map(_ => e))
}

// When parsing binaryOpExpressions, we accept any sort of expression except
// another binaryOpExpression, since that would consume the stuff the first
// binaryOpExpr is trying to find.
export function binaryOpSubExpression(opts: InternalExpressionOpts): Parser<Expression> {
    return parenExpression(opts)
        .or(stringExpression())
        .or(functioncallExpression(opts))
        .or(numberExpression())
        .or(unaryOpExpression(opts)) // try parsing number first, since numbers can by prefixed by + or -.
        .or(booleanExpression())
        .or(variableExpression())
}

// Parse different types of expression:

export function variableExpression(): Parser<Expression> {
    return token().mapWithPosition((tok, pos) => {
        return { kind: 'variable', name: tok, pos }
    })
}

export function numberExpression(): Parser<Expression> {
    return number().mapWithPosition((n, pos) => {
        return { kind: 'number', value: Number(n), string: n, pos }
    })
}

export function stringExpression(): Parser<Expression> {
    return string("'").or(string('"')).mapWithPosition((s, pos) => {
        return { kind: 'string', value: s, pos }
    })
}

export function booleanExpression(): Parser<Expression> {
    return Parser.matchString('true', 'false')
        .mapWithPosition((boolStr, pos) => {
            return {
                kind: 'bool',
                value: boolStr === 'true' ? true : false,
                pos
            }
        })
}

export function unaryOpExpression(opts: InternalExpressionOpts): Parser<Expression> {
    return op(opts.ops).andThen(op => {
        return anyExpression(opts).mapWithPosition((expr, pos) => {
            return { kind: 'functioncall', name: op.value, args: [expr], infix: true, pos }
        })
    })
}

export function binaryOpExpression(opts: InternalExpressionOpts): Parser<Expression> {
    const precedence = opts.precedence || {}
    const associativity = opts.associativity || {}

    // ops separate the expressions:
    const sep = ignoreWhitespace()
        .andThen(_ => op(opts.ops))
        .andThen(op => {
            return ignoreWhitespace().map(_ => op)
        })

    // given array of ops, return index of highest precedence:
    function highestPrecIdx(ops: Op[]): [number, number] {
        let bestP: number = 0
        let bestIdx: number = -1
        let bestLastIdx: number = -1

        for(let i = 0; i < ops.length; i++) {
            let curr = ops[i]
            // If we don't know the precedence, give infix function calls
            // the highest possible, and others a lower precedence than
            // anything defined (to reflect the fact that function calls
            // ordinary take precedence owing to brackets)
            let currP = precedence[curr.value] || (curr.isOp ? 0 : Infinity)

            if (bestIdx < 0 || currP > bestP) {
                bestP = currP
                bestIdx = i
                bestLastIdx = i
            } else if (currP === bestP && bestLastIdx - 1 === i) {
                // How many items in a row have the same precedence?
                // We can then look at associativity of them all.
                bestLastIdx = i
            }
        }
        return [bestIdx, bestLastIdx]
    }

    // Given some ops to look at first based on precedence, decide what to
    // look at next based on associativity:
    function getIdxFromAssociativity(startIdx: number, endIdx: number, ops: Op[]): number {
        let assoc = ""
        for (let i = startIdx; i <= endIdx; i++) {
            if (!assoc) {
                assoc = associativity[ops[i].value] || 'left'
            } else if (assoc !== associativity[ops[i].value]) {
                throw new Error('This should not be possible: adjacent operators have mixed associativity')
            }
        }
        return assoc === 'left'
            ? startIdx
            : endIdx
    }

    // parse expressions separated by ops, and use precedence
    // ordering to collapse them down into a single tree:
    return binaryOpSubExpression(opts)
        .mustSepBy(sep)
        .map(({ results, separators }) => {
            while (separators.length) {
                const [firstIdx, lastIdx] = highestPrecIdx(separators)
                const idx = getIdxFromAssociativity(firstIdx, lastIdx, separators)
                const op = separators.splice(idx, 1)[0]
                const left = results[idx]
                const right = results[idx+1]
                const expr: Expression = {
                    kind: 'functioncall',
                    name: op.value,
                    args: [ left, right ],
                    infix: true,
                    pos: { startLen: left.pos.startLen, endLen: right.pos.endLen }
                }
                results.splice(idx, 2, expr)
            }
            return results[0]
        })
}

export function functioncallExpression(opts: InternalExpressionOpts): Parser<Expression> {
    return Parser.lazy(() => {
        let name: string
        const sep = ignoreWhitespace()
            .andThen(_ => Parser.matchString(','))
            .andThen(_ => ignoreWhitespace())

        return token()
            .andThen(n => {
                name = n
                return Parser.matchString('(')
            })
            .andThen(_ => {
                return anyExpression(opts)
                    .sepBy(sep)
                    .map(({ results }) => results)
            })
            .andThen(r => {
                return ignoreWhitespace()
                    .andThen(_ => Parser.matchString(')'))
                    .map(_ => r)
            })
            .mapWithPosition((args, pos) => {
                return { kind: 'functioncall', name, args, infix: false, pos }
            })
    })

}

export function parenExpression(opts: InternalExpressionOpts): Parser<Expression> {
    return Parser.lazy(() => {
        let expr: Expression
        return Parser.matchString('(')
            .andThen(_ => ignoreWhitespace())
            .andThen(_ => anyExpression(opts))
            .andThen(e => {
                expr = e
                return ignoreWhitespace()
            })
            .andThen(_ => Parser.matchString(')'))
            .map(_ => expr)
    })
}

// Helpful utility parsers:

export function number(): Parser<string> {
    return Parser.lazy(() => {
        let nStr: string = ""
        return Parser.matchString('-')
            .or(Parser.matchString('+'))
            .optional()
            .andThen(r => {
                if (isOk(r)) { nStr += r.value }
                return Parser.mustTakeWhile(NUMBER_REGEX)
            })
            .andThen(r => {
                nStr += r
                return Parser.matchString('.').optional()
            })
            .andThen(r => {
                if (isOk(r)) {
                    nStr += '.'
                    return Parser.mustTakeWhile(NUMBER_REGEX)
                } else {
                    return Parser.ok('')
                }
            })
            .andThen(r => {
                nStr += r
                return Parser.ok(nStr)
            })
    })
}

export function string(delim: string): Parser<string> {
    const escapesAndEnds: Parser<string>
        = Parser.matchString('\\\\', '\\' + delim, delim)
    const restOfString: Parser<string> = Parser.takeUntil(escapesAndEnds)
        .andThen(c => {
            if(c.until === '\\' + delim) return restOfString.map(s => c.result + delim + s)
            else if(c.until === '\\\\') return restOfString.map(s => c.result + '\\' + s)
            return Parser.ok(c.result)
        })
    return Parser.matchString(`${delim}`).andThen(_ => restOfString)
}

export function token(): Parser<string> {
    return Parser.lazy(() => {
        let s: string = ""
        return Parser.mustTakeWhile(TOKEN_START_REGEX)
            .andThen(r => {
                s += r
                return Parser.takeWhile(TOKEN_BODY_REGEX)
            })
            .andThen(r => {
                s += r
                return Parser.ok(s)
            })
    })
}

type Op = { value: string, isOp: boolean }
export function op(opList: string[]): Parser<Op> {
    return Parser
        // An op is either a valid op that's been provided on scope, or..
        .matchString(...opList).map(s => ({ value: s, isOp: true }))
        // ..a token that's being used infix:
        .or(infixFunction())
}

function infixFunction(): Parser<Op> {
    return Parser.matchString(INFIX_TOK_SURROUND)
        .andThen(token)
        .andThen(t => {
            return Parser.matchString(INFIX_TOK_SURROUND).map(_ => ({ value: t, isOp: false }))
        })
}

export function ignoreWhitespace(): Parser<void> {
    return Parser
        .takeWhile(WHITESPACE_REGEX)
        .map(_ => undefined)
}