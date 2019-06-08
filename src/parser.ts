import Parser from './libparser'
import { Expression } from './expression'

const NUMBER_REGEX = /[0-9]/
const TOKEN_START_REGEX = /[a-zA-Z]/
const TOKEN_BODY_REGEX = /[a-zA-Z0-9_]/
const OP_REGEX = /[^0-9a-zA-Z()]/
const WHITESPACE_REGEX = /\s/
const DEFAULT_PRECEDENCE = 5

// Configure precedence of ops:

export type ExpressionOpts = {
    /** A map from op name to precedence. Higher = tighter binding */
    precedence: { [op: string]: number }
}

// Parse any expression. This is the primary entrypoint:

export function expression(opts: ExpressionOpts): Parser<Expression> {
    return parenExpression(opts)
        .or(functioncallExpression(opts))
        .or(binaryOpExpression(opts))
        .or(unaryOpExpression(opts))
        .or(numberExpression())
        .or(variableExpression())
}

// Parse different types of expression:

export function variableExpression(): Parser<Expression> {
    return token().map(tok => {
        return { kind: 'variable', name: tok }
    })
}

export function numberExpression(): Parser<Expression> {
    return number().map(n => {
        return { kind: 'number', number: n }
    })
}

export function unaryOpExpression(opts: ExpressionOpts): Parser<Expression> {
    return op().andThen(op => {
        return expression(opts).map(expr => {
            return { kind: 'unaryOp', op, expr }
        })
    })
}

export function binaryOpExpression(opts: ExpressionOpts): Parser<Expression> {
    // ops separate the expressions:
    const sep = ignoreWhitespace()
        .andThen(_ => op())
        .andThen(op => {
            return ignoreWhitespace().map(_ => op)
        })

    // given array of ops, return index of highest precedence:
    function highestPrecIdx(ops: string[]): number {
        let bestP: number = 0
        let bestOp: string = ''
        let bestIdx: number = -1

        for(let i = 0; i < ops.length; i++) {
            let curr = ops[i]
            let currP = opts.precedence[curr] || DEFAULT_PRECEDENCE

            if (!bestOp || currP > bestP) {
                bestOp = curr
                bestP = currP
                bestIdx = i
            }
        }
        return bestIdx
    }

    // parse expressions separated by ops, and use precedence
    // ordering to collapse them down into a single tree:
    return binaryOpSubExpression(opts)
        .mustSepBy(sep)
        .map(({ results, separators }) => {
            while (separators.length) {
                const idx = highestPrecIdx(separators)
                const op = separators.splice(idx, 1)[0]
                const left = results[idx]
                const right = results[idx+1]
                const expr: Expression = { kind: 'binaryOp', op, left, right }
                results.splice(idx, 2, expr)
            }
            return results[0]
        })
}

// When parsing binaryOpExpressions, we don't want to recursively try parsing
// each sub expression as binaryOp as well, so don't try parsing it:
export function binaryOpSubExpression(opts: ExpressionOpts): Parser<Expression> {
    return parenExpression(opts)
        .or(functioncallExpression(opts))
        .or(unaryOpExpression(opts))
        .or(numberExpression())
        .or(variableExpression())
}

export function functioncallExpression(opts: ExpressionOpts): Parser<Expression> {
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
            return expression(opts)
                .sepBy(sep)
                .map(({ results }) => results)
        })
        .map(args => {
            return { kind: 'functioncall', name, args }
        })
}

export function parenExpression(opts: ExpressionOpts): Parser<Expression> {
    let expr: Expression
    return Parser.matchString('(')
        .andThen(_ => ignoreWhitespace())
        .andThen(_ => expression(opts))
        .andThen(e => {
            expr = e
            return ignoreWhitespace()
        })
        .andThen(_ => Parser.matchString(')'))
        .map(_ => expr)
}

// Helpful utility parsers:

export function number(): Parser<number> {
    let nStr: string = ""
    return Parser.mustTakeWhile(NUMBER_REGEX)
        .andThen(r => {
            nStr += r
            return Parser.takeWhileN(1, '.')
        })
        .andThen(r => {
            nStr += r
            if (r === '.') {
                return Parser.mustTakeWhile(NUMBER_REGEX)
            } else {
                return Parser.ok('')
            }
        })
        .andThen(r => {
            nStr += r
            return Parser.ok(Number(nStr))
        })
}

export function token(): Parser<string> {
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
}

export function op(): Parser<string> {
    return Parser.mustTakeWhile(OP_REGEX)
}

export function ignoreWhitespace(): Parser<void> {
    return Parser
        .takeWhile(WHITESPACE_REGEX)
        .map(_ => undefined)
}