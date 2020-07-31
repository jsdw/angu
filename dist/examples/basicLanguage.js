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
 * Build a very simple expression based language with assignment,
 * semicolon separated expressions and some operators and functions.
 */
function basicLanguage() {
    // Put the context behind a function to guarantee that no
    // state is shared between subsequent evaluate calls.
    var ctx = function () { return ({
        scope: {
            // Our basic calculator bits from above:
            '-': function (a, b) { return a.eval() - b.eval(); },
            '+': function (a, b) { return a.eval() + b.eval(); },
            '/': function (a, b) { return a.eval() / b.eval(); },
            '*': function (a, b) {
                var aVal = a.eval();
                var bVal = b.eval();
                // Bit of fun; if we pass string * number, repeat string
                // that number of times:
                if (typeof aVal === 'string') {
                    var t = aVal;
                    for (var i = 1; i < bVal; i++)
                        aVal += t;
                    return aVal;
                }
                // Else, just assume both are numbers and multiply them:
                else {
                    return a.eval() * b.eval();
                }
            },
            // Let's allow multiple expressions, separated by ';':
            ';': function (a, b) { a.eval(); return b.eval(); },
            // we can access the kind and name of input args. This
            // allows us to do things like variable assignment:
            '=': function (a, b) {
                var resB = b.eval();
                if (a.kind() === 'variable') {
                    this.context.scope[a.name()] = resB;
                }
                else {
                    throw Error("Assignment expected a variable on the left but got a " + a.kind());
                }
                return resB;
            },
            // we can define regular functions as well:
            'log10': function (a) { return Math.log(a.eval()) / Math.log(10); },
            'pow': function (a, b) { return Math.pow(a.eval(), b.eval()); }
        },
        // first in this list = first to be evaluated:
        precedence: [
            ['/', '*'],
            ['-', '+'],
            // We can use 'pow' as a binary op since it takes exactly two
            // arguments and has an explicit precedence:
            ['pow'],
            // We can alter associativity of ops as well (right or left):
            { ops: ['='], associativity: 'right' },
            [';']
        ]
    }); };
    assert.equal(angu.evaluate('"hello " + "world"', ctx()).value, "hello world");
    // We can pass in local variables at eval time:
    assert.equal(angu.evaluate('"hello " + w', ctx(), { w: 'world' }).value, "hello world");
    assert.equal(angu.evaluate('"hello" * 4', ctx()).value, "hellohellohellohello");
    assert.equal(angu.evaluate('1 + 2 + 3', ctx()).value, 6);
    assert.equal(angu.evaluate('1 + 2 + 3 / 3', ctx()).value, 4);
    assert.equal(angu.evaluate('pow(1 + 2 +  3/3, 2) / 2', ctx()).value, 8);
    // We can pass in local functions at eval time, which override those in scope:
    assert.equal(angu.evaluate('pow(1 + 2, 2)', ctx(), { pow: function (a, b) { return a.eval() + b.eval(); } }).value, 5);
    // String functions can be used inline IF they take 2 args *and* have an explicit precedence:
    assert.equal(angu.evaluate("2 pow 3", ctx()).value, 8);
    assert.equal(angu.evaluate("2 pow 3", ctx(), { pow: function (a, b) { return a.eval() + b.eval(); } }).value, 5);
    assert.equal(angu.evaluate(' log10(100)  +2 -2', ctx()).value, 2);
    assert.equal(angu.evaluate('foo = 8; foo = 10; bar = 2; foo * bar', ctx()).value, 20);
    // We'll use this example in the README:
    assert.equal(angu.evaluate("\n        foo = 2;\n        bar = 4;\n        wibble = foo * bar + pow(2, 10);\n        foo + bar + wibble\n    ", ctx()).value, 1038);
}
exports.default = basicLanguage;
