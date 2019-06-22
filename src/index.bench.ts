import assert from 'assert'
import Benchmark from 'benchmark'
import * as angu from './index'

//
// Some random benchmarks to assist in tuning performance.
//

// What is the cost of doing nothing?
benchmark('baseline eval', function () {})

// What is the cost of evaluating almost nothing in Angu?
benchmark('Angu baseline eval', function () {
    assert.equal(angu.evaluate("0", {}).value, 0)
})
const noWorkBaselinePreparedCtx = angu.prepareContext({})
benchmark('Angu baseline eval with prepared context', function () {
    assert.equal(angu.evaluate("0", noWorkBaselinePreparedCtx).value, 0)
})

// How expensive is evaluating a basic operator chain of integers?
benchmark('Angu basic operator eval', function () {
    const ctx: angu.Context = {
        scope: {
            '+': (a: angu.Value, b: angu.Value) => a.eval() + b.eval()
        }
    }
    const v = angu.evaluate("1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3", ctx)
    assert.equal(v.value, 36)
})

benchmark('Basic string eval', function () {
    assert.equal(angu.evaluate("'Hello \\' There'", {}).value, "Hello ' There")
})

benchmark('Mixed expression eval', function () {
    const ctx: angu.Context = {
        scope: {
            '+': (a: angu.Value, b: angu.Value) => a.eval() + b.eval(),
            'identity': (a: angu.Value) => a.eval()
        }
    }

    const v = angu.evaluate("'hello there' + 'person' + identity(2) + 10e1", ctx)
    assert.equal(v.value, "hello thereperson2100")

})

const mixedExpressionPreparedCtx = angu.prepareContext({
    scope: {
        '+': (a: angu.Value, b: angu.Value) => a.eval() + b.eval(),
        'identity': (a: angu.Value) => a.eval()
    }
})
benchmark('Mixed expression eval with prepared context', function () {
    const v = angu.evaluate("'hello there' + 'person' + identity(2) + 10e1", mixedExpressionPreparedCtx)
    assert.equal(v.value, "hello thereperson2100")
})

// Util function to run a benchmark:
function benchmark(name: string, fn: () => void) {
    const bench = new Benchmark(name, fn)
    try {
        fn()
        bench
            .on('complete', function(event: any) {
                console.log(String(event.target))
            })
            .run()
    } catch(e) {
        console.log(`${name} threw an error: ${e}`)
    }
}
