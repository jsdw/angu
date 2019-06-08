import * as assert from 'assert'
import { Context } from "./interpreter";
import { evaluate } from './index'

describe('index', function(){

    it('can be used to build up a basic language', () => {

        const ctx: () => Context = () => ({
            scope: {
                '-': (a: any, b: any) => a - b,
                '+': (a: any, b: any) => a + b,
                '/': (a: any, b: any) => a / b,
                '*': (a: any, b: any) => a * b,
                // eval but ignore the first thing; return the second.
                // suddenly we have multiple expressions!
                ';': (_: any, b: any) => b,
                // we can access raw, unevaluated args using the 'this'
                // object. Here, we expect assignment to be given a variable
                // name to assign a value to.
                '=': function(this: any, a: any, b: any) {
                    const firstArg = this.rawArgs[0]
                    if (firstArg.kind === 'variable') {
                        this.context.scope[firstArg.name] = b
                    } else {
                        throw Error(`Non-variable name provided to left of assignment: ${a}`)
                    }
                    return b
                },
                'log10': (a: any) => Math.log(a) / Math.log(10),
                'pow': (a: any, b: any) => Math.pow(a, b)
            },
            // first in this list = first to be evaluated:
            precedence: [
                ['/', '*'],
                ['-', '+'],
                // We can alter associativity of ops as well:
                { ops: ['='], associativity: 'right' },
                [';']
            ]
        })

        assert.equal(evaluate('1 + 2 + 3', ctx()), 6)
        assert.equal(evaluate('1 + 2 + 3 / 3', ctx()), 4)
        assert.equal(evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()), 8)
        assert.equal(evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()), 8)
        assert.equal(evaluate('(1 + 2 +  3/3) :pow 2 / 2', ctx()), 8)
        assert.equal(evaluate(' log10(100)  +2 -2', ctx()), 2)
        assert.equal(evaluate('foo = 8; foo = 10; bar = 2; foo * bar', ctx()), 20)

        // We'll use this example in the README:
        assert.equal(evaluate(`
            foo = 2;
            bar = 4;
            wibble = foo * bar + pow(2, 10);
            foo + bar + wibble
        `, ctx()), 1038)

    })

})