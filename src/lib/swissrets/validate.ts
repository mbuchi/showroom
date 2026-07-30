// Client-side validation of a SwissRETS inventory against the official
// JSON Schema 3.6.0, using the validator shipped by @qualipool/swissrets-json.
//
// The import is dynamic on purpose: that package bundles Ajv 2020 plus
// ajv-formats and lodash, roughly a third of a megabyte that has no business
// in the eager app bundle. Keeping it behind `await import()` puts it in its
// own lazy chunk, fetched the first time somebody exports.

/** Short, human-readable validation result. `errors` is empty when valid. */
export interface SwissRetsValidationResult {
  valid: boolean;
  errors: string[];
}

interface AjvLikeError {
  instancePath?: string;
  message?: string;
}

type ValidateFn = (inventory: unknown) => AjvLikeError[];

interface ValidatorModule {
  validateSwissRets?: ValidateFn;
  default?: { validateSwissRets?: ValidateFn };
}

/** "/properties/0/type: must be equal to one of the allowed values" */
function describe(error: AjvLikeError): string {
  const path = error.instancePath && error.instancePath.length > 0 ? error.instancePath : '/';
  return `${path}: ${error.message ?? 'invalid'}`;
}

/**
 * Validates the inventory. Never throws: the export must not be blocked by a
 * failure of the validator itself, so an unreachable or broken validator is
 * reported as valid rather than as a data problem the user cannot act on.
 */
export async function validateSwissRetsInventory(
  inventory: Record<string, unknown>,
): Promise<SwissRetsValidationResult> {
  try {
    // Cast: the package types the inventory as its own generated model, which
    // this loosely-typed builder output is structurally compatible with but
    // does not nominally match.
    const mod = (await import('@qualipool/swissrets-json')) as unknown as ValidatorModule;
    // CommonJS package: depending on the interop path the named export lands
    // on the namespace or on `default`.
    const validate = mod.validateSwissRets ?? mod.default?.validateSwissRets;
    if (typeof validate !== 'function') {
      console.warn(
        '[swissrets] @qualipool/swissrets-json exposes no validateSwissRets function; export not validated',
      );
      return { valid: true, errors: [] };
    }

    const errors = validate(inventory);
    if (!Array.isArray(errors) || errors.length === 0) return { valid: true, errors: [] };
    return { valid: false, errors: errors.map(describe) };
  } catch (cause) {
    // Deliberately not silent: the export still proceeds, but a broken or
    // unreachable validator has to be visible somewhere.
    console.warn('[swissrets] validation could not run; export not validated', cause);
    return { valid: true, errors: [] };
  }
}
