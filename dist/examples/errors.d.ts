/**
 * Failure to evaluate results in an error. Errors all have a `kind`,
 * and we can use TypeScript to ensure that we have handled every possible
 * error (and prove what error information is available) by matching on
 * this kind. All errors have a `pos.start` and `pos.end`. See `errors.ts`
 * for all of the possible types of error that can be given back.
 */
export default function errorMessages(): void;
