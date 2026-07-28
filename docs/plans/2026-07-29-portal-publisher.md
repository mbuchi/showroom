# Portal Publisher (IDX 3.01 export) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A new `/publish` page in showroom that turns a Swiss property (parcel prefill + user form + gallery images) into a validated IDX 3.01 export package that agencies can upload to ImmoScout24 / Homegate (SMG gateway), newhome, and Flatfox.

**Architecture:** A pure-TypeScript IDX 3.01 engine (`src/lib/idx/`) builds, validates, and serializes the 183-field `#`-delimited `unload.txt` (ISO-8859-1 + CRLF) and packages it with converted JPEG images into a ZIP mirroring the portal FTP layout (`data/unload.txt` + `images/`). A React page (`src/components/publish/`) provides the listing form (parcel-prefilled), a gallery image picker, a live validation panel, export actions, and per-portal connection guidance. No backend changes; FTP push and the Flatfox REST relay are explicitly out of scope for this MVP.

**Tech Stack:** Vite + React 18 + TS + Tailwind (dark, cyan accent), `fflate` (new dep) for ZIP, existing `imageService` / `parcelInfo` / i18n / router / signal infrastructure.

## Why IDX 3.01 (research summary)

- ImmoScout24.ch + Homegate.ch (both SMG) have **no public REST API**; professional listings arrive via the SMG feed: IDX 3.01 `unload.txt` + assets over FTP (`ftp.homegate.ch/<agency_id>/{data,images,movies,doc}`), credentials issued only with an SMG pro contract. Batch runs ~3x/day.
- newhome.ch (FLEX accounts) and Flatfox also accept IDX 3.01 (Flatfox even via `POST /api/v1/idx-listing/`).
- FTP is impossible from a browser; portal API keys must not ship in a SPA. Therefore the correct client-side deliverable is a **validated IDX package generator + download**, with the record/package format exactly per the official spec (homegate `idx-format-v3.01_v015.xls`).
- Spec hard rules: field delimiter `#` (forbidden in content), 183 fields per record (0-182) + trailing `#`, one record per line, CRLF, ISO-8859-1, no header line, filename charset restrictions, pictures jpg/jpeg/gif ≤5 MB, ≤13 pictures, "full load" semantics (each upload replaces the whole ad set).

## Global Constraints

- Suite copy rules: **no em-dashes** in any user-facing copy; **US English** for `en`; PR title/body in English.
- All four locales (`en`, `fr`, `de`, `it`) must get every new i18n key (flat dot-keys in `src/contexts/I18nContext.tsx`, one object per locale).
- Release/version lockstep: bump **three** files together: `package.json` (0.20.3 → 0.21.0), `src/data/releaseNotes.ts` top entry `version: '0.21.0'`, `src/data/releaseMeta.ts` `CURRENT_VERSION = '0.21.0'` (releaseMeta is currently stale at 0.20.1 - the lockstep test on main is red; this bump heals it). Use `kind: 'new'` (canonical ChangeKind), not `'added' as ChangeKind`.
- Subagents: **Commit only - do NOT push, open a PR, or merge.** The controller runs reviews and publishes after. Work on branch `feat/portal-publisher`. Stage only your own named paths (`git add <path>`), never `-A`. Prefix git commands with `cd /Users/joe/Documents/local_dev/swissnovo/showroom`.
- React Compiler is on (`babel-plugin-react-compiler`, target 18): keep components compiler-friendly (no conditional hooks, build arrays at call time not module scope for DOM-probing code).
- Skeletons over spinners for content areas with fixed final layout; no native `confirm()` (inline confirm pattern instead).
- Icons: `lucide-react` only.

---

## Foundation (done by controller before dispatch; described for context)

`fflate` added as an explicit dependency. Two contract files exist and compile:

### `src/lib/idx/types.ts` (the shared contract - do not change signatures)

```ts
export type OfferType = 'RENT' | 'SALE';
export type ObjectCategory =
  | 'APPT' | 'HOUSE' | 'PROP' | 'PARK' | 'INDUS'
  | 'GASTRO' | 'AGRI' | 'GARDEN' | 'SECONDARY';
export type PriceUnit = 'SELL' | 'SELLM2' | 'YEARLY' | 'M2YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';
/** IDX tri-state boolean: '' = unknown/no statement, 'Y' / 'N' explicit. */
export type YesNo = '' | 'Y' | 'N';

export interface ListingImageRef {
  savedImageId: number;
  publicUrl: string;
  /** Sanitized unique filename ending in .jpg (set by the image picker). */
  filename: string;
  title: string;
}

export interface ListingFeatures {
  view: YesNo; fireplace: YesNo; cabletv: YesNo; elevator: YesNo;
  childFriendly: YesNo; parking: YesNo; garage: YesNo; balcony: YesNo;
  wheelchair: YesNo; animalAllowed: YesNo; newBuilding: YesNo; oldBuilding: YesNo;
  swimmingpool: YesNo; minergieGeneral: YesNo; minergieCertified: YesNo;
}

/** All numeric-ish fields are kept as raw form strings; the engine digit-cleans them. */
export interface ListingDraft {
  offerType: OfferType;
  category: ObjectCategory;
  objectType: number | null;
  refProperty: string;
  street: string;
  zip: string;
  city: string;
  canton: string;
  country: string;
  situation: string;
  lat: number | null;
  lng: number | null;
  title: string;
  description: string;
  availableFrom: string;
  url: string;
  sellingPrice: string;
  rentNet: string;
  rentExtra: string;
  priceUnit: PriceUnit | '';
  currency: string;
  floor: string;
  rooms: string;
  apartments: string;
  surfaceLiving: string;
  surfaceProperty: string;
  surfaceUsable: string;
  volume: string;
  yearBuilt: string;
  yearRenovated: string;
  numberOfFloors: string;
  features: ListingFeatures;
  agencyId: string;
  agencyName: string;
  agencyReference: string;
  agencyPhone: string;
  agencyEmail: string;
  visitName: string;
  visitPhone: string;
  visitRemark: string;
  images: ListingImageRef[];
}

export type IdxIssueSeverity = 'error' | 'warning';
export interface IdxIssue {
  severity: IdxIssueSeverity;
  /** Draft field the issue anchors to (for form highlighting), e.g. 'title'. */
  field: string;
  /** i18n key under page.publish.issue.* */
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface PreparedImage { filename: string; data: Uint8Array }

export function emptyListingDraft(): ListingDraft { /* returns all-'' draft with
  offerType 'SALE', category 'APPT', objectType 1, country 'CH', currency 'CHF',
  priceUnit '', features all '', images [] */ }
```

