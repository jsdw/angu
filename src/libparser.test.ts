import Parser from './libparser'
import { isOk, isErr, ok } from './result'
import * as assert from 'assert'

describe("libparser", function() {

    it('can match strings', () => {
        expectDoesMatchString('foo', 'bar', 'foobar')
        expectDoesMatchString('f', 'oobar', 'foobar')
        expectDoesMatchString('foobar', '', 'foobar')
    })
    function expectDoesMatchString(m: string, r: string, s: string) {
        const res = Parser
            .matchString(m)
            .parse(s)
        assert.ok(isOk(res), `${m} did not match ${s}`)
        if (isOk(res)) {
            assert.equal(res.value.rest, r)
        }
    }

    it('wont match wrong strings', () => {
        expectDoesNotMatchString('o', 'foobar')
        expectDoesNotMatchString('foobarr', 'foobar')
    })
    function expectDoesNotMatchString(m: string, s: string) {
        const res = Parser
            .matchString(m)
            .parse(s)
        assert.ok(isErr(res), `${m} matched ${s}`)
    }

    it('can takeWhile', function () {
        expectDoesTakeWhile(c => /[a-z]/.test(c), 'foo', '123', 'foo123')
        expectDoesTakeWhile(c => /[0-9]/.test(c), '123', 'foo', '123foo')
        expectDoesTakeWhile(c => /[0-9]/.test(c), '', 'foo123', 'foo123')
        expectDoesTakeWhile(c => /[0-9a-z]/.test(c), '123foo', '', '123foo')
    })
    function expectDoesTakeWhile(
        fn: (c: string) => boolean,
        m: string, r: string, s: string) {
        const res = Parser
            .takeWhile(fn)
            .parse(s)
        assert.ok(isOk(res))
        if (isOk(res)) {
            assert.equal(res.value.rest, r)
            assert.equal(res.value.output, m)
        }
    }

    it('will get at least one char back from mustTakeWhile', () => {
        const p = Parser.mustTakeWhile(c => /[0-9]/.test(c))

        assert.deepEqual(p.parse('123foo'), ok({ output: '123', rest: 'foo' }))
        assert.deepEqual(p.parse('1foo'), ok({ output: '1', rest: 'foo' }))
        assert.ok(isErr(p.parse('')))
        assert.ok(isErr(p.parse('foo')))
    })

    it('can combine parsers with "or"', () => {
        const p = Parser.matchString('foo')
            .or(Parser.matchString('bar'))
            .or(Parser.matchString('wibble'))

        assert.deepEqual(p.parse('fooey'), ok({ output: 'foo', rest: 'ey' }))
        assert.deepEqual(p.parse('foobar'), ok({ output: 'foo', rest: 'bar' }))
        assert.deepEqual(p.parse('barry'), ok({ output: 'bar', rest: 'ry' }))
        assert.deepEqual(p.parse('wibbleton'), ok({ output: 'wibble', rest: 'ton' }))
        assert.ok(isErr(p.parse('fo')))
        assert.ok(isErr(p.parse('foebar')))
    })

    it('can chain parsers with andThen', () => {
        const p = Parser.matchString('foo')
            .andThen(r1 => Parser.matchString('bar').map(r2 => [r1, r2]))
            .andThen(([r1,r2]) => Parser.takeWhile(a => /[a-z]/.test(a)).map(r3 => [r1,r2,r3]))

        assert.deepEqual(p.parse('foobare'), ok({ output: ['foo', 'bar', 'e'], rest: '' }))
        assert.deepEqual(p.parse('foobarr1'), ok({ output: ['foo', 'bar', 'r'], rest: '1' }))
        assert.deepEqual(p.parse('foobar'), ok({ output: ['foo', 'bar', ''], rest: '' }))
        assert.ok(isErr(p.parse('fooba')))
    })

})