import * as assert from 'assert'
import * as angu from '../index'

type Any = angu.Value;

/**
 * A simple calculator with a constant and a few operators available,
 * taking care to assign the correct precedence to operators so that
 * they are applied in the right order.
 */
export default function calculator () {

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

}