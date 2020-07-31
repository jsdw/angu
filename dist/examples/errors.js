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
 * Failure to evaluate results in an error. Errors all have a `kind`,
 * and we can use TypeScript to ensure that we have handled every possible
 * error (and prove what error information is available) by matching on
 * this kind. All errors have a `pos.start` and `pos.end`. See `errors.ts`
 * for all of the possible types of error that can be given back.
 */
function errorMessages() {
    // Define the functionality and such available to
    // the evaluator:
    var ctx = {
        // We provide these operators:
        scope: {
            '-': function (a, b) { return a.eval() - b.eval(); },
            '+': function (a, b) { return a.eval() + b.eval(); }
        }
    };
    // This will be an error because * is not defined:
    var r1 = angu.evaluate('10 * 4 + 2', ctx);
    // We can use convenience functions to check error/ok:
    assert.ok(r1.isErr());
    assert.ok(!r1.isOk());
    // Because the operator doesn't exist, we get a parse error as
    // the string could not be entirely consumed, along with the part
    // of the string that was not consumed:
    assert.equal(r1.kind, 'err');
    assert.equal(r1.value.kind, 'NOT_CONSUMED_ALL');
    if (r1.value.kind === 'NOT_CONSUMED_ALL')
        assert.equal(r1.value.input, '* 4 + 2');
    // parse errors occur at a specific point, so start == end:
    assert.equal(r1.value.pos.start, 3);
    assert.equal(r1.value.pos.end, 3);
    // Everything is typed, so you can look at the errors defined
    // in `errors.ts` in order to see exactly what's available in
    // each case.
}
exports.default = errorMessages;
