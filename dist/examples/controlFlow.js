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
            // Run these to set our good or bad variable (setGood returns truthy):
            'setGood': function () { good = true; return true; },
            'setBad': function () { bad = true; }
        }
    };
    // Only setGood should be called, evaluation stops before any `setBad` calls:
    good = false;
    bad = false;
    angu.evaluate('setGood() || setBad() || setBad()', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
    good = false;
    bad = false;
    angu.evaluate('false || setGood() || setBad() || setBad()', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
    good = false;
    bad = false;
    angu.evaluate('false || false || setGood() || setBad() || setBad()', ctx);
    assert.equal(good, true);
    assert.equal(bad, false);
}
exports.shortCircuiting = shortCircuiting;
