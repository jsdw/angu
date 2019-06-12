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
var result = __importStar(require("./result"));
describe('result', function () {
    it('"ok" result is ok', function () {
        var okResult = result.ok(10);
        assert.ok(result.isOk(okResult));
        assert.ok(!result.isErr(okResult));
        var outputResult = result.toOutputResult(okResult);
        assert.ok(outputResult.isOk());
        assert.ok(!outputResult.isErr());
    });
    it('"err" result is err', function () {
        var errResult = result.err(10);
        assert.ok(!result.isOk(errResult));
        assert.ok(result.isErr(errResult));
        var outputResult = result.toOutputResult(errResult);
        assert.ok(!outputResult.isOk());
        assert.ok(outputResult.isErr());
    });
});
