import * as assert from 'assert'
import * as parser from './parser'
import { ok, isOk, isErr } from './result'

describe('parser', function() {

    it('parses basic numbers properly', () => {
        assert.ok(isOk(parser.number().eval('1234')))
        assert.ok(isOk(parser.number().eval('1234.56')))
        assert.ok(isOk(parser.number().eval('1.21')))
        assert.ok(isOk(parser.number().eval('-1.22')))
        assert.ok(isOk(parser.number().eval('+1.23')))
        assert.ok(isOk(parser.number().eval('0.5')))
        assert.ok(isOk(parser.number().eval('0.91')))
        assert.ok(isErr(parser.number().eval('.91')))
        assert.ok(isErr(parser.number().eval('9.')))
        assert.ok(isErr(parser.number().eval('.')))
    })

    it('parses numbers in preference to unary ops', () => {
        // Make sure '-' and '+' are treated as part of the number
        // and not a unary op to apply.
        assertRoughlyEqual(parser.expression({}).eval('-1'), ok({
            kind: 'number', value: -1, string: '-1'
        }))
        assertRoughlyEqual(parser.expression({}).eval('+1'), ok({
            kind: 'number', value: 1, string: '+1'
        }))
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
        const opts = { }
        assertRoughlyEqual(parser.expression(opts).eval('true'), ok({ kind: 'bool', value: true }))
        assertRoughlyEqual(parser.expression(opts).eval('false'), ok({ kind: 'bool', value: false }))
        assertRoughlyEqual(parser.expression(opts).eval('foo'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('1.2'), ok({ kind: 'number', value: 1.2, string: '1.2' }))
        assertRoughlyEqual(parser.expression(opts).eval('(foo)'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('( foo)'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('( foo )'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('(1.2 )'), ok({ kind: 'number', value: 1.2, string: '1.2' }))
    })

    it('parses functions as operators by surrounding with `', () => {
        const opts = { }
        assertRoughlyEqual(parser.expression(opts).parse("1 `foo` 2"), ok({
            output: {
                kind: 'functioncall',
                name: 'foo',
                infix: true,
                args: [
                    { kind: 'number', value: 1, string: '1' },
                    { kind: 'number', value: 2, string: '2' }
                ]
            },
            rest: ''
        }))
    })

    it('parses unary ops', () => {
        const opts = { }
        assertRoughlyEqual(parser.expression(opts).eval('!foo'), ok({
            kind: 'functioncall',
            name: '!',
            infix: true,
            args: [{ kind: 'variable', name: 'foo' }]
        }))
        assertRoughlyEqual(parser.expression(opts).eval('!(-1)'), ok({
            kind: 'functioncall',
            name: '!',
            infix: true,
            args: [{ kind: 'number', value: -1, string: '-1' }]
        }))
        // Unary ops are not allowed to have any spaces between them and their
        // argument, but '!-' cannot be next to each other or they will be seen
        // as one op. We need parens to treat them as individual things.
        assertRoughlyEqual(parser.expression(opts).eval('2 + !(-1)'), ok({
            kind: 'functioncall',
            name: '+',
            infix: true,
            args: [
                {
                    kind: 'number',
                    value: 2,
                    string: '2'
                },
                {
                    kind: 'functioncall',
                    name: '!',
                    infix: true,
                    args: [{ kind: 'number', value: -1, string: '-1' }]
                }
            ]
        }))
    })

    it('parses function calls', () => {
        const opts = { }
        assertRoughlyEqual(parser.expression(opts).eval('foo()'), ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: []
        }))
        assertRoughlyEqual(parser.expression(opts).eval('foo(1)'), ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: [{ kind: 'number', value: 1, string: '1' }]
        }))
        assertRoughlyEqual(parser.expression(opts).eval('foo(((1)))'), ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: [{ kind: 'number', value: 1, string: '1' }]
        }))
        assertRoughlyEqual(parser.expression(opts).parse('foo(1, bar,2 , true )'), ok({
            output: {
                kind: 'functioncall',
                name: 'foo',
                infix: false,
                args: [
                    { kind: 'number', value: 1, string: '1' },
                    { kind: 'variable', name: 'bar' },
                    { kind: 'number', value: 2, string: '2' },
                    { kind: 'bool', value: true }
                ]
            },
            rest: ''
        }))
    })

    it('parses binary ops taking precedence into account', () => {
        const opts = { precedence: [['^'], ['*'], ['+']] }
        assertRoughlyEqual(parser.expression(opts).eval('3 ^ 4 * 5 + 6'), ok({
            kind: 'functioncall',
            name: '+',
            infix: true,
            args: [
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        {
                            kind: 'functioncall',
                            name: '^',
                            infix: true,
                            args: [
                                { kind: 'number', value: 3, string: '3' },
                                { kind: 'number', value: 4, string: '4' }
                            ]
                        },
                        { kind: 'number', value: 5, string: '5' }
                    ]
                },
                { kind: 'number', value: 6, string: '6' }
            ]
        }))
        assertRoughlyEqual(parser.expression(opts).eval('3 + 4 * 5 ^ 6'), ok({
            kind: 'functioncall',
            name: '+',
            infix: true,
            args: [
                { kind: 'number', value: 3, string: '3' },
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 4, string: '4' },
                        {
                            kind: 'functioncall',
                            name: '^',
                            infix: true,
                            args: [
                                { kind: 'number', value: 5, string: '5' },
                                { kind: 'number', value: 6, string: '6' }
                            ]
                        }
                    ]
                }
            ]
        }))
    })

    it('always puts function ops first if no precedence given for them', () => {
        const opts = { precedence: [['*'], ['bar']] }
        // foo is evaluated first:
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 `foo` 2 * 4"), ok({
            kind: 'functioncall',
            name: '*',
            infix: true,
            args: [
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 5, string: '5' },
                        {
                            kind: 'functioncall',
                            name: 'foo',
                            infix: true,
                            args: [
                                { kind: 'number', value: 3, string: '3' },
                                { kind: 'number', value: 2, string: '2' }
                            ]
                        }
                    ]
                },
                { kind: 'number', value: 4, string: '4' }
            ]
        }))
        // bar is evaluated last (it is listed last in precedence):
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 `bar` 2 * 4"), ok({
            kind: 'functioncall',
            name: 'bar',
            infix: true,
            args: [
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 5, string: '5' },
                        { kind: 'number', value: 3, string: '3' }
                    ]
                },
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 2, string: '2' },
                        { kind: 'number', value: 4, string: '4' }
                    ]
                }
            ]
        }))
    })
})

function assertRoughlyEqual(a: any, b: any) {
    // strip position information, since we don't want to have to manually add that:
    stripPositionInformation(a)
    stripPositionInformation(b)
    assert.deepEqual(a, b)
}

function stripPositionInformation(a: any) {
    if (typeof a === 'object') {
        for(const i in a) {
            if (i === 'pos') {
                delete a[i]
            } else if (typeof a[i] === 'object') {
                stripPositionInformation(a[i])
            }
        }
    }
}