// "Magic fill" listing copy: turns the structured facts of a publish draft
// into a portal-quality title + description.
//
// The request goes through the suite's Claire relay on RES
// (res.zeroo.ch/res_api/claire/chat), which holds the Gemini key server-side —
// nothing secret ships in the bundle, and no Authorization header is needed
// (the relay is origin-allowlisted: *.aireon.ch, *.vercel.app, localhost).
//
// Deliberately NOT built on the shared `generateParcelChatReply`: that helper
// hard-wires the Claire chat persona and the ```aireon:card protocol, which is
// exactly the wrong shape for listing copy. This module owns its own system
// prompt and asks Gemini for schema-constrained JSON instead.

/** RES Claire relay. Same endpoint the assistant uses, different payload. */
const RELAY_URL = 'https://res.zeroo.ch/res_api/claire/chat';

/** IDX 3.01 caps, mirrored from the publish form so a long generation can
 *  never produce copy the export would silently truncate. */
const TITLE_MAX = 70;
const DESCRIPTION_MAX = 4000;

export type MagicCreateLang = 'en' | 'de' | 'fr' | 'it';

const LANGUAGE_NAMES: Record<MagicCreateLang, string> = {
  en: 'English',
  de: 'German',
  fr: 'French',
  it: 'Italian',
};

export type MagicCreateErrorCode =
  | 'forbidden_origin'
  | 'rate_limited'
  | 'claire_chat_unconfigured'
  | 'all_models_failed'
  | 'request_failed'
  | 'empty_response'
  | 'bad_json';

/** Relay/parse failure with a machine-readable code the UI maps to copy. */
export class MagicCreateError extends Error {
  readonly code: MagicCreateErrorCode;
  /** HTTP status when the failure came off the wire, else null. */
  readonly status: number | null;
  /**
   * True when repeating the identical request cannot help. `all_models_failed`
   * means the relay already walked its whole Gemini fallback chain, so an
   * automatic retry would just burn another rate-limit slot — the UI offers a
   * manual "try again" instead.
   */
  readonly terminal: boolean;

  constructor(
    code: MagicCreateErrorCode,
    message: string,
    status: number | null = null,
    terminal = false,
  ) {
    super(message);
    this.name = 'MagicCreateError';
    this.code = code;
    this.status = status;
    this.terminal = terminal;
  }
}

export interface ListingCopy {
  title: string;
  description: string;
}

/** Known relay statuses, mapped to codes the UI can branch on. */
function codeForStatus(status: number): { code: MagicCreateErrorCode; terminal: boolean } {
  switch (status) {
    case 403:
      return { code: 'forbidden_origin', terminal: true };
    case 429:
      // Per-IP budget (30/min) shared with the Claire assistant. Retriable,
      // but only after a pause — the UI says so rather than hammering.
      return { code: 'rate_limited', terminal: false };
    case 424:
      return { code: 'all_models_failed', terminal: true };
    case 503:
      return { code: 'claire_chat_unconfigured', terminal: true };
    default:
      return { code: 'request_failed', terminal: false };
  }
}

async function relayError(res: Response): Promise<MagicCreateError> {
  const { code, terminal } = codeForStatus(res.status);
  let detail = '';
  try {
    const body = (await res.json()) as { error?: unknown } | null;
    if (body && typeof body.error === 'string') detail = body.error;
  } catch {
    // Non-JSON error body (gateway HTML, empty 502) — the status carries
    // enough signal on its own.
  }
  return new MagicCreateError(
    code,
    `Claire relay request failed (${res.status}${detail ? `: ${detail}` : ''})`,
    res.status,
    terminal,
  );
}

/**
 * The listing-copy brief. English regardless of the output language (the model
 * follows instructions best in English), with the target language substituted
 * in. The grounding rules are last on purpose: they are the ones that must win
 * when the model is tempted to write nice-sounding copy about facts it does
 * not have.
 */
