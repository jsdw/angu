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