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
