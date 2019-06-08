import * as assert from 'assert'
import * as parser from './parser'
import { ok, isErr } from './result'

describe('parser', function() {

    it('parses basic numbers properly', () => {
        assert.deepEqual(parser.number().eval('1234'), ok(1234))
        assert.deepEqual(parser.number().eval('1234.56'), ok(1234.56))
        assert.deepEqual(parser.number().eval('1.21'), ok(1.21))
        assert.deepEqual(parser.number().eval('-1.22'), ok(-1.22))
        assert.deepEqual(parser.number().eval('+1.23'), ok(1.23))
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
        const opts = { }
        assert.deepEqual(parser.expression(opts).eval('true'), ok({ kind: 'bool', value: true }))
        assert.deepEqual(parser.expression(opts).eval('false'), ok({ kind: 'bool', value: false }))
        assert.deepEqual(parser.expression(opts).eval('foo'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('1.2'), ok({ kind: 'number', value: 1.2 }))
        assert.deepEqual(parser.expression(opts).eval('(foo)'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('( foo)'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('( foo )'), ok({ kind: 'variable', name: 'foo' }))
        assert.deepEqual(parser.expression(opts).eval('(1.2 )'), ok({ kind: 'number', value: 1.2 }))
    })

    it('parses functions as operators by prefixing with ":"', () => {
        const opts = { }
        assert.deepEqual(parser.expression(opts).parse('1 :foo 2'), ok({
            output: {
                kind: 'functioncall',
                name: 'foo',
                infix: true,
                args: [
                    { kind: 'number', value: 1 },
                    { kind: 'number', value: 2 }
                ]
            },
            rest: ''
        }))
    })

    it('parses function calls', () => {
        const opts = { }
        assert.deepEqual(parser.expression(opts).eval('foo()'), ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: []
        }))
        assert.deepEqual(parser.expression(opts).eval('foo(1)'), ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: [{ kind: 'number', value: 1 }]
        }))
        assert.deepEqual(parser.expression(opts).eval('foo(((1)))'), ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: [{ kind: 'number', value: 1 }]
        }))
        assert.deepEqual(parser.expression(opts).parse('foo(1, bar,2 , true )'), ok({
            output: {
                kind: 'functioncall',
                name: 'foo',
                infix: false,
                args: [
                    { kind: 'number', value: 1 },
                    { kind: 'variable', name: 'bar' },
                    { kind: 'number', value: 2 },
                    { kind: 'bool', value: true }
                ]
            },
            rest: ''
        }))
    })

    it('parses binary ops taking precedence into account', () => {
        const opts = { precedence: [['^'], ['*'], ['+']] }
        assert.deepEqual(parser.expression(opts).eval('3 ^ 4 * 5 + 6'), ok({
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
                                { kind: 'number', value: 3 },
                                { kind: 'number', value: 4 }
                            ]
                        },
                        { kind: 'number', value: 5 }
                    ]
                },
                { kind: 'number', value: 6 }
            ]
        }))
        assert.deepEqual(parser.expression(opts).eval('3 + 4 * 5 ^ 6'), ok({
            kind: 'functioncall',
            name: '+',
            infix: true,
            args: [
                { kind: 'number', value: 3 },
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 4 },
                        {
                            kind: 'functioncall',
                            name: '^',
                            infix: true,
                            args: [
                                { kind: 'number', value: 5 },
                                { kind: 'number', value: 6 }
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
        assert.deepEqual(parser.expression(opts).eval('5 * 3 :foo 2 * 4'), ok({
            kind: 'functioncall',
            name: '*',
            infix: true,
            args: [
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 5 },
                        {
                            kind: 'functioncall',
                            name: 'foo',
                            infix: true,
                            args: [
                                { kind: 'number', value: 3 },
                                { kind: 'number', value: 2 }
                            ]
                        }
                    ]
                },
                { kind: 'number', value: 4 }
            ]
        }))
        // bar is evaluated last (it is listed last in precedence):
        assert.deepEqual(parser.expression(opts).eval('5 * 3 :bar 2 * 4'), ok({
            kind: 'functioncall',
            name: 'bar',
            infix: true,
            args: [
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 5 },
                        { kind: 'number', value: 3 }
                    ]
                },
                {
                    kind: 'functioncall',
                    name: '*',
                    infix: true,
                    args: [
                        { kind: 'number', value: 2 },
                        { kind: 'number', value: 4 }
                    ]
                }
            ]
        }))
    })
})
