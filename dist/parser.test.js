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
var result_1 = require("./result");
describe('parser', function () {
    it('parses basic numbers properly', function () {
        assert.ok(result_1.isOk(parser.number().eval('1234')));
        assert.ok(result_1.isOk(parser.number().eval('1234.56')));
        assert.ok(result_1.isOk(parser.number().eval('1.21')));
        assert.ok(result_1.isOk(parser.number().eval('-1.22')));
        assert.ok(result_1.isOk(parser.number().eval('+1.23')));
        assert.ok(result_1.isOk(parser.number().eval('0.5')));
        assert.ok(result_1.isOk(parser.number().eval('0.91')));
        assert.ok(result_1.isErr(parser.number().eval('.91')));
        assert.ok(result_1.isErr(parser.number().eval('9.')));
        assert.ok(result_1.isErr(parser.number().eval('.')));
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
        var opts = {};
        assertRoughlyEqual(parser.expression(opts).eval('true'), result_1.ok({ kind: 'bool', value: true }));
        assertRoughlyEqual(parser.expression(opts).eval('false'), result_1.ok({ kind: 'bool', value: false }));
        assertRoughlyEqual(parser.expression(opts).eval('foo'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('1.2'), result_1.ok({ kind: 'number', value: 1.2, string: '1.2' }));
        assertRoughlyEqual(parser.expression(opts).eval('(foo)'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('( foo)'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('( foo )'), result_1.ok({ kind: 'variable', name: 'foo' }));
        assertRoughlyEqual(parser.expression(opts).eval('(1.2 )'), result_1.ok({ kind: 'number', value: 1.2, string: '1.2' }));
    });
    it('parses functions as operators by prefixing with \'', function () {
        var opts = {};
        assertRoughlyEqual(parser.expression(opts).parse("1 'foo 2"), result_1.ok({
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
        }));
    });
    it('parses function calls', function () {
        var opts = {};
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
    it('parses binary ops taking precedence into account', function () {
        var opts = { precedence: [['^'], ['*'], ['+']] };
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
        var opts = { precedence: [['*'], ['bar']] };
        // foo is evaluated first:
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 'foo 2 * 4"), result_1.ok({
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
        assertRoughlyEqual(parser.expression(opts).eval("5 * 3 'bar 2 * 4"), result_1.ok({
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
