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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var assert = __importStar(require("assert"));
var angu = __importStar(require("../index"));
/**
 * We can create a basic language for accessing results
 * from objects (or decoded JSON):
 */
function jsonFilter() {
    var ctx = {
        scope: {
            // Access props on an object, returning undefined if
            // not an object at this point:
            '.': function (a, b) {
                var obj = a.eval();
                return typeof obj === 'object'
                    ? obj[b.name()]
                    : undefined;
            },
            // Concat results together:
            'and': function (a, b) {
                var aRes = a.eval();
                var bRes = b.eval();
                var aArr = Array.isArray(aRes) ? aRes : [aRes];
                var bArr = Array.isArray(bRes) ? bRes : [bRes];
                return __spreadArrays(aArr, bArr);
            }
        },
        precedence: [
            ['.'],
            ['and']
        ]
    };
    // We might expose a method like this:
    function filterJson(obj, filter) {
        var res = angu.evaluate(filter, ctx, { o: obj });
        return res.value;
    }
    // We could then use it like this:
    assert.equal(filterJson({ foo: { bar: 'wibble' } }, 'o.foo.bar'), 'wibble');
    assert.equal(filterJson({ foo: { bar: 'wibble' } }, 'o.foo.bar.wibble.more'), undefined);
    assert.equal(filterJson({ foo: { bar: [0, 1, 2, { wibble: 'wobble' }] } }, 'o.foo.bar.3.wibble'), 'wobble');
    assert.equal(filterJson({ foo: { '$complex-name': 'wibble' } }, 'o.foo."$complex-name"'), 'wibble');
    assert.deepEqual(filterJson({ foo: { bar: [0, 1, 2], lark: [3, 4, 5], wibble: 6 } }, 'o.foo.bar and o.foo.lark and o.foo.wibble'), [0, 1, 2, 3, 4, 5, 6]);
}
exports.default = jsonFilter;
