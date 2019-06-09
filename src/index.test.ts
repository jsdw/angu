import * as assert from 'assert'
import * as angu from './index'

// This file primarily serves to show what sorts of things
// you can do using this library. each `it` case is another
// completely self-contained example.

describe('index', function(){

    it('can be used to create a simple calculator', () => {

        // Define the functionality and such available to
        // the evaluator:
        const ctx: angu.Context = {
            // We provide these operators:
            scope: {
                '-': (a: any, b: any) => a - b,
                '+': (a: any, b: any) => a + b,
                '/': (a: any, b: any) => a / b,
                '*': (a: any, b: any) => a * b,
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

    })

    it('can provide back error information when something goes wrong', () => {

        // Define the functionality and such available to
        // the evaluator:
        const ctx: angu.Context = {
            // We provide these operators:
            scope: {
                '-': (a: any, b: any) => a - b,
                '+': (a: any, b: any) => a + b
            }
        }

        // This will be an error because * is not defined:
        const r1 = angu.evaluate('10 * 4 + 2', ctx)

        // We can use a convenience function to check error/ok:
        assert.ok(angu.isErr(r1))
        assert.ok(!angu.isOk(r1))

        // We can see manually that it is an error, and the error
        // kind specifies that the function is not defined:
        assert.equal(r1.kind, 'err')
        assert.equal(r1.value.kind, 'FUNCTION_NOT_DEFINED')

        // The error region is '10 * 4'. Total length of string
        // is 10, so starting length at error is 10, end length is 4
        // since the end of the string after the error is 4.
        assert.equal(r1.value.expr.pos.startLen, 10)
        assert.equal(r1.value.expr.pos.endLen, 4)

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
                '+': (a: any, b: any) => getValue(a) + getValue(b),
                '-': (a: any, b: any) => getValue(a) - getValue(b),
                ':': (a: string, b: string) => getRange(a, b),
                'SUM': (a: number[]) => a.reduce((acc, n) => acc + n, 0),
                'MEAN': (a: number[]) => a.reduce((acc, n) => acc + n, 0) / a.length
            }
        }

        // Finally, we can evaluate excel-like commands to query them:
        const r1 = angu.evaluate('SUM(A1:A3)', ctx).value
        assert.equal(r1, 6)
        const r2 = angu.evaluate('D1 + D2', ctx).value
        assert.equal(r2, 363)
        const r3 = angu.evaluate('MEAN(A1:A5) + SUM(C1:D2) - 10', ctx).value
        assert.equal(r3, 412)

    })

    it('can be used to build up a basic language', () => {

        const ctx: () => angu.Context = () => ({
            scope: {
                // Our basic calculator bits from above:
                '-': (a: any, b: any) => a - b,
                '+': (a: any, b: any) => a + b,
                '/': (a: any, b: any) => a / b,
                '*': (a: any, b: any) => a * b,
                // Let's allow multiple expressions, separated by ';':
                ';': (_: any, b: any) => b,
                // we can access raw, unevaluated args using the 'this'
                // object. We use this here to allow '=' to assign new
                // variables that are visible to our evaluator:
                '=': function(this: any, a: any, b: any) {
                    const firstArg = this.rawArgs[0]
                    if (firstArg.kind === 'variable') {
                        this.context.scope[firstArg.name] = b
                    } else {
                        throw Error(`Non-variable name provided to left of assignment: ${a}`)
                    }
                    return b
                },
                // we can define regular functions as well:
                'log10': (a: any) => Math.log(a) / Math.log(10),
                'pow': (a: any, b: any) => Math.pow(a, b)
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

        assert.equal(angu.evaluate('1 + 2 + 3', ctx()).value, 6)
        assert.equal(angu.evaluate('1 + 2 + 3 / 3', ctx()).value, 4)
        assert.equal(angu.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8)
        assert.equal(angu.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8)
        assert.equal(angu.evaluate("(1 + 2 +  3/3) 'pow 2 / 2", ctx()).value, 8)
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

})