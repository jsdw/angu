"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var libparser_1 = require("./libparser");
var result_1 = require("./result");
var assert = __importStar(require("assert"));
describe("libparser", function () {
    it('can match any character', function () {
        assert.deepEqual(libparser_1.Parser.anyChar().parse(''), result_1.err({ kind: 'EXPECTS_A_CHAR', input: '' }));
        assert.deepEqual(libparser_1.Parser.anyChar().parse('a'), result_1.ok({ output: 'a', rest: '' }));
        assert.deepEqual(libparser_1.Parser.anyChar().parse('*'), result_1.ok({ output: '*', rest: '' }));
        assert.deepEqual(libparser_1.Parser.anyChar().parse('abc'), result_1.ok({ output: 'a', rest: 'bc' }));
    });
    it('can match strings', function () {
        expectDoesMatchString('foo', 'bar', 'foobar');
        expectDoesMatchString('f', 'oobar', 'foobar');
        expectDoesMatchString('foobar', '', 'foobar');
    });
    function expectDoesMatchString(m, r, s) {
        var res = libparser_1.Parser
            .matchString(m)
            .parse(s);
        assert.ok(result_1.isOk(res), m + " did not match " + s);
        if (result_1.isOk(res)) {
            assert.equal(res.value.rest, r);
        }
    }
    it('wont match wrong strings', function () {
        expectDoesNotMatchString('o', 'foobar');
        expectDoesNotMatchString('foobarr', 'foobar');
    });
    function expectDoesNotMatchString(m, s) {
        var res = libparser_1.Parser
            .matchString(m)
            .parse(s);
        assert.ok(result_1.isErr(res), m + " matched " + s);
    }
    it('can takeWhile', function () {
        expectDoesTakeWhile(/[a-z]/, 'foo', '123', 'foo123');
        expectDoesTakeWhile(/[0-9]/, '123', 'foo', '123foo');
        expectDoesTakeWhile(/[0-9]/, '', 'foo123', 'foo123');
        expectDoesTakeWhile(/[0-9a-z]/, '123foo', '', '123foo');
    });
    function expectDoesTakeWhile(re, m, r, s) {
        var res = libparser_1.Parser
            .takeWhile(re)
            .parse(s);
        assert.ok(result_1.isOk(res));
        if (result_1.isOk(res)) {
            assert.equal(res.value.rest, r);
            assert.equal(res.value.output, m);
        }
    }
    it('can takeUntil', function () {
        assert.deepEqual(libparser_1.Parser.takeUntil(libparser_1.Parser.matchString('l')).parse('foo'), result_1.err({ kind: 'EXPECTS_A_CHAR', input: '' }));
        assert.deepEqual(libparser_1.Parser.takeUntil(libparser_1.Parser.matchString('l')).parse('fool'), result_1.ok({ output: { result: 'foo', until: 'l' }, rest: '' }));
        assert.deepEqual(libparser_1.Parser.takeUntil(libparser_1.Parser.matchString('l')).parse('list'), result_1.ok({ output: { result: '', until: 'l' }, rest: 'ist' }));
    });
    it('will get at least one char back from mustTakeWhile', function () {
        var p = libparser_1.Parser.mustTakeWhile(/[0-9]/);
        assert.deepEqual(p.parse('123foo'), result_1.ok({ output: '123', rest: 'foo' }));
        assert.deepEqual(p.parse('1foo'), result_1.ok({ output: '1', rest: 'foo' }));
        assert.ok(result_1.isErr(p.parse('')));
        assert.ok(result_1.isErr(p.parse('foo')));
    });
    it('can combine parsers with "or"', function () {
        var p = libparser_1.Parser.matchString('foo')
            .or(libparser_1.Parser.matchString('bar'))
            .or(libparser_1.Parser.matchString('wibble'));
        assert.deepEqual(p.parse('fooey'), result_1.ok({ output: 'foo', rest: 'ey' }));
        assert.deepEqual(p.parse('foobar'), result_1.ok({ output: 'foo', rest: 'bar' }));
        assert.deepEqual(p.parse('barry'), result_1.ok({ output: 'bar', rest: 'ry' }));
        assert.deepEqual(p.parse('wibbleton'), result_1.ok({ output: 'wibble', rest: 'ton' }));
        assert.ok(result_1.isErr(p.parse('fo')));
        assert.ok(result_1.isErr(p.parse('foebar')));
    });
    it('can chain parsers with andThen', function () {
        var p = libparser_1.Parser.matchString('foo')
            .andThen(function (r1) { return libparser_1.Parser.matchString('bar').map(function (r2) { return [r1, r2]; }); })
            .andThen(function (_a) {
            var r1 = _a[0], r2 = _a[1];
            return libparser_1.Parser.takeWhile(/[a-z]/).map(function (r3) { return [r1, r2, r3]; });
        });
        assert.deepEqual(p.parse('foobare'), result_1.ok({ output: ['foo', 'bar', 'e'], rest: '' }));
        assert.deepEqual(p.parse('foobarr1'), result_1.ok({ output: ['foo', 'bar', 'r'], rest: '1' }));
        assert.deepEqual(p.parse('foobar'), result_1.ok({ output: ['foo', 'bar', ''], rest: '' }));
        assert.ok(result_1.isErr(p.parse('fooba')));
    });
});
