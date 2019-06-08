export type Result<T, E>
    = OkResult<T>
    | ErrResult<E>

interface OkResult<T> { kind: 'ok', value: T }
interface ErrResult<E> { kind: 'err', value: E }

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