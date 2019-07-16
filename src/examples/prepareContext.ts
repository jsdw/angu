import * as assert from 'assert'
import * as angu from '../index'

type Any = angu.Value;

/**
 * We can use a prepared `Context` to share state between successive evaluate
 * calls. This allows us to piece together multiple expressions if we like.
 *
 * This also improves performance, as the context needs to be prepared
 * before it can be used, and so doing it once before all uses is more efficient
 * than having it done implicitly for every use if it's not been prepared.
 */
export default function prepareContext () {

    const ctx: angu.Context = {
        scope: {
            // + op from earlier example:
            '+': (a: Any, b: Any) => a.eval() + b.eval(),
            // Assignment op from earlier example:
            '=': function(a: Any, b: Any) {
                const resB = b.eval()
                if (a.kind() === 'variable') {
                    this.context.scope[a.name()] = resB
                } else {
                    throw Error(`Assignment expected a variable on the left but got a ${a.kind()}`)
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

}