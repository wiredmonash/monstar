/**
 * Narrow an unknown caught value to a human-readable message. Caught values are
 * typed `unknown` under strict mode, so this guards before reading `.message`.
 */
const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

export { getErrorMessage };
