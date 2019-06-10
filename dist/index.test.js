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
var angu = __importStar(require("./index"));
describe('index', function () {
    it('can be used to create a simple calculator', function () {
        // Define the functionality and such available to
        // the evaluator:
        var ctx = {
            // We provide these things in scope:
            scope: {
                '-': function (a, b) { return a.eval() - b.eval(); },
                '+': function (a, b) { return a.eval() + b.eval(); },
                '/': function (a, b) { return a.eval() / b.eval(); },
                '*': function (a, b) { return a.eval() * b.eval(); },
                'PI': 3.14
            },
            // And define the precedence to be as expected:
            precedence: [
                ['/', '*'],
                ['-', '+']
            ]
        };
        // Now, we can evaluate things in this context:
        var r1 = angu.evaluate('2 + 10 * 4', ctx);
        assert.equal(r1.value, 42);
        var r2 = angu.evaluate('10 + 4 / 2 * 3', ctx);
        assert.equal(r2.value, 16);
        var r3 = angu.evaluate('PI * 2', ctx);
        assert.equal(r3.value, 6.28);
    });
    it('can provide back error information when something goes wrong', function () {
        // Define the functionality and such available to
        // the evaluator:
        var ctx = {
            // We provide these operators:
            scope: {
                '-': function (a, b) { return a.eval() - b.eval(); },
                '+': function (a, b) { return a.eval() + b.eval(); }
            }
        };
        // This will be an error because * is not defined:
        var r1 = angu.evaluate('10 * 4 + 2', ctx);
        // We can use a convenience function to check error/ok:
        assert.ok(angu.isErr(r1));
        assert.ok(!angu.isOk(r1));
        // Because the operator doesn't exist, we get a parse error as
        // the string could not be entirely consumed, along with the part
        // of the string that was not consumed:
        assert.equal(r1.kind, 'err');
        assert.equal(r1.value.kind, 'NOT_CONSUMED_ALL');
        assert.equal(r1.value.input, '* 4 + 2');
        // parse errors occur at a specific point, so start == end:
        assert.equal(r1.value.pos.start, 3);
        assert.equal(r1.value.pos.end, 3);
        // Everything is typed, so you can look at the errors defined
        // in `errors.ts` in order to see exactly what's available in
        // each case.
    });
    it('can be used to manipulate cells in a spreadsheet', function () {
        // Given some table of information (cols by letter, rows by number):
        var table = [
            //    A    B   C    D,
            [1, 'm', 30, 103],
            [2, 'f', 26, 260],
            [3, 'm', 18, 130],
            [4, 'm', 18, 130],
            [5, 'm', 18, 130],
            [6, 'm', 18, 130],
        ];
        // ... And functions that can access cells in this table:
        var getIdx = function (str) {
            var colIdx = str.charCodeAt(0) - 65; // convert letters to col index
            var rowIdx = Number(str.slice(1)) - 1; // use rest as row index (1 indexed)
            return [rowIdx, colIdx];
        };
        var getValue = function (val) {
            if (typeof val === 'string') {
                var _a = getIdx(val), rowIdx = _a[0], colIdx = _a[1];
                return table[rowIdx][colIdx];
            }
            else {
                return val;
            }
        };
        var getRange = function (a, b) {
            var _a = getIdx(a), startRow = _a[0], startCol = _a[1];
            var _b = getIdx(b), endRow = _b[0], endCol = _b[1];
            var out = [];
            for (var i = startRow; i <= endRow; i++) {
                for (var j = startCol; j <= endCol; j++) {
                    out.push(table[i][j]);
                }
            }
            return out;
        };
        // ... We can define operators/functions to work on those cells:
        var ctx = {
            scope: {
                '+': function (a, b) { return getValue(a.eval()) + getValue(b.eval()); },
                '-': function (a, b) { return getValue(a.eval()) - getValue(b.eval()); },
                ':': function (a, b) { return getRange(a.eval(), b.eval()); },
                'SUM': function (a) {
                    return a.eval().reduce(function (acc, n) { return acc + n; }, 0);
                },
                'MEAN': function (a) {
                    var arr = a.eval();
                    return arr.reduce(function (acc, n) { return acc + n; }, 0) / arr.length;
                }
            }
        };
        // Finally, we can evaluate excel-like commands to query them:
        var r1 = angu.evaluate('SUM(A1:A3)', ctx).value;
        assert.equal(r1, 6);
        var r2 = angu.evaluate('D1 + D2', ctx).value;
        assert.equal(r2, 363);
        var r3 = angu.evaluate('MEAN(A1:A5) + SUM(C1:D2) - 10', ctx).value;
        assert.equal(r3, 412);
        // Angu supports basic strings (surrounded by ' or "), which we can use
        // interchangeably with tokens that aren't on scope and so are returned as
        // strings:
        var r4 = angu.evaluate('MEAN("A1":\'A5\') + SUM(C1:"D2") - 10', ctx).value;
        assert.equal(r4, 412);
    });
    it('can be used to build up a basic language', function () {
        var ctx = function () { return ({
            scope: {
                // Our basic calculator bits from above:
                '-': function (a, b) { return a.eval() - b.eval(); },
                '+': function (a, b) { return a.eval() + b.eval(); },
                '/': function (a, b) { return a.eval() / b.eval(); },
                '*': function (a, b) {
                    var aVal = a.eval();
                    var bVal = b.eval();
                    // Bit of fun; if we pass string * number, repeat string
                    // that number of times:
                    if (typeof aVal === 'string') {
                        var t = aVal;
                        for (var i = 1; i < bVal; i++)
                            aVal += t;
                        return aVal;
                    }
                    // Else, just assume both are numbers and multiply them:
                    else {
                        return a.eval() * b.eval();
                    }
                },
                // Let's allow multiple expressions, separated by ';':
                ';': function (a, b) { a.eval(); return b.eval(); },
                // we can access raw, unevaluated args using the 'this'
                // object. We use this here to allow '=' to assign new
                // variables that are visible to our evaluator:
                '=': function (a, b) {
                    var rawA = a.raw();
                    var resB = b.eval();
                    if (rawA.kind === 'variable') {
                        this.context.scope[rawA.name] = resB;
                    }
                    else {
                        throw Error("Assignment expected a variable on the left but got a " + rawA.kind);
                    }
                    return resB;
                },
                // we can define regular functions as well:
                'log10': function (a) { return Math.log(a.eval()) / Math.log(10); },
                'pow': function (a, b) { return Math.pow(a.eval(), b.eval()); }
            },
            // first in this list = first to be evaluated:
            precedence: [
                ['/', '*'],
                ['-', '+'],
                // We can alter associativity of ops as well (right or left):
                { ops: ['='], associativity: 'right' },
                [';']
            ]
        }); };
        assert.equal(angu.evaluate('"hello " + "world"', ctx()).value, "hello world");
        assert.equal(angu.evaluate('"hello" * 4', ctx()).value, "hellohellohellohello");
        assert.equal(angu.evaluate('1 + 2 + 3', ctx()).value, 6);
        assert.equal(angu.evaluate('1 + 2 + 3 / 3', ctx()).value, 4);
        assert.equal(angu.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8);
        assert.equal(angu.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8);
        assert.equal(angu.evaluate("(1 + 2 +  3/3) `pow` 2 / 2", ctx()).value, 8);
        assert.equal(angu.evaluate(' log10(100)  +2 -2', ctx()).value, 2);
        assert.equal(angu.evaluate('foo = 8; foo = 10; bar = 2; foo * bar', ctx()).value, 20);
        // We'll use this example in the README:
        assert.equal(angu.evaluate("\n            foo = 2;\n            bar = 4;\n            wibble = foo * bar + pow(2, 10);\n            foo + bar + wibble\n        ", ctx()).value, 1038);
    });
});
