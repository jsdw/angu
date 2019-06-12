import * as assert from 'assert'
import * as result from './result'

describe('result', function() {

    it('"ok" result is ok', () => {

        const okResult = result.ok(10)

        assert.ok(result.isOk(okResult))
        assert.ok(!result.isErr(okResult))

        const outputResult = result.toOutputResult(okResult)

        assert.ok(outputResult.isOk())
        assert.ok(!outputResult.isErr())

    })

    it('"err" result is err', () => {

        const errResult = result.err(10)

        assert.ok(!result.isOk(errResult))
        assert.ok(result.isErr(errResult))

        const outputResult = result.toOutputResult(errResult)

        assert.ok(!outputResult.isOk())
        assert.ok(outputResult.isErr())

    })

})