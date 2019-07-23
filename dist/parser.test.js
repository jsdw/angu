"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = __importStar(require("assert"));
var parser = __importStar(require("./parser"));
var context_1 = require("./context");
var result_1 = require("./result");
describe('parser', function () {
    it('parses numbers in preference to unary ops', function () {
        var opts = context_1.toInternalContext({});
        // Make sure '-' and '+' are treated as part of the number
        // and not a unary op to apply.
        assertRoughlyEqual(parser.expression(opts).eval('-1'), result_1.ok({
            kind: 'number', value: -1, string: '-1'
        }));
        assertRoughlyEqual(parser.expression(opts).eval('+1'), result_1.ok({
            kind: 'number', value: 1, string: '1'
        }));
    });
    it('parses tokens properly', function () {
        assert.deepEqual(parser.token().eval('f'), result_1.ok('f'));
        assert.deepEqual(parser.token().eval('f_0'), result_1.ok('f_0'));
        assert.deepEqual(parser.token().eval('fo0'), result_1.ok('fo0'));
        assert.deepEqual(parser.token().eval('FoO0_'), result_1.ok('FoO0_'));
        assert.ok(result_1.isErr(parser.token().eval('_foo')));
        assert.ok(result_1.isErr(parser.token().eval('1foo')));
        assert.ok(result_1.isErr(parser.token().eval('1')));
        assert.deepEqual(parser.token().parse('foo-bar'), result_1.ok({ output: 'foo', rest: '-bar' }));
    });
    it('parses basic expression types', function () {
        var opts = context_1.toInternalContext({});
        assertRoughlyEqual(parser.expression(opts).eval('""'), result_1.ok({ kind: 'string', value: "" }));
        assertRoughlyEqual(parser.expression(opts).eval('"hello"'), result_1.ok({ kind: 'string', value: "hello" }));
        assertRoughlyEqual(parser.expression(opts).eval("'hello'"), result_1.ok({ kind: 'string', value: "hello" }));
        assertRoughlyEqual(parser.expression(opts).eval('("hello")'), result_1.ok({ kind: 'string', value: "hello" }));
        assertRoughlyEqual(parser.expression(opts).eval('true'), result_1.ok({ kind: 'bool', value: true }));
        assertRoughlyEqual(parser.expression(opts).eval('false'), result_1.ok({ kind: 'bool', value: false }));
        assertRoughlyEqual(parser.expression(opts).eval('foo'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('1.2'), result_1.ok({ kind: 'number', value: 1.2, string: '1.2' }));
        assertRoughlyEqual(parser.expression(opts).eval('(foo)'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('( foo)'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('( foo )'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('(1.2 )'), result_1.ok({ kind: 'number', value: 1.2, string: '1.2' }));
    });
    it('parses unary ops', function () {
        var opts = context_1.toInternalContext({
            // The ops we want to use have to exist on scope:
            scope: {
                '!': function (_a) { return null; },
                '~': function (_a) { return null; },
                '+': function (_a, _b) { return null; }
            }
        });
        assertRoughlyEqual(parser.expression(opts).eval('!foo'), result_1.ok({
            kind: 'functioncall',
            name: '!',
            infix: true,
            args: [{ kind: 'variable', name: 'foo' }]
        }));
        // Because we parse ops based on what's in scope, we can unambiguously
        // parse multiple op chars next to each other:
        assertRoughlyEqual(parser.expression(opts).eval('!-1)'), result_1.ok({
            kind: 'functioncall',
            name: '!',
            infix: true,
            args: [{ kind: 'number', value: -1, string: '-1' }]
        }));
        // This is a bit hideous but should parse properly since we know what
        // the binary and unary ops here are:
        assertRoughlyEqual(parser.expression(opts).eval('2+!~-1)'), result_1.ok({
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
        }));
        assertRoughlyEqual(parser.expression(opts).eval('2 + !-1'), result_1.ok({
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
        }));
    });
    it('wont parse unary string ops', function () {
        var opts = context_1.toInternalContext({
            // The ops we want to use have to exist on scope:
            scope: {
                'no': function (_a) { return null; },
            },
            precedence: [
                // A func with precedence and the right number
                // of args can be used as a binary op. This should
                // not be used as a unary op though:
                ['no']
            ]
        });
        // This should be a variable, 'no1'. not a unary op 'no' applied
        // to the number 1:
        assertRoughlyEqual(parser.expression(opts).eval('no1'), result_1.ok({
            kind: 'variable',
            name: 'no1',
        }));
    });
    it('wont parse binary string ops without spaces', function () {
        var opts = context_1.toInternalContext({
            scope: {
                'or': function (_a, _b) { return null; },
            },
            precedence: [
                ['or']
            ]
        });
        // Should fail to parse 'or' due to no spaces:
        assertRoughlyEqual(parser.expression(opts).parse('1or2'), result_1.ok({
            output: { kind: 'number', string: '1', value: 1 },
            rest: 'or2'
        }));
        assertRoughlyEqual(parser.expression(opts).parse('1 or2'), result_1.ok({
            output: { kind: 'number', string: '1', value: 1 },
            rest: 'or2'
        }));
        assertRoughlyEqual(parser.expression(opts).parse('1or 2'), result_1.ok({
            output: { kind: 'number', string: '1', value: 1 },
            rest: 'or 2'
        }));
        // For confirmation, this should be fine:
        assertRoughlyEqual(parser.expression(opts).parse('1 or 2'), result_1.ok({
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
        }));
    });
    it('parses function calls', function () {
        var opts = context_1.toInternalContext({});
        assertRoughlyEqual(parser.expression(opts).eval('foo()'), result_1.ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: []
        }));
        assertRoughlyEqual(parser.expression(opts).eval('foo(1)'), result_1.ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: [{ kind: 'number', value: 1, string: '1' }]
        }));
        assertRoughlyEqual(parser.expression(opts).eval('foo(((1)))'), result_1.ok({
            kind: 'functioncall',
            name: 'foo',
            infix: false,
            args: [{ kind: 'number', value: 1, string: '1' }]
        }));
        assertRoughlyEqual(parser.expression(opts).parse('foo(1, bar,2 , true )'), result_1.ok({
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
        }));
    });
    it('parses the `.` binary op OK despite it being used in numbers', function () {
        var opts = context_1.toInternalContext({
            scope: { '.': function (_a, _b) { return null; } },
        });
        assertRoughlyEqual(parser.expression(opts).eval('3.2 . 3'), result_1.ok({
            kind: 'functioncall',
            name: '.',
            infix: true,
            args: [
                { kind: 'number', value: 3.2, string: '3.2' },
                { kind: 'number', value: 3, string: '3' }
            ]
        }));
        assertRoughlyEqual(parser.expression(opts).eval('3.2.3'), result_1.ok({
            kind: 'functioncall',
            name: '.',
            infix: true,
            args: [
                { kind: 'number', value: 3.2, string: '3.2' },
                { kind: 'number', value: 3, string: '3' }
            ]
        }));
        assertRoughlyEqual(parser.expression(opts).eval('3. 2.3'), result_1.ok({
            kind: 'functioncall',
            name: '.',
            infix: true,
            args: [
                { kind: 'number', value: 3, string: '3' },
                { kind: 'number', value: 2.3, string: '2.3' }
            ]
        }));
    });
    it('parses binary ops taking precedence into account', function () {
        var opts = context_1.toInternalContext({
            scope: {
                '^': function (_a, _b) { return null; },
                '+': function (_a, _b) { return null; },
                '*': function (_a, _b) { return null; }
            },
            precedence: [['^'], ['*'], ['+']]
        });
        assertRoughlyEqual(parser.expression(opts).eval('3 ^ 4 * 5 + 6'), result_1.ok({
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
        }));
        assertRoughlyEqual(parser.expression(opts).eval('3 + 4 * 5 ^ 6'), result_1.ok({
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
        }));
    });
    it('always puts function ops first if no precedence given for them', function () {
        var opts = context_1.toInternalContext({
            scope: {
                '*': function (_a, _b) { return null; },
                foo: function (_a, _b) { return null; },
                bar: function (_a, _b) { return null; },
            },
            precedence: [['foo'], ['*'], ['bar']]
        });
        // foo is evaluated first:
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 foo 2 * 4"), result_1.ok({
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
        }));
        // bar is evaluated last (it is listed last in precedence):
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 bar 2 * 4"), result_1.ok({
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
        }));
    });
});
function assertRoughlyEqual(a, b) {
    // strip position information, since we don't want to have to manually add that:
    stripPositionInformation(a);
    stripPositionInformation(b);
    assert.deepEqual(a, b);
}
function stripPositionInformation(a) {
    if (typeof a === 'object') {
        for (var i in a) {
            if (i === 'pos') {
                delete a[i];
            }
            else if (typeof a[i] === 'object') {
                stripPositionInformation(a[i]);
            }
        }
    }
}
