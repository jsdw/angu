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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert_1 = __importDefault(require("assert"));
var benchmark_1 = __importDefault(require("benchmark"));
var angu = __importStar(require("./index"));
//
// Some random benchmarks to assist in tuning performance.
//
// What is the cost of doing nothing?
benchmark('baseline eval', function () { });
// What is the cost of evaluating almost nothing in Angu?
benchmark('Angu baseline eval', function () {
    assert_1.default.equal(angu.evaluate("0", {}).value, 0);
});
var noWorkBaselinePreparedCtx = angu.prepareContext({});
benchmark('Angu baseline eval with prepared context', function () {
    assert_1.default.equal(angu.evaluate("0", noWorkBaselinePreparedCtx).value, 0);
});
// How expensive is evaluating a basic operator chain of integers?
benchmark('Angu basic operator eval', function () {
    var ctx = {
        scope: {
            '+': function (a, b) { return a.eval() + b.eval(); }
        }
    };
    var v = angu.evaluate("1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3", ctx);
    assert_1.default.equal(v.value, 36);
});
var basicOperatorEvalPreparedCtx = angu.prepareContext({
    scope: {
        '+': function (a, b) { return a.eval() + b.eval(); }
    }
});
benchmark('Angu basic operator eval with prepared context', function () {
    var v = angu.evaluate("1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3 + 1 + 2 + 3", basicOperatorEvalPreparedCtx);
    assert_1.default.equal(v.value, 36);
});
benchmark('Basic string eval', function () {
    assert_1.default.equal(angu.evaluate("'Hello \\' There'", {}).value, "Hello ' There");
});
benchmark('Mixed expression eval', function () {
    var ctx = {
        scope: {
            '+': function (a, b) { return a.eval() + b.eval(); },
            'identity': function (a) { return a.eval(); }
        }
    };
    var v = angu.evaluate("'hello there' + 'person' + identity(2) + 10e1", ctx);
    assert_1.default.equal(v.value, "hello thereperson2100");
});
var mixedExpressionPreparedCtx = angu.prepareContext({
    scope: {
        '+': function (a, b) { return a.eval() + b.eval(); },
        'identity': function (a) { return a.eval(); }
    }
});
benchmark('Mixed expression eval with prepared context', function () {
    var v = angu.evaluate("'hello there' + 'person' + identity(2) + 10e1", mixedExpressionPreparedCtx);
    assert_1.default.equal(v.value, "hello thereperson2100");
});
// Util function to run a benchmark:
function benchmark(name, fn) {
    var bench = new benchmark_1.default(name, fn);
    try {
        fn();
        bench
            .on('complete', function (event) {
            console.log(String(event.target));
        })
            .run();
    }
    catch (e) {
        console.log(name + " threw an error: " + e);
    }
}
