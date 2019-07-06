import { Parser } from './libparser'
import { isOk, isErr, ok, err } from './result'
import * as assert from 'assert'

describe("libparser", function() {

    it('can match any character', () => {
        assert.deepEqual(Parser.anyChar().parse(''), err({ kind: 'EXPECTS_A_CHAR', input: '' }))
        assert.deepEqual(Parser.anyChar().parse('a'), ok({ output: 'a', rest: '' }))
        assert.deepEqual(Parser.anyChar().parse('*'), ok({ output: '*', rest: '' }))
        assert.deepEqual(Parser.anyChar().parse('abc'), ok({ output: 'a', rest: 'bc' }))
    })

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
        expectDoesTakeWhile(/[a-z]/, 'foo', '123', 'foo123')
        expectDoesTakeWhile(/[0-9]/, '123', 'foo', '123foo')
        expectDoesTakeWhile(/[0-9]/, '', 'foo123', 'foo123')
        expectDoesTakeWhile(/[0-9a-z]/, '123foo', '', '123foo')
    })
    function expectDoesTakeWhile(
        re: RegExp,
        m: string, r: string, s: string) {
        const res = Parser
            .takeWhile(re)
            .parse(s)
        assert.ok(isOk(res))
        if (isOk(res)) {
            assert.equal(res.value.rest, r)
            assert.equal(res.value.output, m)
        }
    }

    it('can takeUntil', () => {
        assert.deepEqual(Parser.takeUntil(Parser.matchString('l')).parse('foo'), err({ kind: 'EXPECTS_A_CHAR', input: '' }))
        assert.deepEqual(Parser.takeUntil(Parser.matchString('l')).parse('fool'), ok({ output: { result: 'foo', until: 'l' }, rest: '' }))
        assert.deepEqual(Parser.takeUntil(Parser.matchString('l')).parse('list'), ok({ output: { result: '', until: 'l' }, rest: 'ist' }))
    })

    it('will get at least one char back from mustTakeWhile', () => {
        const p = Parser.mustTakeWhile(/[0-9]/)

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
            .andThen(([r1,r2]) => Parser.takeWhile(/[a-z]/).map(r3 => [r1,r2,r3]))

        assert.deepEqual(p.parse('foobare'), ok({ output: ['foo', 'bar', 'e'], rest: '' }))
        assert.deepEqual(p.parse('foobarr1'), ok({ output: ['foo', 'bar', 'r'], rest: '1' }))
        assert.deepEqual(p.parse('foobar'), ok({ output: ['foo', 'bar', ''], rest: '' }))
        assert.ok(isErr(p.parse('fooba')))
    })

})