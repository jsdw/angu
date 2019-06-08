export type Expression
    = ExprVariable
    | ExprNumber
    | ExprBool
    | ExprFunctioncall

export type ExprVariable = { kind: 'variable', name: string }
export type ExprNumber = { kind: 'number', value: number }
export type ExprBool = { kind: 'bool', value: boolean }
export type ExprFunctioncall = { kind: 'functioncall', name: string, args: Expression[], infix: boolean }