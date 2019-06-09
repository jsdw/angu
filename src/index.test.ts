import * as assert from 'assert'
import { Context } from "./interpreter";
import * as calcjs from './index'

describe('index', function(){

    it('can be used to create a simple calculator', () => {

        // Define the functionality and such available to
        // the evaluator:
        const ctx: Context = {
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
        const r1 = calcjs.evaluate('2 + 10 * 4', ctx)
        assert.equal(r1.value, 42)
        const r2 = calcjs.evaluate('10 + 4 / 2 * 3', ctx)
        assert.equal(r2.value, 16)

    })

    it('can be used to build up a basic language', () => {

        const ctx: () => Context = () => ({
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

        assert.equal(calcjs.evaluate('1 + 2 + 3', ctx()).value, 6)
        assert.equal(calcjs.evaluate('1 + 2 + 3 / 3', ctx()).value, 4)
        assert.equal(calcjs.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8)
        assert.equal(calcjs.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8)
        assert.equal(calcjs.evaluate('(1 + 2 +  3/3) :pow 2 / 2', ctx()).value, 8)
        assert.equal(calcjs.evaluate(' log10(100)  +2 -2', ctx()).value, 2)
        assert.equal(calcjs.evaluate('foo = 8; foo = 10; bar = 2; foo * bar', ctx()).value, 20)

        // We'll use this example in the README:
        assert.equal(calcjs.evaluate(`
            foo = 2;
            bar = 4;
            wibble = foo * bar + pow(2, 10);
            foo + bar + wibble
        `, ctx()).value, 1038)

    })

})