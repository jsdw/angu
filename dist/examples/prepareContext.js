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
function prepareContext() {
    var ctx = {
        scope: {
            // + op from earlier example:
            '+': function (a, b) { return a.eval() + b.eval(); },
            // Assignment op from earlier example:
            '=': function (a, b) {
                var resB = b.eval();
                if (a.kind() === 'variable') {
                    this.context.scope[a.name()] = resB;
                }
                else {
                    throw Error("Assignment expected a variable on the left but got a " + a.kind());
                }
                return resB;
            }
        },
        // We want to evaluate '+' calls before '=' calls:
        precedence: [
            ['+'],
            ['=']
        ]
    };
    // prepare a context to guarantee that we *do* share
    // state across subsequent eval calls:
    var preparedCtx = angu.prepareContext(ctx);
    // Subsequent calls are guaranteed to share state, so this works:
    assert.equal(angu.evaluate('foo = 10', preparedCtx).value, 10);
    assert.equal(angu.evaluate('foo = foo + 2', preparedCtx).value, 12);
    assert.equal(angu.evaluate('foo = foo + 5', preparedCtx).value, 17);
}
exports.default = prepareContext;
