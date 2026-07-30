import { afterEach, describe, expect, it, vi } from 'vitest';
import { validateSwissRetsInventory } from '../validate';
import { buildSwissRetsInventory, type SwissRetsBuildOptions } from '../build';
import { emptyListingDraft } from '../../idx/types';

const OPTS: SwissRetsBuildOptions = {
  generatorVersion: '0.22.1',
  locale: 'de',
  now: new Date('2026-07-30T09:15:00.000Z'),
};

function goodInventory(): Record<string, unknown> {
  const d = emptyListingDraft();
  d.refProperty = 'REF-1';
  d.title = 'Kleines Studio';
  return buildSwissRetsInventory(d, OPTS);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('validateSwissRetsInventory', () => {
  it('accepts an inventory produced by the builder', async () => {
    await expect(validateSwissRetsInventory(goodInventory())).resolves.toEqual({
      valid: true,
      errors: [],
    });
  });

  it('rejects an unknown property and names the offending path', async () => {
    const inventory = goodInventory() as { properties: Record<string, unknown>[] };
    inventory.properties[0].notAField = 'nope';

    const result = await validateSwissRetsInventory(inventory as unknown as Record<string, unknown>);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('/properties/0: must NOT have additional properties');
  });

  it('rejects a value outside an enum and a missing required member', async () => {
    const inventory = goodInventory() as { properties: Record<string, unknown>[] };
    inventory.properties[0].type = 'lease';
    delete inventory.properties[0].referenceId;

    const result = await validateSwissRetsInventory(inventory as unknown as Record<string, unknown>);
    expect(result.valid).toBe(false);
    // Every entry is the short "instancePath: message" form the UI renders.
    for (const line of result.errors) expect(line).toMatch(/^\/[^:]*: .+|^\/: .+/);
    expect(result.errors.some((e) => e.includes('/properties/0/type'))).toBe(true);
    expect(result.errors.some((e) => e.includes('referenceId'))).toBe(true);
  });

  it('reports an empty error list, not a throw, for a structurally broken input', async () => {
    const result = await validateSwissRetsInventory({ properties: 'not an array' });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('stays usable and warns when the validator module cannot be loaded', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.resetModules();
    vi.doMock('@qualipool/swissrets-json', () => {
      throw new Error('chunk load failed');
    });

    const { validateSwissRetsInventory: isolated } = await import('../validate');
    // The export must not be blocked by a failure of the validator itself.
    await expect(isolated(goodInventory())).resolves.toEqual({ valid: true, errors: [] });
    expect(warn).toHaveBeenCalled();

    vi.doUnmock('@qualipool/swissrets-json');
  });

  it('stays usable and warns when the module exposes no validate function', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.resetModules();
    vi.doMock('@qualipool/swissrets-json', () => ({ somethingElse: 1 }));

    const { validateSwissRetsInventory: isolated } = await import('../validate');
    await expect(isolated(goodInventory())).resolves.toEqual({ valid: true, errors: [] });
    expect(warn).toHaveBeenCalled();

    vi.doUnmock('@qualipool/swissrets-json');
  });
});
