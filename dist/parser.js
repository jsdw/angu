"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var libparser_1 = __importDefault(require("./libparser"));
var result_1 = require("./result");
var NUMBER_REGEX = /[0-9]/;
var TOKEN_START_REGEX = /[a-zA-Z]/;
var TOKEN_BODY_REGEX = /[a-zA-Z0-9_]/;
var OP_REGEX = /[!£$%^&*@#~?<>|/+=;:-]/;
var WHITESPACE_REGEX = /\s/;
var INFIX_TOK_SURROUND = "`";
/** Parse any expression, consuming surrounding space.This is the primary entry point: */
function expression(opts) {
    // Convert opts to an internal format that's easier to work with.
    var precedenceArray = opts.precedence || [];
    var precedenceMap = {};
    var associativityMap = {};
    var precedenceValue = precedenceArray.length;
    for (var _i = 0, precedenceArray_1 = precedenceArray; _i < precedenceArray_1.length; _i++) {
        var rawEntry = precedenceArray_1[_i];
        // entry could be ['+','-',..] or { ops: ['+', '-',..], associativity: 'left }
        // for convenience. Convert to the more general form to iterate over:
        var entry = Array.isArray(rawEntry) ? { ops: rawEntry } : rawEntry;
        var ops = entry.ops;
        var associativity = entry.associativity || 'left';
        // Note precedence and associativity of each op:
        for (var _a = 0, ops_1 = ops; _a < ops_1.length; _a++) {
            var op_1 = ops_1[_a];
            precedenceMap[op_1] = precedenceValue;
            associativityMap[op_1] = associativity;
        }
        precedenceValue--;
    }
    // Look through scope to find all valid ops that have been declared.
    // We can then parse  exactly those, rejecting characters that aren't declared.
    // sort them longest first so we match most specific first.
    var scope = opts.scope || {};
    var validOps = [];
    for (var key in scope) {
        // The op in scope must be a function:
        if (typeof scope[key] !== 'function') {
            continue;
        }
        // Each character must be a valid op charatcer:
        for (var i = 0; i < key.length; i++) {
            var char = key.charAt(i);
            if (!OP_REGEX.test(char))
                continue;
        }
        validOps.push(key);
    }
    validOps.sort(function (a, b) {
        return a.length > b.length ? -1
            : a.length < b.length ? 1
                : 0;
    });
    return anyExpression({
        precedence: precedenceMap,
        associativity: associativityMap,
        ops: validOps
    });
}
exports.expression = expression;
function anyExpression(opts) {
    var exprParser = binaryOpExpression(opts).or(binaryOpSubExpression(opts));
    return ignoreWhitespace()
        .andThen(function (_) { return exprParser; })
        .andThen(function (e) { return ignoreWhitespace().map(function (_) { return e; }); });
}
exports.anyExpression = anyExpression;
// When parsing binaryOpExpressions, we accept any sort of expression except
// another binaryOpExpression, since that would consume the stuff the first
// binaryOpExpr is trying to find.
function binaryOpSubExpression(opts) {
    return parenExpression(opts)
        .or(stringExpression())
        .or(functioncallExpression(opts))
        .or(numberExpression())
        .or(unaryOpExpression(opts)) // try parsing number first, since numbers can by prefixed by + or -.
        .or(booleanExpression())
        .or(variableExpression());
}
exports.binaryOpSubExpression = binaryOpSubExpression;
// Parse different types of expression:
function variableExpression() {
    return token().mapWithPosition(function (tok, pos) {
        return { kind: 'variable', name: tok, pos: pos };
    });
}
exports.variableExpression = variableExpression;
function numberExpression() {
    return number().mapWithPosition(function (n, pos) {
        return { kind: 'number', value: Number(n), string: n, pos: pos };
    });
}
exports.numberExpression = numberExpression;
function stringExpression() {
    return string("'").or(string('"')).mapWithPosition(function (s, pos) {
        return { kind: 'string', value: s, pos: pos };
    });
}
exports.stringExpression = stringExpression;
function booleanExpression() {
    return libparser_1.default.matchString('true', 'false')
        .mapWithPosition(function (boolStr, pos) {
        return {
            kind: 'bool',
            value: boolStr === 'true' ? true : false,
            pos: pos
        };
    });
}
exports.booleanExpression = booleanExpression;
function unaryOpExpression(opts) {
    return op(opts.ops).andThen(function (op) {
        return anyExpression(opts).mapWithPosition(function (expr, pos) {
            return { kind: 'functioncall', name: op.value, args: [expr], infix: true, pos: pos };
        });
    });
}
exports.unaryOpExpression = unaryOpExpression;
function binaryOpExpression(opts) {
    var precedence = opts.precedence || {};
    var associativity = opts.associativity || {};
    // ops separate the expressions:
    var sep = ignoreWhitespace()
        .andThen(function (_) { return op(opts.ops); })
        .andThen(function (op) {
        return ignoreWhitespace().map(function (_) { return op; });
    });
    // given array of ops, return index of highest precedence:
    function highestPrecIdx(ops) {
        var bestP = 0;
        var bestIdx = -1;
        var bestLastIdx = -1;
        for (var i = 0; i < ops.length; i++) {
            var curr = ops[i];
            // If we don't know the precedence, give infix function calls
            // the highest possible, and others a lower precedence than
            // anything defined (to reflect the fact that function calls
            // ordinary take precedence owing to brackets)
            var currP = precedence[curr.value] || (curr.isOp ? 0 : Infinity);
            if (bestIdx < 0 || currP > bestP) {
                bestP = currP;
                bestIdx = i;
                bestLastIdx = i;
            }
            else if (currP === bestP && bestLastIdx - 1 === i) {
                // How many items in a row have the same precedence?
                // We can then look at associativity of them all.
                bestLastIdx = i;
            }
        }
        return [bestIdx, bestLastIdx];
    }
    // Given some ops to look at first based on precedence, decide what to
    // look at next based on associativity:
    function getIdxFromAssociativity(startIdx, endIdx, ops) {
        var assoc = "";
        for (var i = startIdx; i <= endIdx; i++) {
            if (!assoc) {
                assoc = associativity[ops[i].value] || 'left';
            }
            else if (assoc !== associativity[ops[i].value]) {
                throw new Error('This should not be possible: adjacent operators have mixed associativity');
            }
        }
        return assoc === 'left'
            ? startIdx
            : endIdx;
    }
    // parse expressions separated by ops, and use precedence
    // ordering to collapse them down into a single tree:
    return binaryOpSubExpression(opts)
        .mustSepBy(sep)
        .map(function (_a) {
        var results = _a.results, separators = _a.separators;
        while (separators.length) {
            var _b = highestPrecIdx(separators), firstIdx = _b[0], lastIdx = _b[1];
            var idx = getIdxFromAssociativity(firstIdx, lastIdx, separators);
            var op_2 = separators.splice(idx, 1)[0];
            var left = results[idx];
            var right = results[idx + 1];
            var expr = {
                kind: 'functioncall',
                name: op_2.value,
                args: [left, right],
                infix: true,
                pos: { startLen: left.pos.startLen, endLen: right.pos.endLen }
            };
            results.splice(idx, 2, expr);
        }
        return results[0];
    });
}
exports.binaryOpExpression = binaryOpExpression;
function functioncallExpression(opts) {
    return libparser_1.default.lazy(function () {
        var name;
        var sep = ignoreWhitespace()
            .andThen(function (_) { return libparser_1.default.matchString(','); })
            .andThen(function (_) { return ignoreWhitespace(); });
        return token()
            .andThen(function (n) {
            name = n;
            return libparser_1.default.matchString('(');
        })
            .andThen(function (_) {
            return anyExpression(opts)
                .sepBy(sep)
                .map(function (_a) {
                var results = _a.results;
                return results;
            });
        })
            .andThen(function (r) {
            return ignoreWhitespace()
                .andThen(function (_) { return libparser_1.default.matchString(')'); })
                .map(function (_) { return r; });
        })
            .mapWithPosition(function (args, pos) {
            return { kind: 'functioncall', name: name, args: args, infix: false, pos: pos };
        });
    });
}
exports.functioncallExpression = functioncallExpression;
function parenExpression(opts) {
    return libparser_1.default.lazy(function () {
        var expr;
        return libparser_1.default.matchString('(')
            .andThen(function (_) { return ignoreWhitespace(); })
            .andThen(function (_) { return anyExpression(opts); })
            .andThen(function (e) {
            expr = e;
            return ignoreWhitespace();
        })
            .andThen(function (_) { return libparser_1.default.matchString(')'); })
            .map(function (_) { return expr; });
    });
}
exports.parenExpression = parenExpression;
// Helpful utility parsers:
function number() {
    return libparser_1.default.lazy(function () {
        var nStr = "";
        return libparser_1.default.matchString('-')
            .or(libparser_1.default.matchString('+'))
            .optional()
            .andThen(function (r) {
            if (result_1.isOk(r)) {
                nStr += r.value;
            }
            return libparser_1.default.mustTakeWhile(NUMBER_REGEX);
        })
            .andThen(function (r) {
            nStr += r;
            return libparser_1.default.matchString('.').optional();
        })
            .andThen(function (r) {
            if (result_1.isOk(r)) {
                nStr += '.';
                return libparser_1.default.mustTakeWhile(NUMBER_REGEX);
            }
            else {
                return libparser_1.default.ok('');
            }
        })
            .andThen(function (r) {
            nStr += r;
            return libparser_1.default.ok(nStr);
        });
    });
}
exports.number = number;
function string(delim) {
    var escapesAndEnds = libparser_1.default.matchString('\\\\', '\\' + delim, delim);
    var restOfString = libparser_1.default.takeUntil(escapesAndEnds)
        .andThen(function (c) {
        if (c.until === '\\' + delim)
            return restOfString.map(function (s) { return c.result + delim + s; });
        else if (c.until === '\\\\')
            return restOfString.map(function (s) { return c.result + '\\' + s; });
        return libparser_1.default.ok(c.result);
    });
    return libparser_1.default.matchString("" + delim).andThen(function (_) { return restOfString; });
}
exports.string = string;
function token() {
    return libparser_1.default.lazy(function () {
        var s = "";
        return libparser_1.default.mustTakeWhile(TOKEN_START_REGEX)
            .andThen(function (r) {
            s += r;
            return libparser_1.default.takeWhile(TOKEN_BODY_REGEX);
        })
            .andThen(function (r) {
            s += r;
            return libparser_1.default.ok(s);
        });
    });
}
exports.token = token;
function op(opList) {
    return libparser_1.default
        // An op is either a valid op that's been provided on scope, or..
        .matchString.apply(libparser_1.default
    // An op is either a valid op that's been provided on scope, or..
    , opList).map(function (s) { return ({ value: s, isOp: true }); })
        // ..a token that's being used infix:
        .or(infixFunction());
}
exports.op = op;
function infixFunction() {
    return libparser_1.default.matchString(INFIX_TOK_SURROUND)
        .andThen(token)
        .andThen(function (t) {
        return libparser_1.default.matchString(INFIX_TOK_SURROUND).map(function (_) { return ({ value: t, isOp: false }); });
    });
}
function ignoreWhitespace() {
    return libparser_1.default
        .takeWhile(WHITESPACE_REGEX)
        .map(function (_) { return undefined; });
}
exports.ignoreWhitespace = ignoreWhitespace;
