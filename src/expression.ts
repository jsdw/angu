import { Pos } from "./libparser";

export type Expression
    = ExprVariable
    | ExprNumber
    | ExprBool
    | ExprFunctioncall
    | ExprString

export type ExprVariable = { kind: 'variable', name: string, pos: Pos }
export type ExprNumber = { kind: 'number', value: number, string: string, pos: Pos }
export type ExprBool = { kind: 'bool', value: boolean, pos: Pos }
export type ExprFunctioncall = { kind: 'functioncall', name: string, args: Expression[], infix: boolean, pos: Pos}
export type ExprString = { kind: 'string', value: string, pos: Pos }
