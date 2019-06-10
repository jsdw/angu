"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    return new Value(expr, function () {
        var res = (context.scope || EMPTY)[expr.name];
        return typeof res === 'undefined'
            ? expr.name
            : res;
    });
}
function evaluateNumber(expr, _context) {
    return new Value(expr, function () { return expr.value; });
}
function evaluateBool(expr, _context) {
    return new Value(expr, function () { return expr.value; });
}
function evaluateFunctioncall(expr, context) {
    return new Value(expr, function () {
        var fn = (context.scope || EMPTY)[expr.name];
        if (typeof fn === 'function') {
            try {
                return fn.apply({ context: context }, expr.args.map(function (arg) { return evaluate(arg, context); }));
            }
            catch (e) {
                var err = {
                    kind: 'EVAL_THROW',
                    expr: expr,
                    error: e
                };
                throw err;
            }
        }
        else if (!fn) {
            var err = {
                kind: 'FUNCTION_NOT_DEFINED',
                expr: expr
            };
            throw err;
        }
        else {
            var err = {
                kind: 'NOT_A_FUNCTION',
                expr: expr,
                value: fn
            };
            throw err;
        }
    });
}
var Value = /** @class */ (function () {
    function Value(expr, evaluate) {
        this.expr = expr;
        this.evaluate = evaluate;
    }
    /** Evaluate the expression and return the result */
    Value.prototype.eval = function () {
        return this.evaluate();
    };
    /** Return the raw, unevaluated expression */
    Value.prototype.raw = function () {
        return this.expr;
    };
    return Value;
}());
exports.Value = Value;
var EMPTY = {};
