"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Value = exports.create = void 0;
function create(expr, context, inputLength, locals) {
    switch (expr.kind) {
        case 'variable': return thunkVariable(expr, context, inputLength, locals);
        case 'number': return thunkNumber(expr, context, inputLength);
        case 'bool': return thunkBool(expr, context, inputLength);
        case 'functioncall': return thunkFunctioncall(expr, context, inputLength, locals);
        case 'string': return thunkString(expr, context, inputLength);
    }
}
exports.create = create;
function thunkVariable(expr, context, inputLength, locals) {
    return new Value(inputLength, expr, function () {
        // Search locals first for the variable,
        // falling back to context.scope if no local:
        return locals && expr.name in locals
            ? locals[expr.name]
            : (context.scope || EMPTY)[expr.name];
    });
}
function thunkNumber(expr, _context, inputLength) {
    return new Value(inputLength, expr, function () { return expr.value; });
}
function thunkBool(expr, _context, inputLength) {
    return new Value(inputLength, expr, function () { return expr.value; });
}
function thunkString(expr, _context, inputLength) {
    return new Value(inputLength, expr, function () { return expr.value; });
}
function thunkFunctioncall(expr, context, inputLength, locals) {
    return new Value(inputLength, expr, function () {
        var fn = locals && expr.name in locals
            ? locals[expr.name]
            : (context.scope || EMPTY)[expr.name];
        if (typeof fn === 'function') {
            try {
                return fn.apply({ context: context }, expr.args.map(function (arg) { return create(arg, context, inputLength, locals); }));
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
    function Value(inputLength, expr, evaluateThunk) {
        this.inputLength = inputLength;
        this.expr = expr;
        this.evaluateThunk = evaluateThunk;
    }
    /** Evaluate the thunk and return the resulting value */
    Value.prototype.eval = function () {
        return this.evaluateThunk();
    };
    /** Return the kind of the expression */
    Value.prototype.kind = function () {
        return this.expr.kind;
    };
    /** Return the start and end position of the expression */
    Value.prototype.pos = function () {
        var pos = this.expr.pos;
        var len = this.inputLength;
        return {
            start: len - pos.startLen,
            end: len - pos.endLen
        };
    };
    /** Return the string rep we have for this thing */
    Value.prototype.toString = function () {
        return stringifyExpr(this.expr);
    };
    /** Return the name of the thing (variable name/function name, or else string rep) */
    Value.prototype.name = function () {
        return nameOfExpr(this.expr);
    };
    return Value;
}());
exports.Value = Value;
function nameOfExpr(e) {
    switch (e.kind) {
        case 'variable': return e.name;
        case 'bool': return String(e.value);
        case 'number': return e.string;
        case 'string': return e.value;
        case 'functioncall': return e.name;
    }
    // type error if we can get here.
}
function stringifyExpr(e) {
    switch (e.kind) {
        case 'variable': return e.name;
        case 'bool': return String(e.value);
        case 'number': return e.string;
        case 'string': return stringifyString(e);
        case 'functioncall': return stringifyFunctionCall(e);
    }
    // type error if we can get here.
}
function stringifyFunctionCall(e) {
    if (e.infix) {
        if (e.args.length == 1) {
            return e.name + "(" + stringifyExpr(e.args[0]) + ")";
        }
        else {
            return "(" + stringifyExpr(e.args[0]) + " " + e.name + " " + stringifyExpr(e.args[1]) + ")";
        }
    }
    else {
        return e.name + "(" + e.args.map(stringifyExpr).join(", ") + ")";
    }
}
function stringifyString(e) {
    var s = e.value;
    // crude escaping of things:
    return '"' + s.replace(/(["\\])/g, '\\$1') + '"';
}
var EMPTY = {};