### `src/lib/idx/codes.ts` (generated from the official spec)

```ts
export interface ObjectTypeCode { code: number; de: string; fr: string; it: string; en: string }
export const OBJECT_CATEGORY_LABELS: Record<ObjectCategory, { de; fr; it; en: string }>;
export const OBJECT_TYPE_CODES: Record<ObjectCategory, ObjectTypeCode[]>;
export function objectTypeLabel(category: ObjectCategory, code: number, locale: string): string;
```

Full official tables (APPT 1-11, HOUSE 1-13 no 8, INDUS 1-38, PARK 1-12 no 6, PROP 1-4, GASTRO 1-17, AGRI 1-3, GARDEN 0, SECONDARY 0-2) with the spec's own DE/FR/IT/EN wording.

Stub files `record.ts`, `latin1.ts`, `validate.ts`, `package.ts`, `imagePrep.ts` exist with the exact signatures below and placeholder bodies, so the UI task compiles and renders before the engine task lands. **Task 1 replaces the stub bodies.**

---

### Task 1: IDX engine (record builder, Latin-1, validation, ZIP packaging) - `src/lib/idx/`

**Files:**
- Rewrite (stubs → real): `src/lib/idx/record.ts`, `src/lib/idx/latin1.ts`, `src/lib/idx/validate.ts`, `src/lib/idx/package.ts`, `src/lib/idx/imagePrep.ts`
- Test: `src/lib/idx/__tests__/record.test.ts`, `src/lib/idx/__tests__/latin1.test.ts`, `src/lib/idx/__tests__/validate.test.ts`
- Do NOT touch: `types.ts`, `codes.ts`, anything outside `src/lib/idx/`.

**Interfaces (Produces - the UI consumes exactly these):**

```ts
// record.ts
export const IDX_FIELD_COUNT = 183;
export const IDX_MAX_PICTURES = 13;
export function buildIdxFields(draft: ListingDraft, opts: { senderId: string; lastModified: Date }): string[];
export function serializeUnload(rows: string[][]): string;      // each row joined with '#', trailing '#', '\r\n' after every record
export function sanitizeIdxText(input: string, maxLen: number): string;
export function digitsOnly(input: string): string;              // '' stays ''
export function formatIdxDate(d: Date): string;                 // DD.MM.YYYY
export function formatIdxDateTime(d: Date): string;             // DD.MM.YYYY HH:mm:ss (24h)

// latin1.ts
export function transliterate(text: string): string;            // maps outside-Latin-1 to Latin-1 equivalents
export function encodeLatin1(text: string): Uint8Array;         // transliterate() first, then bytes; unmappable → '?'
export function sanitizeIdxFilename(name: string): string;

// validate.ts
export function validateDraft(draft: ListingDraft): IdxIssue[];

// package.ts
export function buildUnloadBytes(draft: ListingDraft, opts: { senderId: string; lastModified: Date }): Uint8Array;
export function buildIdxPackage(args: { unload: Uint8Array; images: PreparedImage[]; readme: string }): Blob;
  // ZIP (fflate zipSync): 'data/unload.txt', 'images/<filename>' each, 'README.txt' (readme UTF-8)

// imagePrep.ts
export async function prepareListingImages(
  refs: ListingImageRef[],
  getAuthHeader: () => Promise<string | null>,
): Promise<{ prepared: PreparedImage[]; failedFilenames: string[] }>;
```

**Field mapping (exact, authoritative - `buildIdxFields` returns `string[183]`, index = IDX field):**

