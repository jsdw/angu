"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var libparser_1 = __importDefault(require("./libparser"));
var result_1 = require("./result");
var assert = __importStar(require("assert"));
describe("libparser", function () {
    it('can match any character', function () {
        assert.deepEqual(libparser_1.default.anyChar().parse(''), result_1.err({ kind: 'END_OF_STRING', input: '' }));
        assert.deepEqual(libparser_1.default.anyChar().parse('a'), result_1.ok({ output: 'a', rest: '' }));
        assert.deepEqual(libparser_1.default.anyChar().parse('*'), result_1.ok({ output: '*', rest: '' }));
        assert.deepEqual(libparser_1.default.anyChar().parse('abc'), result_1.ok({ output: 'a', rest: 'bc' }));
    });
    it('can match strings', function () {
        expectDoesMatchString('foo', 'bar', 'foobar');
        expectDoesMatchString('f', 'oobar', 'foobar');
        expectDoesMatchString('foobar', '', 'foobar');
    });
    function expectDoesMatchString(m, r, s) {
        var res = libparser_1.default
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
        var res = libparser_1.default
            .matchString(m)
            .parse(s);
        assert.ok(result_1.isErr(res), m + " matched " + s);
    }
    it('can takeWhile', function () {
        expectDoesTakeWhile(function (c) { return /[a-z]/.test(c); }, 'foo', '123', 'foo123');
        expectDoesTakeWhile(function (c) { return /[0-9]/.test(c); }, '123', 'foo', '123foo');
        expectDoesTakeWhile(function (c) { return /[0-9]/.test(c); }, '', 'foo123', 'foo123');
        expectDoesTakeWhile(function (c) { return /[0-9a-z]/.test(c); }, '123foo', '', '123foo');
    });
    function expectDoesTakeWhile(fn, m, r, s) {
        var res = libparser_1.default
            .takeWhile(fn)
            .parse(s);
        assert.ok(result_1.isOk(res));
        if (result_1.isOk(res)) {
            assert.equal(res.value.rest, r);
            assert.equal(res.value.output, m);
        }
    }
    it('can takeUntil', function () {
        assert.deepEqual(libparser_1.default.takeUntil(libparser_1.default.matchString('l')).parse('foo'), result_1.err({ kind: 'END_OF_STRING', input: '' }));
        assert.deepEqual(libparser_1.default.takeUntil(libparser_1.default.matchString('l')).parse('fool'), result_1.ok({ output: { result: 'foo', until: 'l' }, rest: '' }));
        assert.deepEqual(libparser_1.default.takeUntil(libparser_1.default.matchString('l')).parse('list'), result_1.ok({ output: { result: '', until: 'l' }, rest: 'ist' }));
    });
    it('will get at least one char back from mustTakeWhile', function () {
        var p = libparser_1.default.mustTakeWhile(function (c) { return /[0-9]/.test(c); });
        assert.deepEqual(p.parse('123foo'), result_1.ok({ output: '123', rest: 'foo' }));
        assert.deepEqual(p.parse('1foo'), result_1.ok({ output: '1', rest: 'foo' }));
        assert.ok(result_1.isErr(p.parse('')));
        assert.ok(result_1.isErr(p.parse('foo')));
    });
    it('can combine parsers with "or"', function () {
        var p = libparser_1.default.matchString('foo')
            .or(libparser_1.default.matchString('bar'))
            .or(libparser_1.default.matchString('wibble'));
        assert.deepEqual(p.parse('fooey'), result_1.ok({ output: 'foo', rest: 'ey' }));
        assert.deepEqual(p.parse('foobar'), result_1.ok({ output: 'foo', rest: 'bar' }));
        assert.deepEqual(p.parse('barry'), result_1.ok({ output: 'bar', rest: 'ry' }));
        assert.deepEqual(p.parse('wibbleton'), result_1.ok({ output: 'wibble', rest: 'ton' }));
        assert.ok(result_1.isErr(p.parse('fo')));
        assert.ok(result_1.isErr(p.parse('foebar')));
    });
    it('can chain parsers with andThen', function () {
        var p = libparser_1.default.matchString('foo')
            .andThen(function (r1) { return libparser_1.default.matchString('bar').map(function (r2) { return [r1, r2]; }); })
            .andThen(function (_a) {
            var r1 = _a[0], r2 = _a[1];
            return libparser_1.default.takeWhile(function (a) { return /[a-z]/.test(a); }).map(function (r3) { return [r1, r2, r3]; });
        });
        assert.deepEqual(p.parse('foobare'), result_1.ok({ output: ['foo', 'bar', 'e'], rest: '' }));
        assert.deepEqual(p.parse('foobarr1'), result_1.ok({ output: ['foo', 'bar', 'r'], rest: '1' }));
        assert.deepEqual(p.parse('foobar'), result_1.ok({ output: ['foo', 'bar', ''], rest: '' }));
        assert.ok(result_1.isErr(p.parse('fooba')));
    });
});
