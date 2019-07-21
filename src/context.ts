import { expression } from './parser'

/** A context that contains everything required to evaluate an Angu expression */
export interface ExternalContext {
    /**
     * Order ops from high to low precedence, and optionally
     * pick an associativity for them (default left). Ops declared
     * first are evaluated first.
     *
     * ops not defined here will have a lower precedence than anything
     * that is defined.
     */
    precedence?: ({ ops: string[], associativity?: 'right' | 'left' } | string[])[]
    /** Variables and functions that are in scope during evaluation */
    scope?: Scope
}

export type Scope = { [name: string]: any }

export interface InternalContext {
    /** This is used internally only */
    _internal_: true
    /** A map from op name to precedence. Higher = tighter binding. Default 5 */
    precedence: PrecedenceMap
    /** Is the operator left or right associative? Default left */
    associativity: AssociativityMap
    /** A sorted list of valid unary ops to try parsing */
    unaryOps: string[]
    /** A sorted list of valid binary ops to try parsing */
    binaryOps: string[]
    /** A sorted list of valid binary string ops */
    binaryStringOps: string[]
    /** Variables and functions that are in scope during evaluation */
    scope?: Scope
    /** Cache the parser to avoid rebuilding it each time */
    expressionParser?: ReturnType<typeof expression>
}

export type PrecedenceMap = { [op: string]: number }
export type AssociativityMap = { [op: string]: 'left' | 'right' }

const OP_REGEX = /^[!£$%^&*@#~?<>|/+=;:.-]+$/

export function toInternalContext(ctx: ExternalContext | InternalContext): InternalContext {

    // Avoid preparing if we don't need to:
    if(isInternalContext(ctx)) return ctx

    // Convert opts to an internal format that's easier to work with.
    const precedenceArray = ctx.precedence || []
    const precedenceMap: PrecedenceMap = {}
    const associativityMap: AssociativityMap = {}
    let precedenceValue = precedenceArray.length
    for(const rawEntry of precedenceArray) {
        // entry could be ['+','-',..] or { ops: ['+', '-',..], associativity: 'left }
        // for convenience. Convert to the more general form to iterate over:
        const entry = Array.isArray(rawEntry) ? { ops: rawEntry } : rawEntry
        const ops = entry.ops
        const associativity = entry.associativity || 'left'
        // Note precedence and associativity of each op:
        for(const op of ops) {
            precedenceMap[op] = precedenceValue
            associativityMap[op] = associativity
        }
        precedenceValue--
    }

    // Look through scope to find all valid ops that have been declared.
    // We can then parse  exactly those, rejecting characters that aren't declared.
    // sort them longest first so we match most specific first.
    const scope = ctx.scope || {}
    const validUnaryOps: string[] = []
    const validBinaryOps: string[] = []
    const validBinaryStringOps: string[] = []
    for (const key in scope) {

        const val = scope[key]

        // The op in scope must be a function:
        if (typeof val !== 'function') {
            continue
        }

        const isOpChars = OP_REGEX.test(key)
        const isInPrecedenceMap = key in precedenceMap
        const numberOfArgs = val.length

        if (numberOfArgs === 2) {
            // Is a standard operator:
            if (isOpChars) validBinaryOps.push(key)
            // Is a string operator (no op chars but explicit precedence):
            else if (isInPrecedenceMap) validBinaryStringOps.push(key)
        } else if (numberOfArgs === 1 && isOpChars) {
            validUnaryOps.push(key)
        }
    }

    validUnaryOps.sort(sortOps)
    validBinaryOps.sort(sortOps)
    validBinaryStringOps.sort(sortOps)

    const internalContext: InternalContext = {
        _internal_: true,
        precedence: precedenceMap,
        associativity: associativityMap,
        unaryOps: validUnaryOps,
        binaryOps: validBinaryOps,
        binaryStringOps: validBinaryStringOps,
        scope: scope
    }

    // Cache our parser in the context to avoid rebuilding it each time:
    internalContext.expressionParser = expression(internalContext)
    return internalContext
}

function isInternalContext(ctx: any): ctx is InternalContext {
    return ctx._internal_ === true
}

function sortOps (a: string, b: string): number {
    return a.length > b.length ? -1
        : a.length < b.length ? 1
        : 0
}