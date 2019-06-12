export type Result<T, E>
    = OkResult<T>
    | ErrResult<E>

type OkResult<T> = { readonly kind: 'ok', value: T }
type ErrResult<E> = { readonly kind: 'err', value: E }

export function ok<T, E>(value: T): Result<T, E> {
    return { kind: 'ok', value }
}

export function err<T, E>(value: E): Result<T, E> {
    return { kind: 'err', value }
}

export function isOk<T, E>(result: Result<T, E>): result is OkResult<T> {
    return result.kind === 'ok'
}

export function isErr<T, E>(result: Result<T, E>): result is ErrResult<E> {
    return result.kind === 'err'
}

export function map<T1, T2, E>(result: Result<T1, E>, fn: (value: T1) => T2): Result<T2, E> {
    if (isOk(result)) {
        return ok(fn(result.value))
    } else {
        return result
    }
}

export function mapErr<T, E1, E2>(result: Result<T, E1>, fn: (value: E1) => E2): Result<T, E2> {
    if (isErr(result)) {
        return err(fn(result.value))
    } else {
        return result
    }
}

// The above functions are the most efficient way to work with results, but when we expose our
// result externally we want to make it more convenient to use and not have to expose the above.
// Thus, we use this to attach useful prototype methods to the Result, which is less efficient
// than direct method calls but nicer to work with.
export function toOutputResult<T,E>(result: Result<T,E>): OutputResult<T,E> {
    const res = Object.create(resultMethods())
    res.kind = result.kind
    res.value = result.value
    return res
}

/** A result, which can be in an 'ok' or 'err' state. */
export type OutputResult<T,E> = Result<T,E> & ResultMethods<T,E>

interface ResultMethods<T,E> {
    /** Is the result an ok value (ie not an error)? */
    isOk(this: Result<T,E>): this is OkResult<T> & ResultMethods<T,E>
    /** Is the result an error? */
    isErr(this: Result<T,E>): this is ErrResult<T> & ResultMethods<T,E>
}
const resultMethods = <T,E> (): ResultMethods<T,E> => ({
    isOk() { return this.kind === 'ok' },
    isErr() { return this.kind === 'err' }
})