| Idx | Value |
|---|---|
| 0 | `'IDX3.01'` |
| 1 | `opts.senderId` |
| 2 | `draft.category` |
| 3 | `draft.objectType == null ? '' : String(draft.objectType)` |
| 4 | `draft.offerType` |
| 5 | `sanitizeIdxText(draft.refProperty, 80)` |
| 6, 7 | `''` (ref_house / ref_object; refProperty carries the unique key) |
| 8 | `sanitizeIdxText(draft.street, 200)` |
| 9 | `sanitizeIdxText(draft.zip, 10)` |
| 10 | `sanitizeIdxText(draft.city, 200)` |
| 11 | `draft.canton.toUpperCase()` (2 chars max, letters only) |
| 12 | `draft.country.toUpperCase()` |
| 13 | `''` |
| 14 | `sanitizeIdxText(draft.situation, 50)` |
| 15 | `draft.availableFrom` (already DD.MM.YYYY or '') |
| 16 | `sanitizeIdxText(draft.title, 70)` |
| 17 | `sanitizeIdxText(draft.description, 4000)` |
| 18 | SALE: `digitsOnly(sellingPrice)`; RENT: gross = net + extra when net present (numeric add, else `''`) |
| 19 | RENT: `digitsOnly(rentNet)`; SALE: `''` |
| 20 | RENT: `digitsOnly(rentExtra)`; SALE: `''` |
| 21 | `draft.priceUnit` (may be '') |
| 22 | `draft.currency.toUpperCase()` |
| 23 | `''` |
| 24 | `draft.floor.trim()` (allow leading `-`; digits; '' passes through) |
| 25 | `draft.rooms.trim()` (allow one decimal, e.g. `3.5`) |
| 26 | `digitsOnly(draft.apartments)` |
| 27 | `digitsOnly(draft.surfaceLiving)` |
| 28 | `digitsOnly(draft.surfaceProperty)` |
| 29 | `digitsOnly(draft.surfaceUsable)` |
| 30 | `digitsOnly(draft.volume)` |
| 31 | `digitsOnly(draft.yearBuilt)` |
| 32-39 | features: `view, fireplace, cabletv, elevator, childFriendly, parking, garage, balcony` |
| 40-45 | `''` |
| 46-50 | `images[0..4]?.filename ?? ''` |
| 51-55 | `sanitizeIdxText(images[0..4]?.title ?? '', 200)` |
| 56-63 | `''` |
| 64-66 | `''` |
| 67 | `sanitizeIdxText(draft.url, 200)` |
| 68 | `sanitizeIdxText(draft.agencyId, 10)` |
| 69 | `sanitizeIdxText(draft.agencyName, 200)` |
| 70 | `''` |
| 71 | `sanitizeIdxText(draft.agencyReference, 200)` |
| 72-75 | `''` |
| 76 | `sanitizeIdxText(draft.agencyPhone, 200)` |
| 77, 78 | `''` |
| 79 | `sanitizeIdxText(draft.agencyEmail, 200)` |
| 80 | `''` |
| 81 | `sanitizeIdxText(draft.visitName, 200)` |
| 82 | `sanitizeIdxText(draft.visitPhone, 200)` |
| 83 | `''` |
| 84 | `sanitizeIdxText(draft.visitRemark, 200)` |
| 85, 86 | `''` |
| 87-90 | `images[5..8]?.filename ?? ''` |
| 91-94 | `sanitizeIdxText(images[5..8]?.title ?? '', 200)` |
| 95-113 | `''` |
| 114 | `''` (isdn) |
| 115 | `draft.features.wheelchair` |
| 116 | `draft.features.animalAllowed` |
| 117-141 | `''` |
| 142-145 | `images[9..12]?.filename ?? ''` |
| 146-149 | `sanitizeIdxText(images[9..12]?.title ?? '', 200)` |
| 150-161 | `''` |
| 162 | `digitsOnly(draft.numberOfFloors)` |
| 163 | `digitsOnly(draft.yearRenovated)` |
| 164-169 | `''` |
| 170 | `draft.features.newBuilding` |
| 171 | `draft.features.oldBuilding` |
| 172, 173 | `''` |
| 174 | `draft.features.swimmingpool` |
| 175 | `draft.features.minergieGeneral` |
| 176 | `draft.features.minergieCertified` |
| 177 | `formatIdxDateTime(opts.lastModified)` |
| 178-182 | `''` |

**`sanitizeIdxText` rules (in order):** normalize CRLF/CR to `\n`; strip all HTML tags except `<br>`, `<b>`, `</b>`, `<li>`, `</li>` (case-insensitive; convert `\n` to `<br>` first for the description-style multi-line inputs - implement as: replace `\n` with `<br>`); remove every `#`; collapse runs of whitespace (not inside `<br>`) to single spaces; trim; truncate to `maxLen`.

**`transliterate`:** keep all codepoints ≤ 0xFF; map at minimum: curly quotes → `'`/`"`, en/em dash → `-`, ellipsis → `...`, `€` → `EUR`, `„` `“` `”` → `"`, `‚` `’` → `'`, `–`/`—` → `-`, non-breaking space → space, `œ`→`oe`, `Œ`→`OE`, `š`→`s`, `Š`→`S`, `ž`→`z`, `Ž`→`Z`; anything else > 0xFF → `?`. (Umlauts and French accents are native Latin-1: do NOT touch them.)

**`sanitizeIdxFilename`:** lowercase; NFD-decompose umlauts/accents to ASCII (`ä`→`ae`, `ö`→`oe`, `ü`→`ue`, `é`→`e` etc.); replace whitespace with `_`; remove the spec-forbidden set `( ) # ; ! $ ^ " @ * + / \ &` and commas plus any remaining non `[a-z0-9._-]`; collapse repeats of `_`; must keep/receive a `.jpg` extension (append if missing).

