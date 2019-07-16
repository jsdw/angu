/**
 * We can use a prepared `Context` to share state between successive evaluate
 * calls. This allows us to piece together multiple expressions if we like.
 *
 * This also improves performance, as the context needs to be prepared
 * before it can be used, and so doing it once before all uses is more efficient
 * than having it done implicitly for every use if it's not been prepared.
 */
export default function prepareContext(): void;
