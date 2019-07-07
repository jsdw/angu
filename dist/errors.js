"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
/** Given the original input string, this function adds position info to the provided Error  */
function toOutputError(fullInput, error) {
    var start;
    var end;
    switch (error.kind) {
        case 'PARSE_ERROR':
        case 'NOT_CONSUMED_ALL':
            start = fullInput.length - error.input.length;
            end = start;
            return __assign({}, error, { pos: { start: start, end: end } });
        case 'EVAL_THROW':
        case 'FUNCTION_NOT_DEFINED':
        case 'NOT_A_FUNCTION':
            start = fullInput.length - error.expr.pos.startLen;
            end = fullInput.length - error.expr.pos.endLen;
            return __assign({}, error, { pos: { start: start, end: end } });
    }
    neverHappens(error);
}
exports.toOutputError = toOutputError;
function neverHappens(_) {
    throw new Error('Cannot happen');
}
