export type Expression
    = { kind: 'binaryOp', op: string, left: Expression, right: Expression }
    | { kind: 'unaryOp', op: string, expr: Expression }
    | { kind: 'variable', name: string }
    | { kind: 'number', number: number }
    | { kind: 'functioncall', name: string, args: Expression[] }
