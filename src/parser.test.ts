import * as assert from 'assert'
import * as parser from './parser'
import { ok, isErr } from './result'

describe('parser', function() {

    it('parses basic numbers properly', () => {
        assert.deepEqual(parser.number().eval('1234'), ok(1234))
        assert.deepEqual(parser.number().eval('1234.56'), ok(1234.56))
        assert.deepEqual(parser.number().eval('1.2'), ok(1.2))
        assert.deepEqual(parser.number().eval('0.5'), ok(0.5))
        assert.deepEqual(parser.number().eval('0.91'), ok(0.91))
        assert.ok(isErr(parser.number().eval('.91')))
        assert.ok(isErr(parser.number().eval('9.')))
        assert.ok(isErr(parser.number().eval('.')))
    })

    it('parses tokens properly', () => {
        assert.deepEqual(parser.token().eval('f'), ok('f'))
        assert.deepEqual(parser.token().eval('f_0'), ok('f_0'))
        assert.deepEqual(parser.token().eval('fo0'), ok('fo0'))
        assert.deepEqual(parser.token().eval('FoO0_'), ok('FoO0_'))
        assert.ok(isErr(parser.token().eval('_foo')))
        assert.ok(isErr(parser.token().eval('1foo')))
        assert.ok(isErr(parser.token().eval('1')))
        assert.deepEqual(parser.token().parse('foo-bar'), ok({ output: 'foo', rest: '-bar' }))
    })

    it('parses basic expression types', () => {
        const opts = { precedence: {} }
        assert.deepEqual(parser.expression(opts).eval('foo'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('1.2'), ok({ kind: 'number', number: 1.2 }))
        assert.deepEqual(parser.expression(opts).eval('(foo)'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('( foo)'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('( foo )'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('(1.2 )'), ok({ kind: 'number', number: 1.2 }))
    })

})