**`validateDraft` rules (exact list):**

Errors (`severity: 'error'`):
- `refProperty` blank → `issue.refRequired`
- `zip`: country `CH` and not `/^\d{4}$/` → `issue.zipInvalid`
- `city` blank → `issue.cityRequired`
- `country` not 2 letters → `issue.countryInvalid`
- `title` blank → `issue.titleRequired`
- `description` blank → `issue.descriptionRequired`
- `objectType` null → `issue.typeRequired`
- `priceUnit` set but inconsistent with `offerType` (RENT allows YEARLY/M2YEARLY/MONTHLY/WEEKLY/DAILY; SALE allows SELL/SELLM2) → `issue.priceUnitMismatch`
- `availableFrom` non-empty and not `/^\d{2}\.\d{2}\.\d{4}$/` → `issue.dateInvalid`
- `yearBuilt` non-empty and not 4 digits → `issue.yearInvalid` (same for `yearRenovated`, param `{ field }`)

Warnings (`severity: 'warning'`):
- `agencyId` blank → `issue.agencyIdMissing` (portals reject the file without it, but the package is still useful as a software import)
- both `sellingPrice`/`rentNet` empty (per offerType) → `issue.priceOnRequest`
- `street` blank → `issue.noStreet` (no map pin on portals)
- `images.length === 0` → `issue.noImages`
- `title.length > 70` → `issue.titleTruncated` (params `{ max: 70 }`)
- `description.length > 4000` → `issue.descriptionTruncated` (params `{ max: 4000 }`)
- `priceUnit` empty → `issue.priceUnitDefaulted` (serializer leaves it empty; portals default sensibly)

**`prepareListingImages`:** for each ref: `fetch(publicUrl, { headers: authHeader ? { Authorization: authHeader } : {} })` → blob; if `image/jpeg` pass bytes through unchanged; otherwise decode via `createImageBitmap(blob)`, draw on canvas (max edge 2560 px, keep aspect), `canvas.toBlob('image/jpeg', 0.9)`; collect as `PreparedImage { filename: ref.filename, data }`. Any per-image failure (fetch non-OK, decode error) goes to `failedFilenames` and does not abort the rest. No test for this file (DOM/canvas heavy); keep it small and defensive.

**Steps (TDD):**

- [ ] **Step 1: failing tests for record.ts** - `record.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildIdxFields, serializeUnload, sanitizeIdxText, digitsOnly, formatIdxDateTime, IDX_FIELD_COUNT } from '../record';
import { emptyListingDraft } from '../types';

const OPTS = { senderId: 'Aireon Showroom v0.21.0', lastModified: new Date(2026, 6, 29, 13, 42, 37) };

function draft() {
  const d = emptyListingDraft();
  d.refProperty = 'CH123456789012';
  d.zip = '8001'; d.city = 'Zurich'; d.canton = 'zh';
  d.title = 'Nice flat'; d.description = 'Line1\nLine2';
  d.offerType = 'RENT'; d.rentNet = "2'500"; d.rentExtra = '250';
  return d;
}

it('always returns exactly 183 fields', () => {
  expect(buildIdxFields(draft(), OPTS)).toHaveLength(IDX_FIELD_COUNT);
});
it('places core fields at spec positions', () => {
  const f = buildIdxFields(draft(), OPTS);
  expect(f[0]).toBe('IDX3.01');
  expect(f[2]).toBe('APPT');
  expect(f[4]).toBe('RENT');
  expect(f[9]).toBe('8001');
  expect(f[11]).toBe('ZH');
  expect(f[16]).toBe('Nice flat');
  expect(f[177]).toBe('29.07.2026 13:42:37');
});
it('RENT: field 18 is gross (net+extra), 19 net, 20 extra, digit-cleaned', () => {
  const f = buildIdxFields(draft(), OPTS);
  expect(f[19]).toBe('2500');
  expect(f[20]).toBe('250');
  expect(f[18]).toBe('2750');
});
it('SALE: field 18 selling price, 19/20 empty', () => {
  const d = draft(); d.offerType = 'SALE'; d.sellingPrice = '1200000';
  const f = buildIdxFields(d, OPTS);
  expect(f[18]).toBe('1200000');
  expect(f[19]).toBe('');
  expect(f[20]).toBe('');
});
it('maps up to 13 picture filenames to slots 46-50, 87-90, 142-145', () => {
  const d = draft();
  d.images = Array.from({ length: 13 }, (_, i) => ({ savedImageId: i, publicUrl: '', filename: `p${i + 1}.jpg`, title: `T${i + 1}` }));
  const f = buildIdxFields(d, OPTS);
  expect(f[46]).toBe('p1.jpg'); expect(f[50]).toBe('p5.jpg');
  expect(f[87]).toBe('p6.jpg'); expect(f[90]).toBe('p9.jpg');
  expect(f[142]).toBe('p10.jpg'); expect(f[145]).toBe('p13.jpg');
  expect(f[51]).toBe('T1'); expect(f[146]).toBe('T10');
});
it('serializeUnload joins with #, trailing #, CRLF per record', () => {
  const out = serializeUnload([['a', 'b'], ['c', 'd']]);
  expect(out).toBe('a#b#\r\nc#d#\r\n');
});
it('sanitizeIdxText strips #, keeps <br>/<b>, drops other tags, truncates', () => {
  expect(sanitizeIdxText('a#b', 10)).toBe('ab');
  expect(sanitizeIdxText('x\ny', 10)).toBe('x<br>y');
  expect(sanitizeIdxText('<i>hi</i> <b>bold</b>', 50)).toBe('hi <b>bold</b>');
  expect(sanitizeIdxText('abcdef', 3)).toBe('abc');
});
it('digitsOnly strips everything but digits', () => {
  expect(digitsOnly("1'200’000 CHF")).toBe('1200000');
  expect(digitsOnly('')).toBe('');
});
```

