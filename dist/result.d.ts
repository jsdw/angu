export declare type Result<T, E> = OkResult<T> | ErrResult<E>;
declare type OkResult<T> = {
    readonly kind: 'ok';
    value: T;
};
declare type ErrResult<E> = {
    readonly kind: 'err';
    value: E;
};
export declare function ok<T, E>(value: T): Result<T, E>;
export declare function err<T, E>(value: E): Result<T, E>;
export declare function isOk<T, E>(result: Result<T, E>): result is OkResult<T>;
export declare function isErr<T, E>(result: Result<T, E>): result is ErrResult<E>;
export declare function map<T1, T2, E>(result: Result<T1, E>, fn: (value: T1) => T2): Result<T2, E>;
export declare function mapErr<T, E1, E2>(result: Result<T, E1>, fn: (value: E1) => E2): Result<T, E2>;
export declare function toOutputResult<T, E>(result: Result<T, E>): OutputResult<T, E>;
/** A result, which can be in an 'ok' or 'err' state. */
export declare type OutputResult<T, E> = Result<T, E> & ResultMethods<T, E>;
interface ResultMethods<T, E> {
    /** Is the result an ok value (ie not an error)? */
    isOk(this: Result<T, E>): this is OkResult<T> & ResultMethods<T, E>;
    /** Is the result an error? */
    isErr(this: Result<T, E>): this is ErrResult<T> & ResultMethods<T, E>;
}
export {};
