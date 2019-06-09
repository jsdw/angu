export declare type Expression = ExprVariable | ExprNumber | ExprBool | ExprFunctioncall;
export declare type ExprVariable = {
    kind: 'variable';
    name: string;
};
export declare type ExprNumber = {
    kind: 'number';
    value: number;
    string: string;
};
export declare type ExprBool = {
    kind: 'bool';
    value: boolean;
};
export declare type ExprFunctioncall = {
    kind: 'functioncall';
    name: string;
    args: Expression[];
    infix: boolean;
};
