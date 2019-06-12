import * as assert from 'assert'
import * as angu from './index'

// This file primarily serves to show what sorts of things
// you can do using this library. each `it` case is another
// completely self-contained example.

type Any = angu.Value;

describe('index', function(){

    it('can be used to create a simple calculator', () => {

        // Define the functionality and such available to
        // the evaluator:
        const ctx: angu.Context = {
            // We provide these things in scope:
            scope: {
                '-': (a: Any, b: Any) => a.eval() - b.eval(),
                '+': (a: Any, b: Any) => a.eval() + b.eval(),
                '/': (a: Any, b: Any) => a.eval() / b.eval(),
                '*': (a: Any, b: Any) => a.eval() * b.eval(),
                'PI': 3.14
            },
            // And define the precedence to be as expected:
            precedence: [
                ['/', '*'],
                ['-', '+']
            ]
        }

        // Now, we can evaluate things in this context:
        const r1 = angu.evaluate('2 + 10 * 4', ctx)
        assert.equal(r1.value, 42)
        const r2 = angu.evaluate('10 + 4 / 2 * 3', ctx)
        assert.equal(r2.value, 16)
        const r3 = angu.evaluate('PI * 2', ctx)
        assert.equal(r3.value, 6.28)
    })

    it('can provide back error information when something goes wrong', () => {

        // Define the functionality and such available to
        // the evaluator:
        const ctx: angu.Context = {
            // We provide these operators:
            scope: {
                '-': (a: Any, b: Any) => a.eval() - b.eval(),
                '+': (a: Any, b: Any) => a.eval() + b.eval()
            }
        }

        // This will be an error because * is not defined:
        const r1 = angu.evaluate('10 * 4 + 2', ctx)

        // We can use convenience functions to check error/ok:
        assert.ok(r1.isErr())
        assert.ok(!r1.isOk())

        // Because the operator doesn't exist, we get a parse error as
        // the string could not be entirely consumed, along with the part
        // of the string that was not consumed:
        assert.equal(r1.kind, 'err')
        assert.equal(r1.value.kind, 'NOT_CONSUMED_ALL')
        assert.equal(r1.value.input, '* 4 + 2')

        // parse errors occur at a specific point, so start == end:
        assert.equal(r1.value.pos.start, 3)
        assert.equal(r1.value.pos.end, 3)

        // Everything is typed, so you can look at the errors defined
        // in `errors.ts` in order to see exactly what's available in
        // each case.

    })

    it('can be used to manipulate cells in a spreadsheet', () => {

        // Given some table of information (cols by letter, rows by number):
        const table = [
        //    A    B   C    D,
            [ 1,  'm', 30,  103],
            [ 2,  'f', 26,  260],
            [ 3,  'm', 18,  130],
            [ 4,  'm', 18,  130],
            [ 5,  'm', 18,  130],
            [ 6,  'm', 18,  130],
        ]

        // ... And functions that can access cells in this table:
        const getIdx = (str: string): [number, number] => {
            const colIdx = str.charCodeAt(0) - 65 // convert letters to col index
            const rowIdx = Number(str.slice(1)) - 1 // use rest as row index (1 indexed)
            return [rowIdx, colIdx]
        }
        const getValue = (val: any): any => {
            if (typeof val === 'string') {
                const [rowIdx, colIdx] = getIdx(val)
                return table[rowIdx][colIdx]
            } else {
                return val
            }
        }
        const getRange = (a: string, b: string): any[] => {
            const [startRow, startCol] = getIdx(a)
            const [endRow, endCol] = getIdx(b)
            const out = []
            for(let i = startRow; i <= endRow; i++) {
                for(let j = startCol; j <= endCol; j++) {
                    out.push(table[i][j])
                }
            }
            return out
        }

        // ... We can define operators/functions to work on those cells:
        const ctx: angu.Context = {
            scope: {
                '+': (a: Any, b: Any) => getValue(a.eval()) + getValue(b.eval()),
                '-': (a: Any, b: Any) => getValue(a.eval()) - getValue(b.eval()),
                ':': (a: Any, b: Any) => getRange(a.eval(), b.eval()),
                'SUM': (a: angu.Value<number[]>) => {
                    return a.eval().reduce((acc, n) => acc + n, 0)
                },
                'MEAN': (a: angu.Value<number[]>) => {
                    let arr = a.eval()
                    return arr.reduce((acc, n) => acc + n, 0) / arr.length
                }
            }
        }

        // Finally, we can evaluate excel-like commands to query them:
        const r1 = angu.evaluate('SUM(A1:A3)', ctx).value
        assert.equal(r1, 6)
        const r2 = angu.evaluate('D1 + D2', ctx).value
        assert.equal(r2, 363)
        const r3 = angu.evaluate('MEAN(A1:A5) + SUM(C1:D2) - 10', ctx).value
        assert.equal(r3, 412)

        // Angu supports basic strings (surrounded by ' or "), which we can use
        // interchangeably with tokens that aren't on scope and so are returned as
        // strings:
        const r4 = angu.evaluate('MEAN("A1":\'A5\') + SUM(C1:"D2") - 10', ctx).value
        assert.equal(r4, 412)
    })

    it('can be used to build up a basic language', () => {

        // Put the context behind a function to guarantee that no
        // state is shared between subsequent evaluate calls.
        const ctx: () => angu.Context = () => ({
            scope: {
                // Our basic calculator bits from above:
                '-': (a: Any, b: Any) => a.eval() - b.eval(),
                '+': (a: Any, b: Any) => a.eval() + b.eval(),
                '/': (a: Any, b: Any) => a.eval() / b.eval(),
                '*': (a: Any, b: Any) => {
                    let aVal = a.eval()
                    const bVal = b.eval()
                    // Bit of fun; if we pass string * number, repeat string
                    // that number of times:
                    if (typeof aVal === 'string') {
                        const t = aVal
                        for(let i = 1; i < bVal; i++) aVal += t
                        return aVal
                    }
                    // Else, just assume both are numbers and multiply them:
                    else {
                        return a.eval() * b.eval()
                    }
                },
                // Let's allow multiple expressions, separated by ';':
                ';': (a: Any, b: Any) => { a.eval(); return b.eval() },
                // we can access raw, unevaluated args using the `.raw()`
                // method provided on values.
                '=': function(a: Any, b: Any) {
                    const rawA = a.raw()
                    const resB = b.eval()
                    if (rawA.kind === 'variable') {
                        this.context.scope[rawA.name] = resB
                    } else {
                        throw Error(`Assignment expected a variable on the left but got a ${rawA.kind}`)
                    }
                    return resB
                },
                // we can define regular functions as well:
                'log10': (a: Any) => Math.log(a.eval()) / Math.log(10),
                'pow': (a: Any, b: Any) => Math.pow(a.eval(), b.eval())
            },
            // first in this list = first to be evaluated:
            precedence: [
                ['/', '*'],
                ['-', '+'],
                // We can alter associativity of ops as well (right or left):
                { ops: ['='], associativity: 'right' },
                [';']
            ]
        })

        assert.equal(angu.evaluate('"hello " + "world"', ctx()).value, "hello world")
        assert.equal(angu.evaluate('"hello" * 4', ctx()).value, "hellohellohellohello")
        assert.equal(angu.evaluate('1 + 2 + 3', ctx()).value, 6)
        assert.equal(angu.evaluate('1 + 2 + 3 / 3', ctx()).value, 4)
        assert.equal(angu.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8)
        assert.equal(angu.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8)
        assert.equal(angu.evaluate("(1 + 2 +  3/3) `pow` 2 / 2", ctx()).value, 8)
        assert.equal(angu.evaluate(' log10(100)  +2 -2', ctx()).value, 2)
        assert.equal(angu.evaluate('foo = 8; foo = 10; bar = 2; foo * bar', ctx()).value, 20)

        // We'll use this example in the README:
        assert.equal(angu.evaluate(`
            foo = 2;
            bar = 4;
            wibble = foo * bar + pow(2, 10);
            foo + bar + wibble
        `, ctx()).value, 1038)

    })

    it('can prepare a context and reuse it across evaluations to share state', () => {
        const ctx: angu.Context = {
            scope: {
                // + op from earlier example:
                '+': (a: Any, b: Any) => a.eval() + b.eval(),
                // Assignment op from earlier example:
                '=': function(a: Any, b: Any) {
                    const rawA = a.raw()
                    const resB = b.eval()
                    if (rawA.kind === 'variable') {
                        this.context.scope[rawA.name] = resB
                    } else {
                        throw Error(`Assignment expected a variable on the left but got a ${rawA.kind}`)
                    }
                    return resB
                }
            },
            // We want to evaluate '+' calls before '=' calls:
            precedence: [
                ['+'],
                ['=']
            ]
        }

        // prepare a context to guarantee that we *do* share
        // state across subsequent eval calls:
        const preparedCtx = angu.prepareContext(ctx)

        // Subsequent calls are guaranteed to share state, so this works:
        assert.equal(angu.evaluate('foo = 10', preparedCtx).value, 10)
        assert.equal(angu.evaluate('foo = foo + 2', preparedCtx).value, 12)
        assert.equal(angu.evaluate('foo = foo + 5', preparedCtx).value, 17)

    })

})