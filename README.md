# Angu

A small library that can be used to implement and safely evaluate DSLs (Domain Specific Languages)
in the browser or in NodeJS. You have complete control over every operation performed, and this library
takes care of the nitty gritty of the parsing and such.

Zero dependencies, and comes with javascript typings (usage optional).

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

[Complete examples can be found here][examples].

# Installation

You can install the latest release from `npm`:

```
npm install angu
```

# Basic Usage

First, you define a `Context` which determines how expressions will be evaluated. For a simple calculator,
we might define something like the following:

```javascript
import { evaluate } from 'angu'

const ctx = {
    // We provide these operators:
    scope: {
        '-': (a, b) => a.eval() - b.eval(),
        '+': (a, b) => a.eval() + b.eval(),
        '/': (a, b) => a.eval() / b.eval(),
        '*': (a, b) => a.eval() * b.eval(),
    },
    // And define the precedence to be as expected
    // (first in array => evaluated first)
    precedence: [
        ['/', '*'],
        ['-', '+']
    ]
}
```

Then, you can evaluate expressions in this context:

```javascript
const r1 = evaluate('2 + 10 * 4', ctx)
assert.equal(r1.value, 42)
```

We can also provide locals at eval time:

```javascript
const r1 = evaluate('2 + 10 * four', ctx, { four: 4 })
assert.equal(r1.value, 42)
```

If something goes wrong evaluating the provided string, an error will be returned. All errors returned
contain position information (`{ pos: { start, end}, ... }`) describing the beginning and end of the
string that contains the error. Specific errors contain other information depending on their `kind`.

[More examples can be found here][examples].

# Details

## Primitives

Angu supports the following literals:

- booleans ('true' or 'false')
- numbers (eg `+1.2`, `-3`, `.9`, `100`, `10.23`, `-100.4`, `10e2`). Numbers have a string version of themselves stored
  (as well as a numeric one) so that we can wrap things like big number libraries if we like. The string version
  applies some normalisation which can help other libraries consume the numbers:
  - The exponent is normalised to a lowercase 'e'.
  - Leading '+' is removed.
  - A decimal point, if provided, is always prefixed with a number ('0' if no number is given)
- strings (strings can be surrounded in `'` or `"`, and `\`'s inside a string escape the delimiter and themselves)

Otherwise, it relies on operators and function calls to transform and manipulate them.

## Operators

Any of the following characters can be used to define an operator:

```
!£$%^&*@#~?<>|/+=;:.-
```

Operators can be binary (taking two arguments) or unary. Unary operators cannot have a space between themselves and the
expression that they are operating on.

Operators not defined in scope will not be parsed. This helps the parser properly handle multiple operators (eg binary
and unary ops side by side), since it knows what it is looking for.

Some valid operator based function calls (assuming the operators are in scope):

```javascript
1+2/3
1 + 2
1 + !2
```

## Functions/variables

Functions/variables must start with an ascii letter, and can then contain an ascii letter, number or underscore.

Some valid function calls:

```javascript
foo()
foo(bar)
foo(1,2)
```

If the function takes exactly two arguments, and is also listed in the precedence list, it can be used infix
too, like so:

```
1 foo 2
```

All values passed to functions on scope have the `Value` type. One can call `.eval()` on them to evaluate them and
return the value that that results in. Some other methods are also available:

- `Value.kind()`: Return the kind of the Value (`"string" | "number" | "variable" | "bool" | "functioncall"`).
- `Value.pos()`: Return the start and end index of the original input string that this Value was parsed from.
- `Value.toString()`: (or `String(Value)`) gives back a string representation of the value, useful for debugging.
- `Value.name()`: Gives back the "name" of the value. This is the function/variable name if applicable, else
  true/false for bools, the string contents for strings, or the numeric representation for numbers.

See the [examples][examples] for more, particularly `workingWithVariables.ts`.

[examples]: https://github.com/jsdw/angu/blob/master/src/examples
