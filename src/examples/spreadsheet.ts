import * as assert from 'assert'
import * as angu from '../index'

type Any = angu.Value;

/**
 * We can implement basic Excel-like spreadsheet operations by looking at
 * token names and using them as cell identifiers.
 */
export default function spreadsheet () {

    // Given some table of information (cols by letter, rows by number):
    const table = [
    //    A    B   C    D,
        [ 1,  'm', 30,  103],
        [ 2,  'f', 26,  260],
        [ 3,  'm', 18,  130],
        [ 4,  'm', 18,  130],
        [ 5,  'm', 18,  130],
        [ 6,  'm', 18,  130],
    ]

    // ... And functions that can access cells in this table:
    const getIdx = (str: string): [number, number] => {
        const colIdx = str.charCodeAt(0) - 65 // convert letters to col index
        const rowIdx = Number(str.slice(1)) - 1 // use rest as row index (1 indexed)
        return [rowIdx, colIdx]
    }
    const getValue = (val: Any): any => {
        const v = val.eval() || val.name()
        if (typeof v === 'string') {
            const [rowIdx, colIdx] = getIdx(v)
            return table[rowIdx][colIdx]
        } else {
            return v
        }
    }
    const getRange = (a: string, b: string): any[] => {
        const [startRow, startCol] = getIdx(a)
        const [endRow, endCol] = getIdx(b)
        const out = []
        for(let i = startRow; i <= endRow; i++) {
            for(let j = startCol; j <= endCol; j++) {
                out.push(table[i][j])
            }
        }
        return out
    }

    // ... We can define operators/functions to work on those cells:
    const ctx: angu.Context = {
        scope: {
            '+': (a: Any, b: Any) => getValue(a) + getValue(b),
            '-': (a: Any, b: Any) => getValue(a) - getValue(b),
            ':': (a: Any, b: Any) => getRange(a.name(), b.name()),
            'SUM': (a: angu.Value<number[]>) => {
                return a.eval().reduce((acc, n) => acc + n, 0)
            },
            'MEAN': (a: angu.Value<number[]>) => {
                let arr = a.eval()
                return arr.reduce((acc, n) => acc + n, 0) / arr.length
            }
        }
    }

    // Finally, we can evaluate excel-like commands to query them:
    const r1 = angu.evaluate('SUM(A1:A3)', ctx).value
    assert.equal(r1, 6)
    const r2 = angu.evaluate('D1 + D2', ctx).value
    assert.equal(r2, 363)
    const r3 = angu.evaluate('MEAN(A1:A5) + SUM(C1:D2) - 10', ctx).value
    assert.equal(r3, 412)

}