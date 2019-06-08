# Calc.js

A simple, versatile DSL that can be used for safely evaluating snippets of code in-browser.
This makes it simple to evaluate expressions consisting of numbers, booleans, tokens,
functions and operators (with the ability to define associativity and precedence).

Despite having no built in assignment, or even supporting multiple expressions, we can
evaluate expressions like:

```
foo = 2;
bar = 4;
wibble = foo * bar + pow(2, 10);
foo + bar + wibble
```

Where every operator (including `;` and `=`) and function is defined to do exactly as you wish,
allowing you to provide anything from a tiny subset of possible operations to a more fully featured
DSL/proto-language. The evaluation is completely sandboxed and can only run functions that you explicitly
provide to the interpreter.

More examples can be found [here](https://github.com/jsdw/calcjs/blob/master/src/index.test.ts).

# Installation

You can install the latest release directly from github using `npm`:

```
npm install jsdw/calcjs#v0.1.0
```

# Details

## Operators

Any of the following characters can be used to define an operator:

```
!£$%^&*@#~?<>|/\+=;-
```

Operators can be binary (taking two arguments) or unary.

## Functions/variables

Functions/variables must start with an ascii character, and can then contain an ascii letter, number or underscore.

If you'd like to use a function as an operator, prefix it with `:`.


