# v0.3.0

## Additions

- Ops are now parsed based on what is provided in scope, so invalid ops will not parse, and valid
  ops can parse unambiguously even when no spaces separate them.
- All errors now contain consistent position information.

## Breaking Changes

- The type of error returned as aa result of an invalid op being used is now a parse error rather
  than an evaluation error.

# v0.2.1

## Bug Fixes

- Unary ops now parse after numbers in order to avoid conflicts with parsing '-'/'+' on numbers.

## Breaking Changes

- Infix functions are now surrounded in backticks, to free up single quotes for future usage.

# v0.2.0

## Additions

- Error information is now fed back at every stage [#1](https://github.com/jsdw/angu/pull/1)
- No more throwing [#1](https://github.com/jsdw/angu/pull/1)
- Misc other fixes and tweaks

## Breaking Changes

- To use a function as an infix op, it should now be prefixed with `'` instead of `:`.

# v0.1.0

Initial release