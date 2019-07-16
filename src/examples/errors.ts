import * as assert from 'assert'
import * as angu from '../index'

type Any = angu.Value;

/**
 * Failure to evaluate results in an error. Errors all have a `kind`,
 * and we can use TypeScript to ensure that we have handled every possible
 * error (and prove what error information is available) by matching on
 * this kind. All errors have a `pos.start` and `pos.end`. See `errors.ts`
 * for all of the possible types of error that can be given back.
 */
export default function errorMessages () {

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

}