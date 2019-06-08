import * as assert from 'assert'
import { Context } from "./interpreter";
import { run } from './index'

describe('index', function(){

    it('can act as a simple calculator', () => {

        const ctx: () => Context = () => ({
            scope: {
                '-': (a: any, b: any) => a - b,
                '+': (a: any, b: any) => a + b,
                '/': (a: any, b: any) => a / b,
                '*': (a: any, b: any) => a * b,
                // eval but ignore the first thing; return the second.
                // suddenly we have multiple expressions!
                ';': (_: any, b: any) => b,
                // variables that are not resolved resolve to their own name.
                // This allows us to assign to unassigned variables. A bit
                // hacky, will prob improve.
                '=': function(this: any, a: any, b: any) {
                    if (typeof a === 'string') {
                        this.context.scope[a] = b
                    } else {
                        throw Error(`cannot assign to the non-variable ${a}`)
                    }
                },
                'log10': (a: any) => Math.log(a) / Math.log(10),
                'pow': (a: any, b: any) => Math.pow(a, b)
            },
            precedence: {
                // 5 is default if not given
                '*': 6,
                '/': 6,
                ';': 0
            }
        })

        assert.equal(run('1 + 2 + 3', ctx()), 6)
        assert.equal(run('1 + 2 + 3 / 3', ctx()), 4)
        assert.equal(run('pow(1 + 2 +  3/3, 2) / 2', ctx()), 8)
        assert.equal(run(' log10(100)  +2 -2', ctx()), 2)
        assert.equal(run('foo = 10; bar = 2; foo * bar', ctx()), 20)

    })

})