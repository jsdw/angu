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
var index_1 = require("./index");
describe('index', function () {
    it('can be used to create a simple calculator', function () {
        // Define the functionality and such available to
        // the evaluator:
        var ctx = {
            // We provide these operators:
            scope: {
                '-': function (a, b) { return a - b; },
                '+': function (a, b) { return a + b; },
                '/': function (a, b) { return a / b; },
                '*': function (a, b) { return a * b; },
            },
            // And define the precedence to be as expected:
            precedence: [
                ['/', '*'],
                ['-', '+']
            ]
        };
        // Now, we can evaluate things in this context:
        var r1 = index_1.evaluate('2 + 10 * 4', ctx);
        assert.equal(r1, 42);
        var r2 = index_1.evaluate('10 + 4 / 2 * 3', ctx);
        assert.equal(r2, 16);
    });
    it('can be used to build up a basic language', function () {
        var ctx = function () { return ({
            scope: {
                // Our basic calculator bits from above:
                '-': function (a, b) { return a - b; },
                '+': function (a, b) { return a + b; },
                '/': function (a, b) { return a / b; },
                '*': function (a, b) { return a * b; },
                // Let's allow multiple expressions, separated by ';':
                ';': function (_, b) { return b; },
                // we can access raw, unevaluated args using the 'this'
                // object. We use this here to allow '=' to assign new
                // variables that are visible to our evaluator:
                '=': function (a, b) {
                    var firstArg = this.rawArgs[0];
                    if (firstArg.kind === 'variable') {
                        this.context.scope[firstArg.name] = b;
                    }
                    else {
                        throw Error("Non-variable name provided to left of assignment: " + a);
                    }
                    return b;
                },
                // we can define regular functions as well:
                'log10': function (a) { return Math.log(a) / Math.log(10); },
                'pow': function (a, b) { return Math.pow(a, b); }
            },
            // first in this list = first to be evaluated:
            precedence: [
                ['/', '*'],
                ['-', '+'],
                // We can alter associativity of ops as well (right or left):
                { ops: ['='], associativity: 'right' },
                [';']
            ]
        }); };
        assert.equal(index_1.evaluate('1 + 2 + 3', ctx()), 6);
        assert.equal(index_1.evaluate('1 + 2 + 3 / 3', ctx()), 4);
        assert.equal(index_1.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()), 8);
        assert.equal(index_1.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()), 8);
        assert.equal(index_1.evaluate('(1 + 2 +  3/3) :pow 2 / 2', ctx()), 8);
        assert.equal(index_1.evaluate(' log10(100)  +2 -2', ctx()), 2);
        assert.equal(index_1.evaluate('foo = 8; foo = 10; bar = 2; foo * bar', ctx()), 20);
        // We'll use this example in the README:
        assert.equal(index_1.evaluate("\n            foo = 2;\n            bar = 4;\n            wibble = foo * bar + pow(2, 10);\n            foo + bar + wibble\n        ", ctx()), 1038);
    });
});
