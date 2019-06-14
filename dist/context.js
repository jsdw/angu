"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    var validOps = [];
    for (var key in scope) {
        // The op in scope must be a function:
        if (typeof scope[key] !== 'function') {
            continue;
        }
        // Each character must be a valid op character:
        if (!OP_REGEX.test(key)) {
            continue;
        }
        validOps.push(key);
    }
    validOps.sort(function (a, b) {
        return a.length > b.length ? -1
            : a.length < b.length ? 1
                : 0;
    });
    return {
        _internal_: true,
        precedence: precedenceMap,
        associativity: associativityMap,
        ops: validOps,
        scope: scope
    };
}
exports.toInternalContext = toInternalContext;
function isInternalContext(ctx) {
    return ctx._internal_ === true;
}
