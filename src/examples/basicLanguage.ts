import * as assert from 'assert'
import * as angu from '../index'

type Any = angu.Value;

/**
 * Build a very simple expression based language with assignment,
 * semicolon separated expressions and some operators and functions.
 */
export default function basicLanguage () {

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
            // we can access the kind and name of input args. This
            // allows us to do things like variable assignment:
            '=': function(a: Any, b: Any) {
                const resB = b.eval()
                if (a.kind() === 'variable') {
                    this.context.scope[a.name()] = resB
                } else {
                    throw Error(`Assignment expected a variable on the left but got a ${a.kind()}`)
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

}