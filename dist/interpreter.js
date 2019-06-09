"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var result_1 = require("./result");
function evaluate(expr, context) {
    switch (expr.kind) {
        case 'variable': return evaluateVariable(expr, context);
        case 'number': return evaluateNumber(expr, context);
        case 'bool': return evaluateBool(expr, context);
        case 'functioncall': return evaluateFunctioncall(expr, context);
    }
}
exports.evaluate = evaluate;
function evaluateVariable(expr, context) {
    // If the variable doesn't exist, return its name. Assuming assignment
    // isn't implemented, this allows for primitive tokens.
    var res = (context.scope || EMPTY)[expr.name];
    return typeof res === 'undefined'
        ? result_1.ok(expr.name)
        : result_1.ok(res);
}
function evaluateNumber(expr, _context) {
    return result_1.ok(expr.value);
}
function evaluateBool(expr, _context) {
    return result_1.ok(expr.value);
}
function evaluateFunctioncall(expr, context) {
    var fn = (context.scope || EMPTY)[expr.name];
    if (typeof fn === 'function') {
        var self_1 = { context: context, rawArgs: expr.args };
        // Evaluate each arg before passing it in, threading out any errors:
        var evaluatedArgs = [];
        for (var _i = 0, _a = expr.args; _i < _a.length; _i++) {
            var arg = _a[_i];
            var res = evaluate(arg, context);
            if (result_1.isOk(res)) {
                evaluatedArgs.push(res.value);
            }
            else {
                // Something went wrong evaluating a sub expr; pass that error on:
                return res;
            }
        }
        try {
            return result_1.ok(fn.apply(self_1, evaluatedArgs));
        }
        catch (e) {
            return result_1.err({
                kind: 'EVAL_THROW',
                expr: expr,
                error: e
            });
        }
    }
    else if (!fn) {
        return result_1.err({
            kind: 'FUNCTION_NOT_DEFINED',
            expr: expr
        });
    }
    else {
        return result_1.err({
            kind: 'NOT_A_FUNCTION',
            expr: expr,
            value: fn
        });
    }
}
var EMPTY = {};
