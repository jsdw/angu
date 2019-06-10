import Parser from './libparser';
import { Expression } from './expression';
export interface ExpressionOpts {
    /**
     * Order ops from high to low precedence, and optionally
     * pick an associativity for them(default left). Ops declared
     * first are evaluated first.
     *
     * ops not defined here will have a lower precedence than anything
     * that is defined.
     */
    precedence?: ({
        ops: string[];
        associativity?: 'right' | 'left';
    } | string[])[];
    /** Variables and functions that are in scope during evaluation */
    scope?: {
        [name: string]: any;
    };
}
declare type InternalExpressionOpts = {
    /** A map from op name to precedence. Higher = tighter binding. Default 5 */
    precedence: PrecedenceMap;
    /** Is the operator left or right associative? Default left */
    associativity: AssociativityMap;
    /** A sorted list of valid ops to try parsing */
    ops: string[];
};
declare type PrecedenceMap = {
    [op: string]: number;
};
declare type AssociativityMap = {
    [op: string]: 'left' | 'right';
};
/** Parse any expression, consuming surrounding space.This is the primary entry point: */
export declare function expression(opts: ExpressionOpts): Parser<Expression>;
export declare function anyExpression(opts: InternalExpressionOpts): Parser<Expression>;
export declare function binaryOpSubExpression(opts: InternalExpressionOpts): Parser<Expression>;
export declare function variableExpression(): Parser<Expression>;
export declare function numberExpression(): Parser<Expression>;
export declare function stringExpression(): Parser<Expression>;
export declare function booleanExpression(): Parser<Expression>;
export declare function unaryOpExpression(opts: InternalExpressionOpts): Parser<Expression>;
export declare function binaryOpExpression(opts: InternalExpressionOpts): Parser<Expression>;
export declare function functioncallExpression(opts: InternalExpressionOpts): Parser<Expression>;
export declare function parenExpression(opts: InternalExpressionOpts): Parser<Expression>;
export declare function number(): Parser<string>;
export declare function string(delim: string): Parser<string>;
export declare function token(): Parser<string>;
declare type Op = {
    value: string;
    isOp: boolean;
};
export declare function op(opList: string[]): Parser<Op>;
export declare function ignoreWhitespace(): Parser<void>;
export {};
