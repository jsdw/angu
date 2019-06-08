export type Expression
    = { kind: 'binaryOp', op: string, left: Expression, right: Expression }
    | { kind: 'unaryOp', op: string, expr: Expression }
    | { kind: 'variable', name: string }
    | { kind: 'number', value: number }
    | { kind: 'bool', value: boolean }
    | { kind: 'functioncall', name: string, args: Expression[] }