- [ ] **Step 2:** `cd /Users/joe/Documents/local_dev/swissnovo/showroom && npx vitest run src/lib/idx` → expect FAIL (stubs).
- [ ] **Step 3:** implement `record.ts` per the mapping table above.
- [ ] **Step 4:** failing tests for `latin1.ts` - `latin1.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { encodeLatin1, transliterate, sanitizeIdxFilename } from '../latin1';

it('keeps umlauts as single Latin-1 bytes', () => {
  const b = encodeLatin1('Zürich');
  expect(Array.from(b)).toEqual([0x5a, 0xfc, 0x72, 0x69, 0x63, 0x68]);
});
it('transliterates outside-Latin-1 punctuation', () => {
  expect(transliterate('“quote” – dash… €')).toBe('"quote" - dash... EUR');
});
it('unmappable chars become ?', () => {
  expect(Array.from(encodeLatin1('日'))).toEqual([0x3f]);
});
it('sanitizeIdxFilename enforces portal filename rules', () => {
  expect(sanitizeIdxFilename('Küchen Bild (1).png')).toBe('kuechen_bild_1.jpg');
  expect(sanitizeIdxFilename('already.jpg')).toBe('already.jpg');
});
```

- [ ] **Step 5:** implement `latin1.ts`; run tests → PASS.
- [ ] **Step 6:** failing tests for `validate.ts` - `validate.test.ts` (cover: valid draft → `[]` errors; each error rule fires; agencyId/noImages/priceOnRequest warnings fire; RENT+SELL priceUnit mismatch is an error). Write them as concrete cases, e.g.:

```ts
it('flags CH zip that is not 4 digits', () => {
  const d = validDraft(); d.zip = '80';
  expect(issues(d, 'error').map(i => i.messageKey)).toContain('issue.zipInvalid');
});
```

- [ ] **Step 7:** implement `validate.ts`; run → PASS.
- [ ] **Step 8:** implement `package.ts` (fflate `zipSync`, store README.txt via `strToU8`) and `imagePrep.ts` per spec above. Add to `record.test.ts` a round-trip: `buildUnloadBytes(validDraft(), OPTS)` decodes (latin1) to a string ending `#\r\n` and containing 183-1 = 182 `#` separators + trailing = 183 `#` per record: `expect(text.split('#').length - 1).toBe(183)`.
- [ ] **Step 9:** `npx vitest run src/lib/idx` all green; `npm run typecheck` clean.
- [ ] **Step 10:** Commit: `git add src/lib/idx && git commit -m "feat(publish): IDX 3.01 engine (record builder, Latin-1, validation, packaging)"`

---

### Task 2: Publish page UI, wiring, i18n, tour

**Files:**
- Create: `src/components/publish/PublishView.tsx`, `ListingForm.tsx`, `Field.tsx`, `ImagePicker.tsx`, `ValidationPanel.tsx`, `ExportPanel.tsx`, `PortalGuide.tsx`, `usePublishDraft.ts`
- Modify: `src/App.tsx` (lazy route `/publish`), `src/components/Navbar.tsx` (NAV_LINKS entry), `src/components/Tour.tsx` (route branch), `src/contexts/I18nContext.tsx` (keys x4 locales)
- Do NOT touch anything in `src/lib/idx/` (parallel task owns it); consume the contract exactly as typed.

**Interfaces (Consumes):** everything in Task 1's "Produces" block plus `types.ts`/`codes.ts` foundation; `listImages` + `SavedImage` from `src/services/imageService.ts`; `fetchParcelInfo` from `src/lib/parcelInfo.ts`; `AddressSearch` from `src/components/reporter/AddressSearch.tsx` (reuse as-is; check its props before use); `signal` from `src/lib/signal.ts`; `CURRENT_VERSION` from `src/data/releaseMeta.ts`; shared `SegmentedTabs`, `Skeleton` from `@aireon/shared` if they fit, else local markup.

**Page composition (`PublishView`):**
- `<Navbar showSearch={false} />` then `<main className="mx-auto max-w-[1600px] px-4 sm:px-6 py-6 sm:py-8">` (copy ReporterView shell).
- Header: cyan `Send` icon + kicker `t('page.publish.kicker')`, intro `t('page.publish.intro')` (pattern of ReporterView.tsx:161-169).
- Grid `lg:grid-cols-[minmax(0,1fr)_400px] gap-6`; left = prefill card + `ListingForm` + `ImagePicker` (`data-tour="publish-form"`, `data-tour="publish-images"`); right = sticky rail (`lg:sticky lg:top-20 self-start space-y-4`): `ValidationPanel`, `ExportPanel` (`data-tour="publish-export"`), `PortalGuide`.
- Prefill card: `AddressSearch`; on pick → `usePublishDraft.prefillFromLocation(lat, lng, label)`. Support deep link `?lat=&lng=` on mount (validate ranges like ReporterView.tsx:26-33 does).

