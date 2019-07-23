"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var result = __importStar(require("./result"));
var Parser = /** @class */ (function () {
    function Parser(_fn_) {
        this._fn_ = _fn_;
    }
    Parser.prototype.eval = function (input) {
        var res = this._fn_(input);
        return result.map(res, function (val) { return val.output; });
    };
    Parser.prototype.parse = function (input) {
        return this._fn_(input);
    };
    /** A parser that does nothing */
    Parser.ok = function (val) {
        return new Parser(function (input) {
            return result.ok({ output: val, rest: input });
        });
    };
    /** Any one character. Only fails on an empty string */
    Parser.anyChar = function () {
        return new Parser(function (input) {
            if (input.length) {
                return result.ok({ output: input.slice(0, 1), rest: input.slice(1) });
            }
            else {
                return result.err({ kind: 'EXPECTS_A_CHAR', input: "" });
            }
        });
    };
    /**
     * Parse a string.
     * Expects strings to be surrounded in single or double quotes.
     * backslash to escape; anything can be escaped.
     */
    Parser.string = function () {
        return new Parser(function (input) {
            var thisDelim = input[0];
            if (thisDelim !== '"' && thisDelim !== "'") {
                return result.err({
                    kind: 'EXPECTS_A_STRING',
                    expectedOneOf: ['"', "'"],
                    input: input
                });
            }
            var i = 1;
            var lastEscape = false;
            var s = "";
            while (i < input.length) {
                var char = input[i];
                // escape if backslash:
                if (!lastEscape && char === '\\') {
                    lastEscape = true;
                }
                // return if closing delim, unescaped:
                else if (!lastEscape && char === thisDelim) {
                    return result.ok({ output: s, rest: input.slice(i + 1) });
                }
                // Append char, unset escape mode if set:
                else {
                    s += char;
                    lastEscape = false;
                }
                i++;
            }
            // We haven't returned a string, so we ran out of chars:
            return result.err({
                kind: 'EXPECTS_A_CHAR',
                input: ''
            });
        });
    };
    /** Parse a number as a string */
    Parser.numberStr = function () {
        return new Parser(function (input) {
            var idx = 0;
            var nStr = "";
            // Return this on total failure:
            function nan() {
                return result.err({
                    kind: 'NOT_A_NUMBER',
                    input: input
                });
            }
            // Prefix:
            function pushSign() {
                if (input[idx] === '+') {
                    idx++;
                }
                else if (input[idx] === '-') {
                    idx++;
                    nStr += '-';
                }
            }
            // Leading digits:
            function pushDigits() {
                var hasNumbers = false;
                var charCode = input.charCodeAt(idx);
                while (charCode >= 48 /* 0 */ && charCode <= 57 /* 9 */) {
                    nStr += input[idx];
                    idx++;
                    hasNumbers = true;
                    charCode = input.charCodeAt(idx);
                }
                return hasNumbers;
            }
            pushSign();
            var hasLeadingDigits = pushDigits();
            var hasDecimalPlaces = false;
            // Decimal place and numbers after it:
            if (input[idx] === '.') {
                if (!hasLeadingDigits)
                    nStr += '0';
                nStr += '.';
                idx++;
                if (!pushDigits()) {
                    if (!hasLeadingDigits) {
                        return nan();
                    }
                    else {
                        // failed to push digits, so remove the '.'
                        // and return the number we've got so far:
                        return result.ok({
                            output: nStr.slice(0, -1),
                            rest: input.slice(idx - 1)
                        });
                    }
                }
                hasDecimalPlaces = true;
            }
            // A number has to have trailing digits or decimal
            // places, otherwise it's not valid:
            if (!hasLeadingDigits && !hasDecimalPlaces) {
                return nan();
            }
            // Exponent (e/E followed by optional sign and digits):
            var e = input[idx];
            if (e === 'e' || e === 'E') {
                var eIdx = idx;
                nStr += 'e';
                idx++;
                pushSign();
                if (!pushDigits()) {
                    // If no digits after E, roll back to last
                    // valid number and return that:
                    idx = eIdx;
                    nStr = nStr.slice(0, eIdx);
                }
            }
            return result.ok({
                output: nStr,
                rest: input.slice(idx)
            });
        });
    };
    /** A convenience function to turn a function scope into a parser to avoid reuse of vars */
    Parser.lazy = function (fn) {
        return new Parser(function (input) {
            return fn().parse(input);
        });
    };
    /** Return a parser that matches a given string */
    Parser.matchString = function () {
        var strings = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            strings[_i] = arguments[_i];
        }
        return new Parser(function (input) {
            for (var _i = 0, strings_1 = strings; _i < strings_1.length; _i++) {
                var s = strings_1[_i];
                if (input.slice(0, s.length) === s) {
                    return result.ok({ output: s, rest: input.slice(s.length) });
                }
            }
            return result.err({ kind: 'EXPECTS_A_STRING', expectedOneOf: strings, input: input });
        });
    };
    /** Take characters while the fn provided matches them to a max of n */
    Parser.takeWhileN = function (n, pat) {
        var fn = pat instanceof RegExp ? function (c) { return pat.test(c); }
            : typeof pat === 'string' ? function (c) { return pat === c; }
                : pat;
        return new Parser(function (input) {
            var i = 0;
            while (i < n && fn(input.charAt(i))) {
                i++;
            }
            return result.ok({ output: input.slice(0, i), rest: input.slice(i) });
        });
    };
    Parser.takeWhile = function (pat) {
        return Parser.takeWhileN(Infinity, pat);
    };
    /** Take characters while the fn provided matches them to a max of n */
    Parser.mustTakeWhileN = function (n, pat) {
        return new Parser(function (input) {
            var res = Parser.takeWhileN(n, pat).parse(input);
            if (result.isOk(res) && !res.value.output.length) {
                return result.err({ kind: 'EXPECTS_PATTERN', expectedPattern: pat, input: input });
            }
            else {
                return res;
            }
        });
    };
    Parser.mustTakeWhile = function (pat) {
        return Parser.mustTakeWhileN(Infinity, pat);
    };
    /** Run this on a parser to peek at the available position information (distances from end) */
    Parser.prototype.mapWithPosition = function (fn) {
        var _this = this;
        return new Parser(function (input) {
            return result.map(_this.parse(input), function (val) {
                var startLen = input.length;
                var endLen = val.rest.length;
                return { output: fn(val.output, { startLen: startLen, endLen: endLen }), rest: val.rest };
            });
        });
    };
    /** Make the success of this parser optional */
    Parser.prototype.optional = function () {
        var _this = this;
        return new Parser(function (input) {
            var res = _this.parse(input);
            if (result.isOk(res)) {
                return result.map(res, function (o) {
                    return { output: result.ok(o.output), rest: o.rest };
                });
            }
            else {
                return result.ok({
                    output: result.err(res.value), rest: input
                });
            }
        });
    };
    /** Map this parser result into something else */
    Parser.prototype.map = function (fn) {
        var _this = this;
        return new Parser(function (input) {
            return result.map(_this.parse(input), function (val) {
                return { output: fn(val.output), rest: val.rest };
            });
        });
    };
    Parser.prototype.mapErr = function (fn) {
        var _this = this;
        return new Parser(function (input) {
            return result.mapErr(_this.parse(input), function (err) {
                return fn(err);
            });
        });
    };
    /** Succeeds if the current parser or the one provided succeeds */
    Parser.prototype.or = function (other) {
        var _this = this;
        return new Parser(function (input) {
            var res1 = _this.parse(input);
            if (result.isErr(res1)) {
                return other.parse(input);
            }
            else {
                return res1;
            }
        });
    };
    /** Pass the result of the this parser to a function which returns the next parser */
    Parser.prototype.andThen = function (next) {
        var _this = this;
        return new Parser(function (input) {
            var res1 = _this.parse(input);
            if (result.isOk(res1)) {
                return next(res1.value.output).parse(res1.value.rest);
            }
            else {
                return res1;
            }
        });
    };
    Parser.prototype.sepBy = function (sep) {
        var _this = this;
        return new Parser(function (input) {
            var results = [];
            var separators = [];
            var restOfInput = input;
            while (true) {
                var res = _this.parse(restOfInput);
                if (result.isOk(res)) {
                    results.push(res.value.output);
                    restOfInput = res.value.rest;
                    var sepRes = sep.parse(restOfInput);
                    if (result.isOk(sepRes)) {
                        restOfInput = sepRes.value.rest;
                        separators.push(sepRes.value.output);
                    }
                    else {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            return result.ok({
                output: { results: results, separators: separators },
                rest: restOfInput
            });
        });
    };
    Parser.prototype.mustSepBy = function (sep) {
        var _this = this;
        return new Parser(function (input) {
            var res = _this.sepBy(sep).parse(input);
            if (result.isOk(res) && !res.value.output.separators.length) {
                return result.err({ kind: 'EXPECTS_A_SEPARATOR', input: input });
            }
            else {
                return res;
            }
        });
    };
    return Parser;
}());
exports.Parser = Parser;
