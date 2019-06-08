export type Expression
    = ExprBinaryOp
    | ExprUnaryOp
    | ExprVariable
    | ExprNumber
    | ExprBool
    | ExprFunctioncall

export type ExprBinaryOp = { kind: 'binaryOp', op: string, left: Expression, right: Expression }
export type ExprUnaryOp = { kind: 'unaryOp', op: string, expr: Expression }
export type ExprVariable = { kind: 'variable', name: string }
export type ExprNumber = { kind: 'number', value: number }
export type ExprBool = { kind: 'bool', value: boolean }
export type ExprFunctioncall = { kind: 'functioncall', name: string, args: Expression[] }