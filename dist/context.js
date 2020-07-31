"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toInternalContext = void 0;
var parser_1 = require("./parser");
var OP_REGEX = /^[!£$%^&*@#~?<>|/+=;:.-]+$/;
function toInternalContext(ctx) {
    // Avoid preparing if we don't need to:
    if (isInternalContext(ctx))
        return ctx;
    // Convert opts to an internal format that's easier to work with.
    var precedenceArray = ctx.precedence || [];
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
            var op = ops_1[_a];
            precedenceMap[op] = precedenceValue;
            associativityMap[op] = associativity;
        }
        precedenceValue--;
    }
    // Look through scope to find all valid ops that have been declared.
    // We can then parse  exactly those, rejecting characters that aren't declared.
    // sort them longest first so we match most specific first.
    var scope = ctx.scope || {};
    var validUnaryOps = [];
    var validBinaryOps = [];
    var validBinaryStringOps = [];
    for (var key in scope) {
        var val = scope[key];
        // The op in scope must be a function:
        if (typeof val !== 'function') {
            continue;
        }
        var isOpChars = OP_REGEX.test(key);
        var isInPrecedenceMap = key in precedenceMap;
        var numberOfArgs = val.length;
        if (numberOfArgs === 2) {
            // Is a standard operator:
            if (isOpChars)
                validBinaryOps.push(key);
            // Is a string operator (no op chars but explicit precedence):
            else if (isInPrecedenceMap)
                validBinaryStringOps.push(key);
        }
        else if (numberOfArgs === 1 && isOpChars) {
            validUnaryOps.push(key);
        }
    }
    validUnaryOps.sort(sortOps);
    validBinaryOps.sort(sortOps);
    validBinaryStringOps.sort(sortOps);
    var internalContext = {
        _internal_: true,
        precedence: precedenceMap,
        associativity: associativityMap,
        unaryOps: validUnaryOps,
        binaryOps: validBinaryOps,
        binaryStringOps: validBinaryStringOps,
        scope: scope
    };
    // Cache our parser in the context to avoid rebuilding it each time:
    internalContext.expressionParser = parser_1.expression(internalContext);
    return internalContext;
}
exports.toInternalContext = toInternalContext;
function isInternalContext(ctx) {
    return ctx._internal_ === true;
}
function sortOps(a, b) {
    return a.length > b.length ? -1
        : a.length < b.length ? 1
            : 0;
}
