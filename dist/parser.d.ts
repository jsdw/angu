import Parser from './libparser';
import { Expression } from './expression';
import { InternalContext } from './context';
/** Parse any expression, consuming surrounding space. This is the primary entry point: */
export declare function expression(opts: InternalContext): Parser<Expression>;
export declare function binaryOpSubExpression(opts: InternalContext): Parser<Expression>;
export declare function variableExpression(): Parser<Expression>;
export declare function numberExpression(): Parser<Expression>;
export declare function stringExpression(): Parser<Expression>;
export declare function booleanExpression(): Parser<Expression>;
export declare function unaryOpExpression(opts: InternalContext): Parser<Expression>;
export declare function binaryOpExpression(opts: InternalContext): Parser<Expression>;
export declare function functioncallExpression(opts: InternalContext): Parser<Expression>;
export declare function parenExpression(opts: InternalContext): Parser<Expression>;
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
