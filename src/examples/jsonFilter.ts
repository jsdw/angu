import * as assert from 'assert'
import * as angu from '../index'

type Any = angu.Value;

/**
 * We can create a basic language for accessing results
 * from objects (or decoded JSON):
 */
export default function jsonFilter () {

    const ctx: angu.Context = {
        scope: {
            // Access props on an object, returning undefined if
            // not an object at this point:
            '.': (a: Any, b: Any) => {
                const obj = a.eval()
                return typeof obj === 'object'
                    ? obj[b.name()]
                    : undefined
            },
            // Concat results together:
            'and': (a: Any, b: Any) => {
                const aRes = a.eval()
                const bRes = b.eval()

                const aArr = Array.isArray(aRes) ? aRes : [aRes]
                const bArr = Array.isArray(bRes) ? bRes : [bRes]

                return [...aArr, ...bArr]
            }
        },
        precedence: [
            ['.'],
            ['and']
        ]
    }

    // We might expose a method like this:
    function filterJson(obj: Object, filter: string) {
        const res = angu.evaluate(filter, ctx, { o: obj })
        return res.value
    }

    // We could then use it like this:
    assert.equal(
        filterJson({ foo: { bar: 'wibble' } }, 'o.foo.bar'),
        'wibble'
    )
    assert.equal(
        filterJson({ foo: { bar: 'wibble' } }, 'o.foo.bar.wibble.more'),
        undefined
    )
    assert.equal(
        filterJson({ foo: { bar: [0,1,2,{ wibble: 'wobble' }] } }, 'o.foo.bar.3.wibble'),
        'wobble'
    )
    assert.equal(
        filterJson({ foo: { '$complex-name': 'wibble' } }, 'o.foo."$complex-name"'),
        'wibble'
    )
    assert.deepEqual(
        filterJson({ foo: { bar: [0,1,2], lark: [3,4,5], wibble: 6 } }, 'o.foo.bar and o.foo.lark and o.foo.wibble'),
        [0,1,2,3,4,5,6]
    )

}