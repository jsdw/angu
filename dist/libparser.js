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
    Parser.takeUntil = function (untilParser) {
        return new Parser(function (input) {
            var back = [];
            while (input.length) {
                // If we parse the "until", return what we have:
                var u = untilParser.parse(input);
                if (result.isOk(u)) {
                    return result.ok({
                        output: {
                            result: back.join(''),
                            until: u.value.output,
                        },
                        rest: u.value.rest
                    });
                }
                // Try parsing the original parser and add to back:
                var r = Parser.anyChar().parse(input);
                if (result.isOk(r)) {
                    back.push(r.value.output);
                    input = r.value.rest;
                }
            }
            return result.err({
                kind: 'EXPECTS_A_CHAR',
                input: ''
            });
        });
    };
    return Parser;
}());
exports.Parser = Parser;