**`usePublishDraft`:** `useState<ListingDraft>` initialized from `localStorage['showroom:publish:draft:v1']` (JSON parse, fall back to `emptyListingDraft()`, merge over empty draft so old drafts survive shape changes); persist on change debounced 400 ms; expose `{ draft, patch(partial), patchFeature(key, v), setImages(refs), reset(), prefillFromLocation }`. `prefillFromLocation`: `fetchParcelInfo(lat, lng)` → patch `street` (from `address`), parse `locality` with `/^(\d{4})\s+(.+?)(?:\s+([A-Z]{2}))?$/` → `zip`, `city`, `canton`; `refProperty` ← `egrid ?? ''` (only if currently empty); `volume` ← `String(buildingVolumeM3 ?? '')` (only if empty); `apartments` ← flats similarly; store lat/lng. Never overwrite non-empty user-entered fields.
- `reset()` gets an inline confirm (two-tap pattern: first click arms `Confirm?` state for 3 s), no native `confirm()`.

**`ListingForm`:** sections as `.surface rounded-2xl p-4 sm:p-5` cards with `text-xs uppercase tracking-wider text-gray-400 font-semibold` section titles: Offer (SegmentedTabs RENT/SALE + category select + type select from `OBJECT_TYPE_CODES[category]` using `objectTypeLabel(cat, code, locale)` + refProperty), Location (street/zip/city/canton/country/situation), Content (title with `{n}/70` counter, description textarea with `{n}/4000` counter, availableFrom, url), Pricing (conditional by offerType: SALE → sellingPrice + priceUnit SELL/SELLM2; RENT → rentNet/rentExtra + priceUnit MONTHLY/WEEKLY/DAILY/YEARLY/M2YEARLY; currency), Details (floor/rooms/apartments/surfaces/volume/years/numberOfFloors), Features (checkbox grid mapping to YesNo 'Y'/''), Contact (agencyId with hint `t('page.publish.agencyIdHint')`, agencyName/reference/phone/email, visit fields).
- `Field.tsx`: label + input wrapper, `<input className="w-full h-9 rounded-lg bg-ink-900/70 border border-white/10 px-3 text-sm text-gray-200 placeholder-gray-600 focus-ring">`, textarea variant, select variant (same classes, `h-9` → selects, `min-h-[120px]` textarea), optional error highlight `border-red-400/40` when an error issue anchors to the field.

**`ImagePicker`:** load `listImages()` once (loading → 6 `Skeleton` tiles in a grid); thumbnail grid (`grid-cols-3 sm:grid-cols-4 xl:grid-cols-5 gap-2`, `aspect-video object-cover rounded-lg border`); click toggles selection (cyan ring + order badge `1..13`); cap 13 with a small counter `{n}/13`; selected list below with up/down reorder buttons and a title text input per image (feeds `ListingImageRef.title`); filenames derive `sanitizeIdxFilename(original_filename || 'image-' + id)` deduped with `-2`, `-3` suffixes. Empty gallery → `t('page.publish.images.empty')` hint pointing at the gallery/reporter.
- (`sanitizeIdxFilename` comes from `../../lib/idx/latin1` - allowed import, it is contract not engine internals... it IS engine. Import it anyway; the stub exists from foundation. If the stub body is still placeholder during your work, that is fine - do not reimplement it.)

**`ValidationPanel`:** `const issues = useMemo(() => validateDraft(draft), [draft])`; three visual states: all-clear (emerald check + `t('page.publish.validation.ok')`), errors (red-400 list), warnings (amber-400 list); each row `t('page.publish.' + issue.messageKey, issue.params)` with an `AlertTriangle`/`XCircle` 14px icon; clicking a row focuses the field (`document.getElementById('publish-field-' + issue.field)?.focus()` - give `Field` inputs that id).

**`ExportPanel`:** three actions:
1. Download package (primary, `Download` icon, disabled while preparing or when `issues.some(i => i.severity === 'error')` - show `t('page.publish.export.blocked')` hint when disabled): `prepareListingImages(draft.images, getAuthHeader)` (auth header from `userManager.getUser()` id_token pattern - copy imageService.ts:61-67 into a tiny local helper or export one; do not modify imageService), then `buildUnloadBytes`, `buildIdxPackage`, `URL.createObjectURL`, `<a download="idx-package-<refProperty||'listing'>.zip">`, revoke old URL; busy state with progress text (`t('page.publish.export.preparing')`); failures surfaced as amber note listing `failedFilenames`.
2. Download `unload.txt` only (same gating).
3. Copy record to clipboard (`navigator.clipboard.writeText(serializeUnload([buildIdxFields(...)]))`, `ShareCopiedToast`-style feedback or a simple `Copied` swap for 2 s).
- `senderId` = `` `Aireon Showroom v${CURRENT_VERSION}` ``, `lastModified` = `new Date()`.
- Telemetry: `void signal.send('Generate IDX Package', { metaData: { images: draft.images.length, category: draft.category, offer: draft.offerType } })` on package download; `'Download IDX Unload'`, `'Copy IDX Record'` for the others.

