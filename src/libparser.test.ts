import { Parser, LibParseError } from './libparser'
import { isOk, isErr, ok, err } from './result'
import * as assert from 'assert'

describe("libparser", function() {

    it('parses strings properly', () => {
        assertParsesStrings("'")
        assertParsesStrings('"')
    })
    function assertParsesStrings(delim: string) {
        assert.deepEqual(Parser.string().eval(`${delim}hello${delim}`), ok('hello'))
        assert.deepEqual(Parser.string().eval(`${delim}${delim}`), ok(''))
        // '\"" == '"' in the output:
        assert.deepEqual(Parser.string().eval(`${delim}hello \\${delim} there${delim}`), ok(`hello ${delim} there`))
        // two '\'s == one escaped '\' in the output:
        assert.deepEqual(Parser.string().eval(`${delim}hello \\\\${delim}`), ok('hello \\'))
        // three '\'s + '"' == one escaped '\' and then an escaped '"':
        assert.deepEqual(Parser.string().eval(`${delim}hello \\\\\\${delim}${delim}`), ok(`hello \\${delim}`))
    }

    it('parses basic numbers properly', () => {
        assert.deepEqual(Parser.numberStr().parse('1234'), ok({ output: '1234', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('1234.56'), ok({ output: '1234.56', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('1.21'), ok({ output: '1.21', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('-1.22'), ok({ output: '-1.22', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('+1.23'), ok({ output: '1.23', rest: '' })) // note output standardisation to remove '+'
        assert.deepEqual(Parser.numberStr().parse('0.5'), ok({ output: '0.5', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('0.91'), ok({ output: '0.91', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('.91'), ok({ output: '0.91', rest: '' })) // note output standardisation to add leading '0'
        assert.deepEqual(Parser.numberStr().parse('9e2'), ok({ output: '9e2', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('9E2'), ok({ output: '9e2', rest: '' })) // note output standardisation to 'e'
        assert.deepEqual(Parser.numberStr().parse('.9E2'), ok({ output: '0.9e2', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('1.9E10'), ok({ output: '1.9e10', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('1.9E-10'), ok({ output: '1.9e-10', rest: '' }))
        assert.deepEqual(Parser.numberStr().parse('1.9E+10'), ok({ output: '1.9e10', rest: '' }))

        assert.deepEqual(Parser.numberStr().parse('9.k'), ok({ output: '9', rest: '.k' })) // fails to consume '.' if no numbers after it (could be an operator).
        assert.deepEqual(Parser.numberStr().parse('9.e2'), ok({ output: '9', rest: '.e2' })) // can't use '.' then exponent
        assert.deepEqual(Parser.numberStr().parse('9e-'), ok({ output: '9', rest: 'e-' }))
        assert.deepEqual(Parser.numberStr().parse('9e+'), ok({ output: '9', rest: 'e+' }))
        assert.deepEqual(Parser.numberStr().parse('9.0e-'), ok({ output: '9.0', rest: 'e-' }))

        // These are all invalid numbers:
        const badNums = ['.', 'e', 'E', '.E2', '-E2', 'E2', '-', '-.']
        badNums.forEach(badNum => {
            assert.ok(isErr(Parser.numberStr().parse(badNum)))
        })

    })

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

    it('can separate with sepBy', () => {
        const n = Parser.numberStr()
        const sep = Parser.takeWhile(/\s+/)
            .mapErr(_ => _ as LibParseError)
            .andThen(_ => Parser.matchString('+', '-'))
            .andThen(s => Parser.takeWhile(/\s+/).map(_ => s))
        const p = n.sepBy(sep)

        assert.deepEqual(p.parse(''), err({ kind: 'NOT_A_NUMBER', input: ''}))
        assert.deepEqual(p.parse('1'), ok({ output: { results: ['1'], separators: [] }, rest: '' }), 'A')
        assert.deepEqual(p.parse('1 +'), ok({ output: { results: ['1'], separators: [] }, rest: ' +' }), 'B')
        assert.deepEqual(p.parse('1 + 2'), ok({ output: { results: ['1', '2'], separators: ['+'] }, rest: '' }), 'C')
        assert.deepEqual(p.parse('1 + 2 '), ok({ output: { results: ['1', '2'], separators: ['+'] }, rest: ' ' }), 'D')
        assert.deepEqual(p.parse('1 + 2 -'), ok({ output: { results: ['1', '2'], separators: ['+'] }, rest: ' -' }), 'E')
        assert.deepEqual(p.parse('1 + 2 - 3'), ok({ output: { results: ['1', '2', '3'], separators: ['+', '-'] }, rest: '' }), 'F')
    })

    it('must separate with mustSepBy', () => {
        const n = Parser.numberStr()
        const sep = Parser.takeWhile(/\s+/)
            .mapErr(_ => _ as LibParseError)
            .andThen(_ => Parser.matchString('+', '-'))
            .andThen(s => Parser.takeWhile(/\s+/).map(_ => s))
        const p = n.mustSepBy(sep)

        assert.deepEqual(p.parse('1'), err({ input: '1', kind: 'EXPECTS_A_SEPARATOR' }), 'A')
        assert.deepEqual(p.parse('1 +'), err({ input: '1 +', kind: 'EXPECTS_A_SEPARATOR' }), 'B')
        assert.deepEqual(p.parse('1 + 2'), ok({ output: { results: ['1', '2'], separators: ['+'] }, rest: '' }), 'C')
        assert.deepEqual(p.parse('1 + 2 '), ok({ output: { results: ['1', '2'], separators: ['+'] }, rest: ' ' }), 'D')
        assert.deepEqual(p.parse('1 + 2 -'), ok({ output: { results: ['1', '2'], separators: ['+'] }, rest: ' -' }), 'E')
        assert.deepEqual(p.parse('1 + 2 - 3'), ok({ output: { results: ['1', '2', '3'], separators: ['+', '-'] }, rest: '' }), 'F')
    })

})