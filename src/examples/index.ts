import basicLanguage from './basicLanguage'
import calculator from './calculator'
import { basicControlFlow, shortCircuiting } from './controlFlow'
import errors from './errors'
import spreadsheet from './spreadsheet'
import workingWithVariables from './workingWithVariables'

// This file imports all of our examples and tests them, to make sure that
// they work as expected! Check out the other files in this folder for the
// actual examples (each of which should be imported above).

describe('examples', function () {
    test(
        basicLanguage,
        calculator,
        basicControlFlow,
        shortCircuiting,
        errors,
        spreadsheet,
        workingWithVariables
    )
})

function test(...fns: (() => void)[]) {
    for (const fn of fns) {
        const matches = fn.toString().match('function ([a-zA-Z]+).*')
        if (!matches) throw Error('Function needs a name: ' + fn.toString())
        it(matches[1], fn)
    }
}