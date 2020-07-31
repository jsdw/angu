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
exports.shortCircuiting = exports.basicControlFlow = void 0;
var assert = __importStar(require("assert"));
var angu = __importStar(require("../index"));
/**
 * This shows that it is possible to implement control flow using
 * a function (`if`) and only evaluating one argument or the other
 * depending on the condition (which evaluates to truthy or falsey)
 */
function basicControlFlow() {
    var good = false;
    var bad = false;
    var ctx = {
        scope: {
            // Only evaluates one of `then` or `otherwise`:
            'if': function (cond, then, otherwise) {
                if (cond.eval()) {
                    return then.eval();
                }
                else {
                    return otherwise.eval();
                }
            },
            // Run these to set our good or bad variable:
            'setGood': function () { good = true; },
            'setBad': function () { bad = true; }
        }
    };
    // Only setGood should be called:
    good = false;
    bad = false;
    angu.evaluate('if(true, setGood(), setBad())', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
    // Only setGood should be called:
    good = false;
    bad = false;
    angu.evaluate('if(false, setBad(), setGood())', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
}
exports.basicControlFlow = basicControlFlow;
/**
 * We can also use operators to perform control flow; here we create the
 * OR operator (`||`), which only evaluates the argument on the right if
 * the argument on the left was falsey.
 */
function shortCircuiting() {
    var good = false;
    var bad = false;
    var ctx = {
        scope: {
            // Evaluates to the first truthy result, short circuiting right:
            '||': function (a, b) {
                // fallback to JS, which doesn't evaluate the expr on
                // the right if the left one is truthy:
                return a.eval() || b.eval();
            },
            // Just for fun, we can implement the above as a binary string op too:
            'or': function (a, b) { return a.eval() || b.eval(); },
            // Run these to set our good or bad variable (setGood returns truthy):
            'setGood': function () { good = true; return true; },
            'setBad': function () { bad = true; }
        },
        precedence: [
            // List the function we want to be able to use as
            // a binary operator here to make it so:
            ['or']
        ]
    };
    // Only setGood should be called, evaluation stops before any `setBad` calls:
    good = false;
    bad = false;
    angu.evaluate('setGood() || setBad() || setBad()', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
    good = false;
    bad = false;
    angu.evaluate('false or setGood() or setBad() or setBad()', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
    good = false;
    bad = false;
    angu.evaluate('false || false || setGood() || setBad() || setBad()', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
}
exports.shortCircuiting = shortCircuiting;
