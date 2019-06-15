# Angu

A small library that can be used to implement and safely evaluate DSLs (Domain Specific Languages)
in the browser. You have complete control over every operation performed, and this library takes care of the
nitty gritty of the parsing and such.

Zero dependencies, and comes with typescript typings (usage optional).

We can use this to create a simple in-browser calculator to evaluate things like:

```
10 + 4 / 2 * (3 - 1)
```

Or we can use it to manipulate table cells by evaluating something like:

```
MEAN(A1:A5) + SUM(C1:D2) - 10
```

Or we can build a small expression-based language that looks like:

```
foo = 2;
bar = 4;
wibble = foo * bar + pow(2, 10);
foo + bar + wibble
```

Or a range of other things.

In each case, we define the operators (optionally with precedence and associativity) and functions available
to the program and exactly what they do with their arguments, and this library takes care of the rest.

[Complete examples can be found here](https://github.com/jsdw/angu/blob/master/src/index.test.ts).

# Installation

You can install the latest release from `npm`:

```
npm install angu
```

# Basic Usage

First, you define a `Context` which determines how expressions will be evaluated. For a simple calculator,
we might define something like the following:

```
import { evaluate } from 'angu'

const ctx = {
    // We provide these operators:
    scope: {
        '-': (a, b) => a.eval() - b.eval(),
        '+': (a, b) => a.eval() + b.eval(),
        '/': (a, b) => a.eval() / b.eval(),
        '*': (a, b) => a.eval() * b.eval(),
    },
    // And define the precedence to be as expected:
    precedence: [
        ['/', '*'],
        ['-', '+']
    ]
}
```

Then, you can evaluate expressions in this context:

```
const r1 = evaluate('2 + 10 * 4', ctx)
assert.equal(r1.value, 42)
```

If something goes wrong evaluating the provided string, an error will be returned. All errors returned
contain position information (`{ pos: { start, end} }`) describing the beginning and end of the string
that contains the error. Specific errors contain other information depending on their `kind`.

[More examples can be found here](https://github.com/jsdw/angu/blob/master/src/index.test.ts).

# Details

## Primitives

Angu supports the following literals:

- booleans ('true' or 'false')
- basic numbers (eg `+1.2`, `-3`, `100`, `10.23`, `-100.4`). Numbers have a string version of themselves stored
  (as well as a numeric one) so that we can wrap things like big number libraries if we like.
- strings (strings can be surrounded in ' or ", \'s inside a string escape the delimiter and themselves)

Otherwise, it relies on operators and function calls to transform and manipulate them.

## Operators

Any of the following characters can be used to define an operator:

```
!£$%^&*@#~?<>|/+=;:.-
```

Operators can be binary (taking two arguments) or unary.

Operators not defined in scope will not be parsed. This allows the parser to properly handle multiple operators without any
spaces separating them; it knows exactly what to look out for.

## Functions/variables

Functions/variables must start with an ascii character, and can then contain an ascii letter, number or underscore.

If you'd like to use a function as an operator, prefix it with a single quote `'`. Some valid function calls:

```
foo()
foo(bar)
foo(1,2)
1 `foo` 2
```

If the variable you ask for is not found in the `scope` object, the evaluator will return the string name of the
variable to the function/operator that's using it. This allows us to treat variables as basic string tokens when
there is no other sensible way of treating them.

All values passed to functions on scope have the `Value` type. One can call `.eval()` on them to evaluate them and
return the value that that results in. Some other methods are also available:

- `Value.kind()`: Return the kind of the Value ("string" | "number" | "variable" | "bool" | "functioncall").
- `Value.pos()`: Return the start and end index of the original input string that represent this Value.
- `Value.toString()`: (or `String(Value)`) gives back a string representation of the value, useful for debugging.
- `Value.name()`: Gives back the "name" of the value. This is the function/variable name if applicable, else
  true/false for bools, the string contents for strings, or the numeric representation for numbers.

