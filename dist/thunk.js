"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function create(expr, context) {
    switch (expr.kind) {
        case 'variable': return thunkVariable(expr, context);
        case 'number': return thunkNumber(expr, context);
        case 'bool': return thunkBool(expr, context);
        case 'functioncall': return thunkFunctioncall(expr, context);
        case 'string': return thunkString(expr, context);
    }
}
exports.create = create;
function thunkVariable(expr, context) {
    // If the variable doesn't exist, return its name. Assuming assignment
    // isn't implemented, this allows for primitive tokens.
    return new Value(expr, function () {
        var res = (context.scope || EMPTY)[expr.name];
        return typeof res === 'undefined'
            ? expr.name
            : res;
    });
}
function thunkNumber(expr, _context) {
    return new Value(expr, function () { return expr.value; });
}
function thunkBool(expr, _context) {
    return new Value(expr, function () { return expr.value; });
}
function thunkString(expr, _context) {
    return new Value(expr, function () { return expr.value; });
}
function thunkFunctioncall(expr, context) {
    return new Value(expr, function () {
        var fn = (context.scope || EMPTY)[expr.name];
        if (typeof fn === 'function') {
            try {
                return fn.apply({ context: context }, expr.args.map(function (arg) { return create(arg, context); }));
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
    function Value(expr, evaluateThunk) {
        this.expr = expr;
        this.evaluateThunk = evaluateThunk;
    }
    /** Evaluate the thunk and return the resulting value */
    Value.prototype.eval = function () {
        return this.evaluateThunk();
    };
    /** Return the raw, unevaluated expression */
    Value.prototype.raw = function () {
        return this.expr;
    };
    return Value;
}());
exports.Value = Value;
var EMPTY = {};
