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
/**
 * We can implement basic Excel-like spreadsheet operations by looking at
 * token names and using them as cell identifiers.
 */
function spreadsheet() {
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
        var v = val.eval() || val.name();
        if (typeof v === 'string') {
            var _a = getIdx(v), rowIdx = _a[0], colIdx = _a[1];
            return table[rowIdx][colIdx];
        }
        else {
            return v;
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
            '+': function (a, b) { return getValue(a) + getValue(b); },
            '-': function (a, b) { return getValue(a) - getValue(b); },
            ':': function (a, b) { return getRange(a.name(), b.name()); },
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
}
exports.default = spreadsheet;
