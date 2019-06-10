import { Pos } from "./libparser";
export declare type Expression = ExprVariable | ExprNumber | ExprBool | ExprFunctioncall | ExprString;
export declare type ExprVariable = {
    kind: 'variable';
    name: string;
    pos: Pos;
};
export declare type ExprNumber = {
    kind: 'number';
    value: number;
    string: string;
    pos: Pos;
};
export declare type ExprBool = {
    kind: 'bool';
    value: boolean;
    pos: Pos;
};
export declare type ExprFunctioncall = {
    kind: 'functioncall';
    name: string;
    args: Expression[];
    infix: boolean;
    pos: Pos;
};
export declare type ExprString = {
    kind: 'string';
    value: string;
    pos: Pos;
};
