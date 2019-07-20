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
                return aArr.concat(bArr);
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
