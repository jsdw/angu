"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
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
