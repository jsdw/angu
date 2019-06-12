"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function ok(value) {
    return { kind: 'ok', value: value };
}
exports.ok = ok;
function err(value) {
    return { kind: 'err', value: value };
}
exports.err = err;
function isOk(result) {
    return result.kind === 'ok';
}
exports.isOk = isOk;
function isErr(result) {
    return result.kind === 'err';
}
exports.isErr = isErr;
function map(result, fn) {
    if (isOk(result)) {
        return ok(fn(result.value));
    }
    else {
        return result;
    }
}
exports.map = map;
function mapErr(result, fn) {
    if (isErr(result)) {
        return err(fn(result.value));
    }
    else {
        return result;
    }
}
exports.mapErr = mapErr;
// The above functions are the most efficient way to work with results, but when we expose our
// result externally we want to make it more convenient to use and not have to expose the above.
// Thus, we use this to attach useful prototype methods to the Result, which is less efficient
// than direct method calls but nicer to work with.
function toOutputResult(result) {
    var res = Object.create(resultMethods());
    res.kind = result.kind;
    res.value = result.value;
    return res;
}
exports.toOutputResult = toOutputResult;
var resultMethods = function () { return ({
    isOk: function () { return this.kind === 'ok'; },
    isErr: function () { return this.kind === 'err'; }
}); };
