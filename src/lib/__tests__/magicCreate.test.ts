import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateListingCopy, MagicCreateError, serializeFacts, stripJsonFences } from '../magicCreate';

const RELAY_URL = 'https://res.zeroo.ch/res_api/claire/chat';

/** Minimal Gemini unary envelope around a model text part. */
function geminiOk(text: string): Response {
  return {
    ok: true,
    status: 200,
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  } as unknown as Response;
}

function relayFail(status: number, error?: string): Response {
  return {
    ok: false,
    status,
    json: async () => (error ? { error } : {}),
  } as unknown as Response;
}

const FACTS = { City: 'Winterthur', 'Object type': 'Apartment', Rooms: '4.5' };

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The parsed body of the single fetch call the helper makes. */
function sentBody(): Record<string, unknown> {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

describe('generateListingCopy request envelope', () => {
  it('posts the relay envelope without a model or context field', async () => {
    fetchMock.mockResolvedValue(geminiOk('{"title":"Bright flat","description":"Body."}'));

    await generateListingCopy(FACTS, 'en');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(RELAY_URL);
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    // No Authorization: the relay is origin-allowlisted, not token-gated.
    expect(init.headers).not.toHaveProperty('Authorization');

    const body = sentBody();
    expect(body.stream).toBe(false);
    // The relay picks the model chain the hub admin configured; a client-side
    // `model` would be ignored, and `context` would trigger market enrichment.
    expect(body).not.toHaveProperty('model');
    expect(body).not.toHaveProperty('context');
    expect(Object.keys(body).sort()).toEqual(['payload', 'stream']);
  });

  it('sends a JSON-schema-constrained payload with the facts and language', async () => {
    fetchMock.mockResolvedValue(geminiOk('{"title":"T","description":"D"}'));

    await generateListingCopy(FACTS, 'de');

    const payload = sentBody().payload as {
      systemInstruction: { parts: { text: string }[] };
      contents: { role: string; parts: { text: string }[] }[];
      generationConfig: Record<string, unknown>;
    };

    expect(payload.systemInstruction.parts[0].text).toContain('Write in German');
    expect(payload.systemInstruction.parts[0].text).not.toContain('{LANG}');
    expect(payload.contents).toHaveLength(1);
    expect(payload.contents[0].role).toBe('user');
    expect(payload.contents[0].parts[0].text).toContain('- City: Winterthur');

    expect(payload.generationConfig.temperature).toBe(0.7);
    // Gemini 3.x thinking tokens come out of this budget; 800 truncates.
    expect(payload.generationConfig.maxOutputTokens).toBe(2048);
    expect(payload.generationConfig.responseMimeType).toBe('application/json');
    expect(payload.generationConfig.responseSchema).toEqual({
      type: 'OBJECT',
      properties: { title: { type: 'STRING' }, description: { type: 'STRING' } },
      required: ['title', 'description'],
    });
  });

  it('passes the abort signal through to fetch', async () => {
    fetchMock.mockResolvedValue(geminiOk('{"title":"T","description":"D"}'));
    const ctrl = new AbortController();

    await generateListingCopy(FACTS, 'en', ctrl.signal);

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.signal).toBe(ctrl.signal);
  });
});

describe('generateListingCopy response handling', () => {
  it('parses a plain JSON candidate', async () => {
    fetchMock.mockResolvedValue(
      geminiOk('{"title":"Sunny 4.5 room flat","description":"Two paragraphs."}'),
    );

    await expect(generateListingCopy(FACTS, 'en')).resolves.toEqual({
      title: 'Sunny 4.5 room flat',
      description: 'Two paragraphs.',
    });
  });

  it('strips a markdown fence Gemini added despite responseMimeType', async () => {
    fetchMock.mockResolvedValue(
      geminiOk('```json\n{"title":"Fenced","description":"Still valid."}\n```'),
    );

    await expect(generateListingCopy(FACTS, 'en')).resolves.toEqual({
      title: 'Fenced',
      description: 'Still valid.',
    });
  });

  it('clamps an over-long title to 70 characters', async () => {
    const long = 'A'.repeat(120);
    fetchMock.mockResolvedValue(
      geminiOk(JSON.stringify({ title: long, description: 'Body.' })),
    );

    const copy = await generateListingCopy(FACTS, 'en');
    expect(copy.title).toHaveLength(70);
    expect(copy.title).toBe('A'.repeat(70));
  });

  it('clamps an over-long description to 4000 characters', async () => {
    fetchMock.mockResolvedValue(
      geminiOk(JSON.stringify({ title: 'T', description: 'B'.repeat(4500) })),
    );

    const copy = await generateListingCopy(FACTS, 'en');
    expect(copy.description).toHaveLength(4000);
  });

  it('rejects a candidate that is not valid JSON', async () => {
    fetchMock.mockResolvedValue(geminiOk('Here is your listing!'));

    await expect(generateListingCopy(FACTS, 'en')).rejects.toMatchObject({
      name: 'MagicCreateError',
      code: 'bad_json',
    });
  });

  it('rejects an empty candidate list', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ candidates: [] }),
    } as unknown as Response);

    await expect(generateListingCopy(FACTS, 'en')).rejects.toMatchObject({
      code: 'empty_response',
    });
  });
});

describe('generateListingCopy error mapping', () => {
  it('maps 429 to a retriable rate_limited error', async () => {
    fetchMock.mockResolvedValue(relayFail(429, 'rate_limited'));

    const err = await generateListingCopy(FACTS, 'en').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MagicCreateError);
    expect((err as MagicCreateError).code).toBe('rate_limited');
    expect((err as MagicCreateError).status).toBe(429);
    expect((err as MagicCreateError).terminal).toBe(false);
  });

  it('maps 424 to a TERMINAL all_models_failed error', async () => {
    fetchMock.mockResolvedValue(relayFail(424, 'all_models_failed'));

    const err = await generateListingCopy(FACTS, 'en').catch((e: unknown) => e);
    expect((err as MagicCreateError).code).toBe('all_models_failed');
    // The relay already walked its whole chain, so nothing may retry this
    // automatically.
    expect((err as MagicCreateError).terminal).toBe(true);
  });

  it('maps 403 and 503 to their relay codes', async () => {
    fetchMock.mockResolvedValueOnce(relayFail(403, 'forbidden_origin'));
    await expect(generateListingCopy(FACTS, 'en')).rejects.toMatchObject({
      code: 'forbidden_origin',
    });

    fetchMock.mockResolvedValueOnce(relayFail(503, 'claire_chat_unconfigured'));
    await expect(generateListingCopy(FACTS, 'en')).rejects.toMatchObject({
      code: 'claire_chat_unconfigured',
    });
  });

  it('falls back to request_failed on an unmapped status with a non-JSON body', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error('not json');
      },
    } as unknown as Response);

    await expect(generateListingCopy(FACTS, 'en')).rejects.toMatchObject({
      code: 'request_failed',
      status: 502,
    });
  });
});

describe('fact serialization', () => {
  it('emits "- key: value" lines and drops empty values', () => {
    expect(
      serializeFacts({ City: 'Bern', Rooms: '', Canton: '  BE  ', 'Year built': 1994 }),
    ).toBe('- City: Bern\n- Canton: BE\n- Year built: 1994');
  });
});

describe('stripJsonFences', () => {
  it('leaves unfenced JSON untouched', () => {
    expect(stripJsonFences('  {"a":1}  ')).toBe('{"a":1}');
  });

  it('unwraps both a labelled and a bare fence', () => {
    expect(stripJsonFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripJsonFences('```\n{"a":1}\n```')).toBe('{"a":1}');
  });
});
