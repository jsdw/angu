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
var angu = __importStar(require("../index"));
function workingWithVariables() {
    var ctx = {
        scope: {
            'info': function (a) {
                return {
                    value: a.eval(),
                    name: a.name(),
                    kind: a.kind(),
                    pos: a.pos(),
                    string: String(a)
                };
            },
            'bar': 'Bar',
            // Make an operator available for below:
            '+': function (a, b) { return a.eval() + b.eval(); }
        }
    };
    assert.deepEqual(angu.evaluate('info(foo)', ctx).value, {
        value: undefined,
        name: 'foo',
        kind: 'variable',
        pos: { start: 5, end: 8 },
        string: 'foo'
    });
    assert.deepEqual(angu.evaluate('  info(bar)', ctx).value, {
        value: 'Bar',
        name: 'bar',
        kind: 'variable',
        // Note the position change as we shift everything forwards 2 spaces:
        pos: { start: 7, end: 10 },
        string: 'bar'
    });
    // Strings are escaped if we stringify them, to approximate
    // the valid input that would have led to them:
    assert.deepEqual(angu.evaluate('info("hello there \\\"john\\\"")', ctx).value, {
        value: 'hello there "john"',
        name: 'hello there "john"',
        kind: 'string',
        pos: { start: 5, end: 27 },
        string: '"hello there \\"john\\""'
    });
    assert.deepEqual(angu.evaluate('info(+.9E12)', ctx).value, {
        value: 0.9e12,
        name: '0.9e12',
        kind: 'number',
        pos: { start: 5, end: 11 },
        // the string rep for numbers is normalised (lowercase 'e', always trailing
        // digit, never trailing +):
        string: '0.9e12'
    });
    assert.deepEqual(angu.evaluate('info(1 + 2 + 3 + 4)', ctx).value, {
        value: 10,
        name: '+',
        kind: 'functioncall',
        pos: { start: 5, end: 18 },
        // stringification wraps op calls in parens so that
        // the evaluation order is obvious:
        string: '(((1 + 2) + 3) + 4)'
    });
}
exports.default = workingWithVariables;
