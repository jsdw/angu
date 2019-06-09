export declare type Result<T, E> = OkResult<T> | ErrResult<E>;
interface OkResult<T> {
    kind: 'ok';
    value: T;
}
interface ErrResult<E> {
    kind: 'err';
    value: E;
}
export declare function ok<T, E>(value: T): Result<T, E>;
export declare function err<T, E>(value: E): Result<T, E>;
export declare function isOk<T, E>(result: Result<T, E>): result is OkResult<T>;
export declare function isErr<T, E>(result: Result<T, E>): result is ErrResult<E>;
export declare function map<T1, T2, E>(result: Result<T1, E>, fn: (value: T1) => T2): Result<T2, E>;
export declare function mapErr<T, E1, E2>(result: Result<T, E1>, fn: (value: E1) => E2): Result<T, E2>;
export {};