**`PortalGuide`:** collapsible cards (local `<details>`-free: button + chevron + conditional render) for: SMG portals ImmoScout24 + Homegate (needs SMG pro contract → agency_id + FTP credentials; upload `data/` + `images/` to `ftp.homegate.ch/<agency_id>/`; processing runs about 3 times per day; full-load semantics warning: the file replaces ALL your ads), newhome (FLEX account, self-service under My newhome > Services > Import interfaces), Flatfox (accepts IDX via API or FTP; REST API for org accounts). Each with an `ExternalLink` anchor (`target="_blank" rel="noreferrer"`). All copy via i18n keys; keep each card to 2-3 short sentences. Wording must be honest: this page prepares the package; publication happens on the portal side with the user's own contract/credentials.

**Wiring:**
- `App.tsx`: `const PublishView = lazy(() => import('./components/publish/PublishView'));` next to the ReporterView lazy (L13); `const isPublish = pathname === '/publish';` next to L46; loading branch: publish gets `<RouteSkeleton />`; render branch BEFORE the gallery fallthrough, same shape as the reporter branch incl. `{tour}`.
- `Navbar.tsx`: append to NAV_LINKS: `{ path: '/publish', labelKey: 'nav.publish', icon: <Send size={16} strokeWidth={2.2} /> }` (import `Send` from lucide-react; match existing size/props at L24-27). The mobile OverflowNav derives from the same array - verify it picks the new entry up (L100-106).
- `Tour.tsx`: add `pathname === '/publish'` branch in `buildSteps` with 3 steps targeting `[data-tour="publish-form"]`, `[data-tour="publish-images"]`, `[data-tour="publish-export"]` using keys `tour.publish_form_title/body`, `tour.publish_images_title/body`, `tour.publish_export_title/body` (follow the reporter branch's exact object shape).

**i18n:** add to ALL FOUR locale objects (en at L24, fr at L346, de at L666, it at L986 - insert each block alphabetically near the other `page.*` keys; translate properly, no machine-literal garbage; FR/DE/IT should read like the portal industry wording used in `codes.ts` labels). Full EN key list (write these exact keys; values may be tuned for tone but keep meaning):

```
nav.publish: Publish
page.publish.kicker: Portal publisher
page.publish.intro: Prepare a property listing as a portal-ready IDX 3.01 package for ImmoScout24, Homegate, newhome, and Flatfox. Fill in the listing, pick images from your gallery, and download the upload package.
page.publish.prefill.title: Start from an address
page.publish.prefill.hint: Search a Swiss address to prefill location and parcel details. Existing entries are kept.
page.publish.section.offer: Offer
page.publish.section.location: Location
page.publish.section.content: Listing content
page.publish.section.pricing: Pricing
page.publish.section.details: Details
page.publish.section.features: Features
page.publish.section.contact: Contact and agency
page.publish.offer.rent: Rent
page.publish.offer.sale: Sale
page.publish.field.category: Category
page.publish.field.objectType: Object type
page.publish.field.refProperty: Reference (EGRID or your own)
page.publish.field.street: Street and number
page.publish.field.zip: ZIP
page.publish.field.city: City
page.publish.field.canton: Canton
page.publish.field.country: Country
page.publish.field.situation: Situation
page.publish.field.title: Listing title
page.publish.field.description: Description
page.publish.field.availableFrom: Available from (DD.MM.YYYY)
page.publish.field.url: Website
page.publish.field.sellingPrice: Selling price
page.publish.field.rentNet: Net rent
page.publish.field.rentExtra: Extra costs
page.publish.field.priceUnit: Price unit
page.publish.field.currency: Currency
page.publish.field.floor: Floor
page.publish.field.rooms: Rooms
page.publish.field.apartments: Apartments
page.publish.field.surfaceLiving: Living space (m2)
page.publish.field.surfaceProperty: Plot area (m2)
page.publish.field.surfaceUsable: Usable area (m2)
page.publish.field.volume: Volume (m3)
page.publish.field.yearBuilt: Year built
page.publish.field.yearRenovated: Year renovated
page.publish.field.numberOfFloors: Floors in building
page.publish.field.agencyId: Agency ID
page.publish.agencyIdHint: Issued by the portal with your listing contract. Leave empty if your software fills it in.
page.publish.field.agencyName: Agency name
page.publish.field.agencyReference: Contact person
page.publish.field.agencyPhone: Phone
page.publish.field.agencyEmail: Email
page.publish.field.visitName: Viewing contact
page.publish.field.visitPhone: Viewing phone
page.publish.field.visitRemark: Viewing note
page.publish.feature.view: View
page.publish.feature.fireplace: Fireplace
page.publish.feature.cabletv: Cable TV
page.publish.feature.elevator: Elevator
page.publish.feature.childFriendly: Child friendly
page.publish.feature.parking: Parking
page.publish.feature.garage: Garage
page.publish.feature.balcony: Balcony
page.publish.feature.wheelchair: Wheelchair access
page.publish.feature.animalAllowed: Pets allowed
page.publish.feature.newBuilding: New building
page.publish.feature.oldBuilding: Old building
page.publish.feature.swimmingpool: Swimming pool
page.publish.feature.minergieGeneral: Minergie construction
page.publish.feature.minergieCertified: Minergie certified
page.publish.images.title: Listing images
page.publish.images.hint: Pick up to 13 images from your gallery. They are converted to JPEG and packaged for the portal.
page.publish.images.empty: No gallery images yet. Capture exports in the reporter or save screenshots from the map apps first.
page.publish.images.count: {n}/13 selected
page.publish.images.titlePlaceholder: Image title (optional)
page.publish.images.failed: Some images could not be prepared: {names}
page.publish.validation.title: Validation
page.publish.validation.ok: Ready to export. All required fields are set.
page.publish.issue.refRequired: A property reference is required.
page.publish.issue.zipInvalid: Swiss ZIP codes have 4 digits.
page.publish.issue.cityRequired: City is required.
page.publish.issue.countryInvalid: Country must be a 2-letter code.
page.publish.issue.titleRequired: A listing title is required.
page.publish.issue.descriptionRequired: A description is required.
page.publish.issue.typeRequired: Pick an object type.
page.publish.issue.priceUnitMismatch: Price unit does not match the offer type.
page.publish.issue.dateInvalid: Use the DD.MM.YYYY format.
page.publish.issue.yearInvalid: Years have 4 digits.
page.publish.issue.agencyIdMissing: No agency ID yet. Portals reject uploads without one.
page.publish.issue.priceOnRequest: No price set. The listing will show "price on request".
page.publish.issue.noStreet: Without a street the listing gets no map pin.
page.publish.issue.noImages: No images selected.
page.publish.issue.titleTruncated: Title is cut at {max} characters.
page.publish.issue.descriptionTruncated: Description is cut at {max} characters.
page.publish.issue.priceUnitDefaulted: No price unit set. The portal default applies.
page.publish.export.title: Export
page.publish.export.package: Download portal package (.zip)
page.publish.export.unload: Download unload.txt
page.publish.export.copy: Copy IDX record
page.publish.export.copied: Copied
page.publish.export.preparing: Preparing {total} images
page.publish.export.blocked: Fix the errors above to enable the export.
page.publish.reset: Reset draft
page.publish.reset.confirm: Click again to confirm
page.publish.guide.title: Publishing to the portals
page.publish.guide.smg.title: ImmoScout24 and Homegate (SMG)
page.publish.guide.smg.body: Listings reach both portals through the SMG feed. With a pro listing contract you get an agency ID and FTP credentials. Upload the data and images folders to ftp.homegate.ch. The file replaces all your published ads, and runs are processed about three times a day.
page.publish.guide.newhome.title: newhome
page.publish.guide.newhome.body: Business (FLEX) accounts can enable the import interface under My newhome, Services, Import interfaces, and upload this package with the generated credentials.
page.publish.guide.flatfox.title: Flatfox
page.publish.guide.flatfox.body: Flatfox accepts IDX packages from property software and offers a REST API for organization accounts. Private listings can be created in the Flatfox web interface.
page.publish.guide.disclaimer: This page prepares a portal-ready package. Publication itself happens with your own portal contract and credentials.
tour.publish_form_title: Describe the listing
tour.publish_form_body: Search an address to prefill parcel data, then complete the listing details.
tour.publish_images_title: Pick images
tour.publish_images_body: Select up to 13 gallery exports. They are converted and packaged automatically.
tour.publish_export_title: Export the package
tour.publish_export_body: Validation runs live. Download the ZIP and upload it to your portal account.
```

**Steps:**

- [ ] **Step 1:** `usePublishDraft.ts` + `Field.tsx` (pure, no network).
- [ ] **Step 2:** `ListingForm.tsx`, `ImagePicker.tsx`, `ValidationPanel.tsx`, `ExportPanel.tsx`, `PortalGuide.tsx`, then `PublishView.tsx` composing them.
- [ ] **Step 3:** wiring: App.tsx route, Navbar link, Tour branch.
- [ ] **Step 4:** i18n keys x4 locales.
- [ ] **Step 5:** `npm run typecheck && npm run lint` clean; `npx vitest run` green (do not break existing tests; you add none).
- [ ] **Step 6:** Commit: `git add src/components/publish src/App.tsx src/components/Navbar.tsx src/components/Tour.tsx src/contexts/I18nContext.tsx && git commit -m "feat(publish): portal publisher page with IDX package export"`

---

### Task 3: Integration, verification, release, publish (controller)

- [ ] Full gates: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
- [ ] Preview smoke via root launch.json: page renders, nav works, form patches persist, validation reacts, no console errors.
- [ ] Version 0.21.0 in `package.json` + `releaseNotes.ts` entry (kind `'new'`, `Send` icon, PR number) + `releaseMeta.ts` (heals stale 0.20.1).
- [ ] Toolbox sync: showroom descriptor/longDescription in `toolbox/src/data/tools.json` gains the portal-export capability; toolbox publish workflow first, then showroom PR.
- [ ] PR + squash-merge + Vercel deploy READY check (`gh api repos/mbuchi/showroom/commits/main/status`).

## Out of scope (documented for the next iteration)

- RES-side FTP relay (credential vault + scheduled full-load push) - the natural next step for true one-click publish.
- Flatfox REST relay (org API key server-side; `POST /api/v1/idx-listing/` accepts this exact record + base64 files).
- SwissRETS JSON as the forward-looking second format.
- Movie/document slots (fields 61-66), commercial INDUS fields (109-124), distances (41-45).
