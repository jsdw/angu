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
