"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var thunk = __importStar(require("./thunk"));
var parser = __importStar(require("./parser"));
var errors = __importStar(require("./errors"));
var result_1 = require("./result");
var context_1 = require("./context");
// Re-export some useful functions:
var thunk_1 = require("./thunk");
exports.Value = thunk_1.Value;
var result_2 = require("./result");
exports.isOk = result_2.isOk;
exports.isErr = result_2.isErr;
/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
function evaluate(input, context) {
    var internalCtx = context_1.toInternalContext(context);
    var parsed = parser.expression(internalCtx).parse(input);
    if (!result_1.isOk(parsed)) {
        return result_1.mapErr(parsed, function (e) { return errors.addPositionToError(input, e); });
    }
    if (parsed.value.rest.length) {
        var e = { kind: 'NOT_CONSUMED_ALL', input: parsed.value.rest };
        return result_1.err(errors.addPositionToError(input, e));
    }
    try {
        var value = thunk.create(parsed.value.output, internalCtx);
        return result_1.ok(value.eval());
    }
    catch (e) {
        return result_1.err(e);
    }
}
exports.evaluate = evaluate;
