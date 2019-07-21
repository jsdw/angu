import * as assert from 'assert'
import * as parser from './parser'
import { toInternalContext } from './context'
import { ok, isErr } from './result'

describe('parser', function() {

    it('parses strings with arbitrary delims properly', () => {
        assertParsesStrings('"')
        assertParsesStrings("'")
    })
    function assertParsesStrings(delim: string) {
        assert.deepEqual(parser.string(delim).eval(`${delim}hello${delim}`), ok('hello'))
        assert.deepEqual(parser.string(delim).eval(`${delim}${delim}`), ok(''))
        // '\"" == '"' in the output:
        assert.deepEqual(parser.string(delim).eval(`${delim}hello \\${delim} there${delim}`), ok(`hello ${delim} there`))
        // two '\'s == one escaped '\' in the output:
        assert.deepEqual(parser.string(delim).eval(`${delim}hello \\\\${delim}`), ok('hello \\'))
        // three '\'s + '"' == one escaped '\' and then an escaped '"':
        assert.deepEqual(parser.string(delim).eval(`${delim}hello \\\\\\${delim}${delim}`), ok(`hello \\${delim}`))
    }

    it('parses numbers in preference to unary ops', () => {
        const opts = toInternalContext({ })
        // Make sure '-' and '+' are treated as part of the number
        // and not a unary op to apply.
        assertRoughlyEqual(parser.expression(opts).eval('-1'), ok({
            kind: 'number', value: -1, string: '-1'
        }))
        assertRoughlyEqual(parser.expression(opts).eval('+1'), ok({
            kind: 'number', value: 1, string: '1'
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
        const opts = toInternalContext({ })
        assertRoughlyEqual(parser.expression(opts).eval('""'), ok({ kind: 'string', value: "" }))
        assertRoughlyEqual(parser.expression(opts).eval('"hello"'), ok({ kind: 'string', value: "hello" }))
        assertRoughlyEqual(parser.expression(opts).eval("'hello'"), ok({ kind: 'string', value: "hello" }))
        assertRoughlyEqual(parser.expression(opts).eval('("hello")'), ok({ kind: 'string', value: "hello" }))
        assertRoughlyEqual(parser.expression(opts).eval('true'), ok({ kind: 'bool', value: true }))
        assertRoughlyEqual(parser.expression(opts).eval('false'), ok({ kind: 'bool', value: false }))
        assertRoughlyEqual(parser.expression(opts).eval('foo'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('1.2'), ok({ kind: 'number', value: 1.2, string: '1.2' }))
        assertRoughlyEqual(parser.expression(opts).eval('(foo)'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('( foo)'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('( foo )'), ok({ kind: 'variable', name: 'foo' }))
        assertRoughlyEqual(parser.expression(opts).eval('(1.2 )'), ok({ kind: 'number', value: 1.2, string: '1.2' }))
    })

    it('parses unary ops', () => {
        const opts = toInternalContext({
            // The ops we want to use have to exist on scope:
            scope: {
                '!': (_a: any) => null,
                '~': (_a: any) => null,
                '+': (_a: any, _b: any) => null
            }
        })
        assertRoughlyEqual(parser.expression(opts).eval('!foo'), ok({
            kind: 'functioncall',
            name: '!',
            infix: true,
            args: [{ kind: 'variable', name: 'foo' }]
        }))
        // Because we parse ops based on what's in scope, we can unambiguously
        // parse multiple op chars next to each other:
        assertRoughlyEqual(parser.expression(opts).eval('!-1)'), ok({
            kind: 'functioncall',
            name: '!',
            infix: true,
            args: [{ kind: 'number', value: -1, string: '-1' }]
        }))
        // This is a bit hideous but should parse properly since we know what
        // the binary and unary ops here are:
        assertRoughlyEqual(parser.expression(opts).eval('2+!~-1)'), ok({
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
                    args: [{
                        kind: 'functioncall',
                        name: '~',
                        infix: true,
                        args: [{
                            kind: 'number',
                            value: -1,
                            string: '-1'
                        }]
                    }]
                }
            ]
        }))
        assertRoughlyEqual(parser.expression(opts).eval('2 + !-1'), ok({
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

    it('wont parse unary string ops', () => {
        const opts = toInternalContext({
            // The ops we want to use have to exist on scope:
            scope: {
                'no': (_a: any) => null,
            },
            precedence: [
                // A func with precedence and the right number
                // of args can be used as a binary op. This should
                // not be used as a unary op though:
                ['no']
            ]
        })
        // This should be a variable, 'no1'. not a unary op 'no' applied
        // to the number 1:
        assertRoughlyEqual(parser.expression(opts).eval('no1'), ok({
            kind: 'variable',
            name: 'no1',
        }))
    })

    it('wont parse binary string ops without spaces', () => {
        const opts = toInternalContext({
            scope: {
                'or': (_a: any, _b: any) => null,
            },
            precedence: [
                ['or']
            ]
        })
        // Should fail to parse 'or' due to no spaces:
        assertRoughlyEqual(parser.expression(opts).parse('1or2'), ok({
            output: { kind: 'number', string: '1', value: 1 },
            rest: 'or2'
        }))
        assertRoughlyEqual(parser.expression(opts).parse('1 or2'), ok({
            output: { kind: 'number', string: '1', value: 1 },
            rest: 'or2'
        }))
        assertRoughlyEqual(parser.expression(opts).parse('1or 2'), ok({
            output: { kind: 'number', string: '1', value: 1 },
            rest: 'or 2'
        }))
        // For confirmation, this should be fine:
        assertRoughlyEqual(parser.expression(opts).parse('1 or 2'), ok({
            output: {
                kind: 'functioncall',
                name: 'or',
                infix: true,
                args: [
                    { kind: 'number', string: '1', value: 1 },
                    { kind: 'number', string: '2', value: 2 }
                ]
            },
            rest: ''
        }))
    })

    it('parses function calls', () => {
        const opts = toInternalContext({ })
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

    it('parses the `.` binary op OK despite it being used in numbers', () => {
        const opts = toInternalContext({
            scope: { '.': (_a: any, _b: any) => null },
        })
        assertRoughlyEqual(parser.expression(opts).eval('3.2 . 3'), ok({
            kind: 'functioncall',
            name: '.',
            infix: true,
            args: [
                { kind: 'number', value: 3.2, string: '3.2' },
                { kind: 'number', value: 3, string: '3' }
            ]
        }))
        assertRoughlyEqual(parser.expression(opts).eval('3.2.3'), ok({
            kind: 'functioncall',
            name: '.',
            infix: true,
            args: [
                { kind: 'number', value: 3.2, string: '3.2' },
                { kind: 'number', value: 3, string: '3' }
            ]
        }))
        assertRoughlyEqual(parser.expression(opts).eval('3. 2.3'), ok({
            kind: 'functioncall',
            name: '.',
            infix: true,
            args: [
                { kind: 'number', value: 3, string: '3' },
                { kind: 'number', value: 2.3, string: '2.3' }
            ]
        }))
    })

    it('parses binary ops taking precedence into account', () => {
        const opts = toInternalContext({
            scope: {
                '^': (_a: any, _b: any) => null,
                '+': (_a: any, _b: any) => null,
                '*': (_a: any, _b: any) => null
            },
            precedence: [['^'], ['*'], ['+']]
        })
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
        const opts = toInternalContext({
            scope: {
                '*': (_a: any, _b: any) => null,
                foo: (_a: any, _b: any) => null,
                bar: (_a: any, _b: any) => null,
            },
            precedence: [['foo'], ['*'], ['bar']]
        })
        // foo is evaluated first:
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 foo 2 * 4"), ok({
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
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 bar 2 * 4"), ok({
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