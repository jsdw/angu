import { Parser, LibParseError } from './libparser'
import { Expression } from './expression'
import { InternalContext } from './context'
import { ParseError } from './errors'

const TOKEN_START_REGEX = /[a-zA-Z]/
const TOKEN_BODY_REGEX = /[a-zA-Z0-9_]/
const WHITESPACE_REGEX = /\s/

// Differentiate between parse errors we expose and those we handle internally.
type ExternalParser<T> = Parser<T,ParseError>
type InternalParser<T> = Parser<T,LibParseError>

/** Parse any expression, consuming surrounding space. This is the primary entry point: */
export function expression(opts: InternalContext): ExternalParser<Expression> {
    return anyExpression(opts).mapErr(e => {
        return { kind: 'PARSE_ERROR', input: e.input }
    })
}

export function anyExpression(opts: InternalContext): InternalParser<Expression> {
    const exprParser = binaryOpExpression(opts).or(binaryOpSubExpression(opts))

    return ignoreWhitespace()
        .andThen(_ => exprParser)
        .andThen(e => ignoreWhitespace().map(_ => e))
}

// When parsing binaryOpExpressions, we accept any sort of expression except
// another binaryOpExpression, since that would consume the stuff the first
// binaryOpExpr is trying to find.
export function binaryOpSubExpression(opts: InternalContext): InternalParser<Expression> {
    return parenExpression(opts)
        .or(stringExpression())
        .or(functioncallExpression(opts))
        .or(numberExpression())
        .or(unaryOpExpression(opts)) // try parsing number first, since numbers can by prefixed by + or -.
        .or(booleanExpression())
        .or(variableExpression())
}

// Parse different types of expression:

export function variableExpression(): InternalParser<Expression> {
    return token().mapWithPosition((tok, pos) => {
        return { kind: 'variable', name: tok, pos }
    })
}

export function numberExpression(): InternalParser<Expression> {
    return Parser.numberStr().mapWithPosition((n, pos) => {
        return { kind: 'number', value: Number(n), string: n, pos }
    })
}

export function stringExpression(): InternalParser<Expression> {
    return Parser.string().mapWithPosition((s, pos) => {
        return { kind: 'string', value: s, pos }
    })
}

export function booleanExpression(): InternalParser<Expression> {
    return Parser.matchString('true', 'false')
        .mapWithPosition((boolStr, pos) => {
            return {
                kind: 'bool',
                value: boolStr === 'true' ? true : false,
                pos
            }
        })
}

export function unaryOpExpression(opts: InternalContext): InternalParser<Expression> {
    return op(opts.unaryOps).andThen(op => {
        return anyExpression(opts).mapWithPosition((expr, pos) => {
            return { kind: 'functioncall', name: op.value, args: [expr], infix: true, pos }
        })
    })
}

export function binaryOpExpression(opts: InternalContext): InternalParser<Expression> {
    const precedence = opts.precedence || {}
    const associativity = opts.associativity || {}

    // Depending on whether we saw a space between op and first expression,
    // we can finish parsing the separator using one or both of these:
    const restOfNormalBinaryOp = op(opts.binaryOps).andThen(op => {
        return ignoreWhitespace().map(_ => op)
    })
    const restOfStringBinaryOp = op(opts.binaryStringOps).andThen(op => {
        return mustIgnoreWhitespace().map(_ => op)
    })

    // ops separate the expressions:
    const sep = ignoreWhitespace()
        .andThen(wasSpace => {
            return wasSpace
                ? restOfNormalBinaryOp.or(restOfStringBinaryOp)
                : restOfNormalBinaryOp
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

export function functioncallExpression(opts: InternalContext): InternalParser<Expression> {
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
                    .optional()
                    .map(maybe => maybe.kind === 'ok' ? maybe.value.results : [])
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

export function parenExpression(opts: InternalContext): InternalParser<Expression> {
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

export function token(): InternalParser<string> {
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
function op(opList: string[]): InternalParser<Op> {
    return Parser
        // An op is only valid if it's in the provided whitelist:
        .matchString(...opList).map(s => ({ value: s, isOp: true }))
}

function ignoreWhitespace(): InternalParser<boolean> {
    return Parser
        .takeWhile(WHITESPACE_REGEX)
        .map(s => !!s.length)
}

function mustIgnoreWhitespace(): InternalParser<void> {
    return Parser
        .mustTakeWhile(WHITESPACE_REGEX)
        .map(_ => undefined)
}