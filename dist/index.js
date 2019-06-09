"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var interpreter = __importStar(require("./interpreter"));
var parser = __importStar(require("./parser"));
var result_1 = require("./result");
var result_2 = require("./result");
exports.isOk = result_2.isOk;
exports.isErr = result_2.isErr;
/**
 * Given an expression to evaluate in string form, and a context
 * to evaluate the expression against, return the result of
 * this evaluation or throw an error if something goes wrong.
 */
function evaluate(input, context) {
    var parsed = parser.expression(context).parse(input);
    if (!result_1.isOk(parsed)) {
        return parsed;
    }
    if (parsed.value.rest.length) {
        return result_1.err({ kind: 'NOT_CONSUMED_ALL', input: parsed.value.rest });
    }
    return interpreter.evaluate(parsed.value.output, context);
}
exports.evaluate = evaluate;
