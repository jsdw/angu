"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var basicLanguage_1 = __importDefault(require("./basicLanguage"));
var calculator_1 = __importDefault(require("./calculator"));
var controlFlow_1 = require("./controlFlow");
var errors_1 = __importDefault(require("./errors"));
var spreadsheet_1 = __importDefault(require("./spreadsheet"));
var workingWithVariables_1 = __importDefault(require("./workingWithVariables"));
// This file imports all of our examples and tests them, to make sure that
// they work as expected! Check out the other files in this folder for the
// actual examples (each of which should be imported above).
describe('examples', function () {
    test(basicLanguage_1.default, calculator_1.default, controlFlow_1.basicControlFlow, controlFlow_1.shortCircuiting, errors_1.default, spreadsheet_1.default, workingWithVariables_1.default);
});
function test() {
    var fns = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fns[_i] = arguments[_i];
    }
    for (var _a = 0, fns_1 = fns; _a < fns_1.length; _a++) {
        var fn = fns_1[_a];
        var matches = fn.toString().match('function ([a-zA-Z]+).*');
        if (!matches)
            throw Error('Function needs a name: ' + fn.toString());
        it(matches[1], fn);
    }
}
