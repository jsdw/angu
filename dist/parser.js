"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.token = exports.parenExpression = exports.functioncallExpression = exports.binaryOpExpression = exports.unaryOpExpression = exports.booleanExpression = exports.stringExpression = exports.numberExpression = exports.variableExpression = exports.binaryOpSubExpression = exports.anyExpression = exports.expression = void 0;
var libparser_1 = require("./libparser");
var TOKEN_START_REGEX = /[a-zA-Z]/;
var TOKEN_BODY_REGEX = /[a-zA-Z0-9_]/;
var WHITESPACE_REGEX = /\s/;
/** Parse any expression, consuming surrounding space. This is the primary entry point: */
function expression(opts) {
    return anyExpression(opts).mapErr(function (e) {
        return { kind: 'PARSE_ERROR', input: e.input };
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
    return libparser_1.Parser.numberStr().mapWithPosition(function (n, pos) {
        return { kind: 'number', value: Number(n), string: n, pos: pos };
    });
}
exports.numberExpression = numberExpression;
function stringExpression() {
    return libparser_1.Parser.string().mapWithPosition(function (s, pos) {
        return { kind: 'string', value: s, pos: pos };
    });
}
exports.stringExpression = stringExpression;
function booleanExpression() {
    return libparser_1.Parser.matchString('true', 'false')
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
    return op(opts.unaryOps).andThen(function (op) {
        return anyExpression(opts).mapWithPosition(function (expr, pos) {
            return { kind: 'functioncall', name: op.value, args: [expr], infix: true, pos: pos };
        });
    });
}
exports.unaryOpExpression = unaryOpExpression;
function binaryOpExpression(opts) {
    var precedence = opts.precedence || {};
    var associativity = opts.associativity || {};
    // Depending on whether we saw a space between op and first expression,
    // we can finish parsing the separator using one or both of these:
    var restOfNormalBinaryOp = op(opts.binaryOps).andThen(function (op) {
        return ignoreWhitespace().map(function (_) { return op; });
    });
    var restOfStringBinaryOp = op(opts.binaryStringOps).andThen(function (op) {
        return mustIgnoreWhitespace().map(function (_) { return op; });
    });
    // ops separate the expressions:
    var sep = ignoreWhitespace()
        .andThen(function (wasSpace) {
        return wasSpace
            ? restOfNormalBinaryOp.or(restOfStringBinaryOp)
            : restOfNormalBinaryOp;
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
            var op_1 = separators.splice(idx, 1)[0];
            var left = results[idx];
            var right = results[idx + 1];
            var expr = {
                kind: 'functioncall',
                name: op_1.value,
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
    return libparser_1.Parser.lazy(function () {
        var name;
        var sep = ignoreWhitespace()
            .andThen(function (_) { return libparser_1.Parser.matchString(','); })
            .andThen(function (_) { return ignoreWhitespace(); });
        return token()
            .andThen(function (n) {
            name = n;
            return libparser_1.Parser.matchString('(');
        })
            .andThen(function (_) {
            return anyExpression(opts)
                .sepBy(sep)
                .optional()
                .map(function (maybe) { return maybe.kind === 'ok' ? maybe.value.results : []; });
        })
            .andThen(function (r) {
            return ignoreWhitespace()
                .andThen(function (_) { return libparser_1.Parser.matchString(')'); })
                .map(function (_) { return r; });
        })
            .mapWithPosition(function (args, pos) {
            return { kind: 'functioncall', name: name, args: args, infix: false, pos: pos };
        });
    });
}
exports.functioncallExpression = functioncallExpression;
function parenExpression(opts) {
    return libparser_1.Parser.lazy(function () {
        var expr;
        return libparser_1.Parser.matchString('(')
            .andThen(function (_) { return ignoreWhitespace(); })
            .andThen(function (_) { return anyExpression(opts); })
            .andThen(function (e) {
            expr = e;
            return ignoreWhitespace();
        })
            .andThen(function (_) { return libparser_1.Parser.matchString(')'); })
            .map(function (_) { return expr; });
    });
}
exports.parenExpression = parenExpression;
// Helpful utility parsers:
function token() {
    return libparser_1.Parser.lazy(function () {
        var s = "";
        return libparser_1.Parser.mustTakeWhile(TOKEN_START_REGEX)
            .andThen(function (r) {
            s += r;
            return libparser_1.Parser.takeWhile(TOKEN_BODY_REGEX);
        })
            .andThen(function (r) {
            s += r;
            return libparser_1.Parser.ok(s);
        });
    });
}
exports.token = token;
function op(opList) {
    return libparser_1.Parser
        // An op is only valid if it's in the provided whitelist:
        .matchString.apply(libparser_1.Parser
    // An op is only valid if it's in the provided whitelist:
    , opList).map(function (s) { return ({ value: s, isOp: true }); });
}
function ignoreWhitespace() {
    return libparser_1.Parser
        .takeWhile(WHITESPACE_REGEX)
        .map(function (s) { return !!s.length; });
}
function mustIgnoreWhitespace() {
    return libparser_1.Parser
        .mustTakeWhile(WHITESPACE_REGEX)
        .map(function (_) { return undefined; });
}
