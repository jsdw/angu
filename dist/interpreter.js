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
    var res = context.scope[expr.name];
    return typeof res === 'undefined'
        ? expr.name
        : res;
}
function evaluateNumber(expr, _context) {
    return expr.value;
}
function evaluateBool(expr, _context) {
    return expr.value;
}
function evaluateFunctioncall(expr, context) {
    var fn = context.scope[expr.name];
    if (typeof fn === 'function') {
        var self_1 = { context: context, rawArgs: expr.args };
        return fn.apply(self_1, expr.args.map(function (arg) { return evaluate(arg, context); }));
    }
    else if (!fn) {
        throw new Error("The function " + expr.name + " is not defined");
    }
    else {
        throw new Error(expr.name + " is being called like a function but is not one");
    }
}
