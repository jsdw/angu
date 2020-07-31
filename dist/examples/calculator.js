"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = __importStar(require("assert"));
var angu = __importStar(require("../index"));
/**
 * A simple calculator with a constant and a few operators available,
 * taking care to assign the correct precedence to operators so that
 * they are applied in the right order.
 */
function calculator() {
    // Define the functionality and such available to
    // the evaluator:
    var ctx = {
        // We provide these things in scope:
        scope: {
            '-': function (a, b) { return a.eval() - b.eval(); },
            '+': function (a, b) { return a.eval() + b.eval(); },
            '/': function (a, b) { return a.eval() / b.eval(); },
            '*': function (a, b) { return a.eval() * b.eval(); },
            'PI': 3.14
        },
        // And define the precedence to be as expected:
        precedence: [
            ['/', '*'],
            ['-', '+']
        ]
    };
    // Now, we can evaluate things in this context:
    var r1 = angu.evaluate('2 + 10 * 4', ctx);
    assert.equal(r1.value, 42);
    var r2 = angu.evaluate('10 + 4 / 2 * 3', ctx);
    assert.equal(r2.value, 16);
    var r3 = angu.evaluate('PI * 2', ctx);
    assert.equal(r3.value, 6.28);
}
exports.default = calculator;
