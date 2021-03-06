import { Parser, LibParseError } from './libparser';
import { Expression } from './expression';
import { InternalContext } from './context';
import { ParseError } from './errors';
declare type ExternalParser<T> = Parser<T, ParseError>;
declare type InternalParser<T> = Parser<T, LibParseError>;
/** Parse any expression, consuming surrounding space. This is the primary entry point: */
export declare function expression(opts: InternalContext): ExternalParser<Expression>;
export declare function anyExpression(opts: InternalContext): InternalParser<Expression>;
export declare function binaryOpSubExpression(opts: InternalContext): InternalParser<Expression>;
export declare function variableExpression(): InternalParser<Expression>;
export declare function numberExpression(): InternalParser<Expression>;
export declare function stringExpression(): InternalParser<Expression>;
export declare function booleanExpression(): InternalParser<Expression>;
export declare function unaryOpExpression(opts: InternalContext): InternalParser<Expression>;
export declare function binaryOpExpression(opts: InternalContext): InternalParser<Expression>;
export declare function functioncallExpression(opts: InternalContext): InternalParser<Expression>;
export declare function parenExpression(opts: InternalContext): InternalParser<Expression>;
export declare function token(): InternalParser<string>;
export {};
