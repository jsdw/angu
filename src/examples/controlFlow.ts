import * as assert from 'assert'
import * as angu from '../index'

type Any = angu.Value;

/**
 * This shows that it is possible to implement control flow using
 * a function (`if`) and only evaluating one argument or the other
 * depending on the condition (which evaluates to truthy or falsey)
 */
export function basicControlFlow () {

    let good = false
    let bad = false

    const ctx: angu.Context = {
        scope: {
            // Only evaluates one of `then` or `otherwise`:
            'if': (cond: Any, then: Any, otherwise: Any) => {
                if (cond.eval()) {
                    return then.eval()
                } else {
                    return otherwise.eval()
                }
            },
            // Run these to set our good or bad variable:
            'setGood': () => { good = true },
            'setBad': () => { bad = true }
        }
    }

    // Only setGood should be called:
    good = false
    bad = false
    angu.evaluate('if(true, setGood(), setBad())', ctx)
    assert.equal(good, true)
    assert.equal(bad, false)

    // Only setGood should be called:
    good = false
    bad = false
    angu.evaluate('if(false, setBad(), setGood())', ctx)
    assert.equal(good, true)
    assert.equal(bad, false)

}

/**
 * We can also use operators to perform control flow; here we create the
 * OR operator (`||`), which only evaluates the argument on the right if
 * the argument on the left was falsey.
 */
export function shortCircuiting () {

    let good = false
    let bad = false

    const ctx: angu.Context = {
        scope: {
            // Evaluates to the first truthy result, short circuiting right:
            '||': (a: Any, b: Any) => {
                // fallback to JS, which doesn't evaluate the expr on
                // the right if the left one is truthy:
                return a.eval() || b.eval()
            },
            // Just for fun, we can implement the above as a binary string op too:
            'or': (a: Any, b: Any) => a.eval() || b.eval(),
            // Run these to set our good or bad variable (setGood returns truthy):
            'setGood': () => { good = true; return true },
            'setBad': () => { bad = true }
        },
        precedence: [
            // List the function we want to be able to use as
            // a binary operator here to make it so:
            ['or']
        ]
    }

    // Only setGood should be called, evaluation stops before any `setBad` calls:

    good = false
    bad = false
    angu.evaluate('setGood() || setBad() || setBad()', ctx)
    assert.equal(good, true)
    assert.equal(bad, false)

    good = false
    bad = false
    angu.evaluate('false or setGood() or setBad() or setBad()', ctx)
    assert.equal(good, true)
    assert.equal(bad, false)

    good = false
    bad = false
    angu.evaluate('false || false || setGood() || setBad() || setBad()', ctx)
    assert.equal(good, true)
    assert.equal(bad, false)

}