function systemPrompt(lang: MagicCreateLang): string {
  return `You write Swiss real-estate listing copy for property portals (ImmoScout24, Homegate, newhome, Flatfox).

Return ONLY a JSON object matching the supplied schema. No text outside the JSON, no markdown fences.

The "title" field:
- at most 70 characters
- no street address, no price, no emoji
- concrete and specific about what the property is, never an empty slogan

The "description" field:
- between 700 and 1400 characters
- plain text only: no markdown, no bullet points, no headings, no asterisks
- short paragraphs separated by a blank line
- end with a neutral invitation to get in touch or arrange a viewing

Grounding rules, which override everything above:
- Ground EVERY claim in the facts given in the user message.
- Never invent rooms, construction year, surfaces, volumes, floors, amenities, views, renovations, or price.
- If a fact is missing, leave the topic out. Never guess, never write a placeholder.
- Do not state a price and do not state a street address anywhere.

Write in {LANG}, using the wording and conventions of that language as it is used in Switzerland.
Never use em dashes; use commas, colons, or parentheses instead.`.replace(
    '{LANG}',
    LANGUAGE_NAMES[lang],
  );
}

/** Facts as "- key: value" lines. Empty values are dropped rather than sent as
 *  blanks: a fact the model never sees cannot be hallucinated back. */
export function serializeFacts(facts: Record<string, string | number>): string {
  return Object.entries(facts)
    .map(([key, value]) => [key, typeof value === 'number' ? String(value) : value.trim()] as const)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n');
}

/**
 * Gemini still fences JSON now and then despite responseMimeType, so unwrap a
 * leading ```json / ``` block before parsing. Suite precedent — cheap here,
 * and the alternative is a hard parse failure on a perfectly good response.
 */
export function stripJsonFences(raw: string): string {
  const text = raw.trim();
  if (!text.startsWith('```')) return text;
  return text
    .replace(/^```[a-zA-Z0-9_-]*[ \t]*\r?\n?/, '')
    .replace(/\r?\n?```[\s]*$/, '')
    .trim();
}

/** Collapse a candidate's parts into one string (Gemini may split them). */
function candidateText(data: unknown): string {
  const candidates = (data as { candidates?: unknown })?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) return '';
  const parts = (candidates[0] as { content?: { parts?: unknown } })?.content?.parts;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => (part as { text?: unknown })?.text)
    .filter((text): text is string => typeof text === 'string')
    .join('')
    .trim();
}

/**
 * Generate a listing title and description from the draft's structured facts.
 *
 * The relay applies the hub admin's configured Gemini model chain server-side,
 * so no `model` travels in the envelope; `context` is omitted too, which skips
 * the relay's market enrichment (irrelevant for copywriting, and it would put
 * unvetted figures in front of a model told to invent nothing).
 */
export async function generateListingCopy(
  facts: Record<string, string | number>,
  lang: MagicCreateLang,
  signal?: AbortSignal,
): Promise<ListingCopy> {
  const body = {
    stream: false,
    payload: {
      systemInstruction: { parts: [{ text: systemPrompt(lang) }] },
      contents: [{ role: 'user', parts: [{ text: serializeFacts(facts) }] }],
      generationConfig: {
        temperature: 0.7,
        // The 3.x flash models spend hidden "thinking" tokens out of this same
        // budget. 800 truncates mid-JSON (the suite learned this the hard way);
        // 2048 leaves room for the reasoning pass plus a 1400-character body.
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            description: { type: 'STRING' },
          },
          required: ['title', 'description'],
        },
      },
    },
  };

  const res = await fetch(RELAY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) throw await relayError(res);

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new MagicCreateError('bad_json', 'Claire relay returned a non-JSON body', res.status);
  }

  const text = candidateText(data);
  if (text === '') {
    throw new MagicCreateError('empty_response', 'Claire relay returned no listing copy');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripJsonFences(text));
  } catch {
    throw new MagicCreateError('bad_json', 'Generated listing copy was not valid JSON');
  }

  const { title, description } = (parsed ?? {}) as { title?: unknown; description?: unknown };
  if (typeof title !== 'string' || typeof description !== 'string') {
    throw new MagicCreateError('bad_json', 'Generated listing copy is missing title or description');
  }

  // Clamp rather than reject: an over-long generation is still good copy, and
  // the IDX record builder would cut it at exactly these lengths anyway.
  return {
    title: title.trim().slice(0, TITLE_MAX).trim(),
    description: description.trim().slice(0, DESCRIPTION_MAX).trim(),
  };
}
