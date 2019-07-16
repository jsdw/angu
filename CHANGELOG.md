# v0.10.1

## Additions

- Move examples out to their own folder, to make it easier to find the example you want.

# v0.10.0

## Additions

- Better, faster number parsing.
- Using `prepareContext` now leads to greater performance improvements, particularly
  when evaluating many small expressions using a single prepared context verses
  creating a new one every time.

## Breaking Changes

- Parse errors are now wrapped in a higher level error message to avoid returning
  often useless implementation details.

# v0.9.0

## Breaking Changes

- `Value.eval()` now returns undefined if `Value` is a variable which isn't
  in scope. It used to return the token name instead in this case, but this can
  now be obtained by using `Value.name()` in those cases where you'd want it.

# v0.8.0

## Additions

- `Values`, as given back to functions, now no longer expose the raw expression object
  but instead provide several methods to access useful information for them.
- Numeric parsing has been improved: exponents are now allowed, and slightly more
  flexibility around how decimal points are handled.

## Breaking Changes

- no more `.raw()` function is available on Values.

# v0.7.0

## Additions

- `.` is now a valid character to use as an operator.
- Numbers that end in `.` (eg "3.") will no longer consume the `.` on parsing, leaving it
  to potentially be parsed as an operator instead.
- Control flow examples have been added, and misc doc improvements.

# v0.6.0

## Additions

- Result returned from `evaluate` call now has convenience methods attached, rather
  than needing to use standalone methods provided to do the same
- `prepareContext` function added to allow state sharing across evaluate calls

## Breaking Changes

- `isOk` and `isErr` are no longer exported, but instead are available on the result
  of the `evaluate` call.

# v0.5.0

## Additions

- Angu now supports string literals [#3](https://github.com/jsdw/angu/pull/3)

# v0.4.0

## Breaking Changes

- Functions are now provided `Value`s, which can be evaluated using `.eval()`. This allows for
  lazy evaluation, and obtaining other information from `Value`s.

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