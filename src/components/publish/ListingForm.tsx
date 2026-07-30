import type { ReactNode } from 'react';
import { SegmentedTabs } from '@aireon/shared';
import Field, { type FieldOption } from './Field';
import { useI18n } from '../../contexts/I18nContext';
import { OBJECT_CATEGORY_LABELS, OBJECT_TYPE_CODES, objectTypeLabel } from '../../lib/idx/codes';
import type {
  ListingDraft,
  ListingFeatures,
  ObjectCategory,
  OfferType,
  PriceUnit,
  YesNo,
} from '../../lib/idx/types';
import { defaultPriceUnit, priceUnitsFor } from '../../lib/publishPriceUnit';

// IDX 3.01 caps: the record builder truncates at these lengths, so the form
// counts down to them live instead of letting the export silently cut copy.
const TITLE_MAX = 70;
const DESCRIPTION_MAX = 4000;

const CATEGORIES = Object.keys(OBJECT_CATEGORY_LABELS) as ObjectCategory[];

/** Swiss thousands grouping for the informational per-m2 price estimate. */
const PRICE_FORMAT = new Intl.NumberFormat('de-CH', { maximumFractionDigits: 0 });

/** Feature checkboxes, in the order the IDX record carries them. */
const FEATURE_KEYS: (keyof ListingFeatures)[] = [
  'view',
  'fireplace',
  'cabletv',
  'elevator',
  'childFriendly',
  'parking',
  'garage',
  'balcony',
  'wheelchair',
  'animalAllowed',
  'newBuilding',
  'oldBuilding',
  'swimmingpool',
  'minergieGeneral',
  'minergieCertified',
];

function categoryLabel(category: ObjectCategory, locale: string): string {
  const labels = OBJECT_CATEGORY_LABELS[category];
  if (locale === 'de' || locale === 'fr' || locale === 'it') return labels[locale];
  return labels.en;
}

interface ListingFormProps {
  draft: ListingDraft;
  patch: (partial: Partial<ListingDraft>) => void;
  patchFeature: (key: keyof ListingFeatures, value: YesNo) => void;
  /** Fields carrying an error-severity validation issue, for red borders. */
  errorFields: Set<string>;
  /** RES estimate in CHF per m2 of LIVING SPACE, shown as a hint under the
   *  price inputs. Purely informational: it is never multiplied by a plot or
   *  building area, because the two bases are unrelated. */
  pricePerM2Living: number | null;
}

/**
 * The IDX listing form: seven `.surface` sections covering everything the
 * record builder reads off the draft. Numeric-ish fields stay raw strings —
 * the engine digit-cleans them at serialization time, so typing never fights
 * the UI.
 */
export default function ListingForm({
  draft,
  patch,
  patchFeature,
  errorFields,
  pricePerM2Living,
}: ListingFormProps) {
  const { t, locale } = useI18n();

  const section = (title: string, children: ReactNode, cols = 'sm:grid-cols-2') => (
    <section className="surface rounded-2xl p-4 sm:p-5">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h2>
      <div className={`grid gap-3 ${cols}`}>{children}</div>
    </section>
  );

  const typeOptions: FieldOption[] = OBJECT_TYPE_CODES[draft.category].map((code) => ({
    value: String(code.code),
    label: objectTypeLabel(draft.category, code.code, locale),
  }));

  const categoryOptions: FieldOption[] = CATEGORIES.map((cat) => ({
    value: cat,
    label: categoryLabel(cat, locale),
  }));

  // Switching category invalidates the type code (the code lists do not
  // overlap), so fall back to the first type the new category offers.
  const changeCategory = (value: string) => {
    const category = value as ObjectCategory;
    const codes = OBJECT_TYPE_CODES[category];
    const keepsType = draft.objectType != null && codes.some((c) => c.code === draft.objectType);
    patch({ category, objectType: keepsType ? draft.objectType : (codes[0]?.code ?? null) });
  };

  const err = (field: string) => errorFields.has(field);

  // Every option is a real, human-labelled unit — no empty placeholder,
  // since the draft's priceUnit is never '' once defaulting is in place.
  const priceUnitOptions: FieldOption[] = priceUnitsFor(draft.offerType).map((unit) => ({
    value: unit,
    label: t(`page.publish.unit.${unit}`),
  }));

  // Rendered right next to the primary price input in both offer-type
  // branches below, so the unit is always visible beside the number it
  // qualifies rather than trailing after the secondary rent-extra field.
  const priceUnitField = (
    <Field
      name="priceUnit"
      label={t('page.publish.field.priceUnit')}
      variant="select"
      options={priceUnitOptions}
      value={draft.priceUnit}
      onChange={(v) => patch({ priceUnit: v as PriceUnit })}
      error={err('priceUnit')}
    />
  );

  return (
    <div className="space-y-4">
      {section(
        t('page.publish.section.offer'),
        <>
          <div className="min-w-0 sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-400">
              {t('page.publish.section.offer')}
            </span>
            <SegmentedTabs<OfferType>
              tabs={[
                { id: 'RENT', label: t('page.publish.offer.rent') },
                { id: 'SALE', label: t('page.publish.offer.sale') },
              ]}
              value={draft.offerType}
              onChange={(id) => patch({ offerType: id, priceUnit: defaultPriceUnit(id) })}
              ariaLabel={t('page.publish.section.offer')}
              dark
              size="sm"
              className="max-w-[240px]"
            />
          </div>
          <Field
            name="category"
            label={t('page.publish.field.category')}
            variant="select"
            options={categoryOptions}
            value={draft.category}
            onChange={changeCategory}
          />
          <Field
            name="objectType"
            label={t('page.publish.field.objectType')}
            variant="select"
            options={typeOptions}
            value={draft.objectType == null ? '' : String(draft.objectType)}
            onChange={(v) => patch({ objectType: v === '' ? null : Number(v) })}
            error={err('objectType')}
          />
          <Field
            name="refProperty"
            label={t('page.publish.field.refProperty')}
            value={draft.refProperty}
            onChange={(v) => patch({ refProperty: v })}
            error={err('refProperty')}
            className="sm:col-span-2"
          />
        </>,
      )}

      {section(
        t('page.publish.section.location'),
        <>
          <Field
            name="street"
            label={t('page.publish.field.street')}
            value={draft.street}
            onChange={(v) => patch({ street: v })}
            error={err('street')}
            className="sm:col-span-2"
          />
          <Field
            name="zip"
            label={t('page.publish.field.zip')}
            value={draft.zip}
            inputMode="numeric"
            onChange={(v) => patch({ zip: v })}
            error={err('zip')}
          />
          <Field
            name="city"
            label={t('page.publish.field.city')}
            value={draft.city}
            onChange={(v) => patch({ city: v })}
            error={err('city')}
          />
          <Field
            name="canton"
            label={t('page.publish.field.canton')}
            value={draft.canton}
            onChange={(v) => patch({ canton: v.toUpperCase() })}
            error={err('canton')}
          />
          <Field
            name="country"
            label={t('page.publish.field.country')}
            value={draft.country}
            onChange={(v) => patch({ country: v.toUpperCase() })}
            error={err('country')}
          />
          <Field
            name="situation"
            label={t('page.publish.field.situation')}
            value={draft.situation}
            onChange={(v) => patch({ situation: v })}
            className="sm:col-span-2"
          />
        </>,
      )}

      {section(
        t('page.publish.section.content'),
        <>
          <Field
            name="title"
            label={t('page.publish.field.title')}
            value={draft.title}
            onChange={(v) => patch({ title: v })}
            counter={`${draft.title.length}/${TITLE_MAX}`}
            error={err('title')}
            className="sm:col-span-2"
          />
          <Field
            name="description"
            label={t('page.publish.field.description')}
            variant="textarea"
            value={draft.description}
            onChange={(v) => patch({ description: v })}
            counter={`${draft.description.length}/${DESCRIPTION_MAX}`}
            error={err('description')}
            className="sm:col-span-2"
          />
          <Field
            name="availableFrom"
            label={t('page.publish.field.availableFrom')}
            value={draft.availableFrom}
            placeholder="01.10.2026"
            onChange={(v) => patch({ availableFrom: v })}
            error={err('availableFrom')}
          />
          <Field
            name="url"
            label={t('page.publish.field.url')}
            type="url"
            inputMode="url"
            value={draft.url}
            onChange={(v) => patch({ url: v })}
          />
        </>,
      )}

      {section(
        t('page.publish.section.pricing'),
        <>
          {draft.offerType === 'SALE' ? (
            <>
              <Field
                name="sellingPrice"
                label={t('page.publish.field.sellingPrice')}
                value={draft.sellingPrice}
                inputMode="numeric"
                onChange={(v) => patch({ sellingPrice: v })}
                error={err('sellingPrice')}
              />
              {priceUnitField}
            </>
          ) : (
            <>
              <Field
                name="rentNet"
                label={t('page.publish.field.rentNet')}
                value={draft.rentNet}
                inputMode="numeric"
                onChange={(v) => patch({ rentNet: v })}
                error={err('rentNet')}
              />
              {priceUnitField}
              <Field
                name="rentExtra"
                label={t('page.publish.field.rentExtra')}
                value={draft.rentExtra}
                inputMode="numeric"
                onChange={(v) => patch({ rentExtra: v })}
              />
            </>
          )}
          <Field
            name="currency"
            label={t('page.publish.field.currency')}
            value={draft.currency}
            onChange={(v) => patch({ currency: v.toUpperCase() })}
          />
          {pricePerM2Living != null && (
            <p className="text-xs leading-snug text-gray-500 sm:col-span-2">
              {t('page.publish.pricing.m2Hint', { price: PRICE_FORMAT.format(pricePerM2Living) })}
            </p>
          )}
        </>,
      )}

      {section(
        t('page.publish.section.details'),
        <>
          <Field
            name="floor"
            label={t('page.publish.field.floor')}
            value={draft.floor}
            onChange={(v) => patch({ floor: v })}
          />
          <Field
            name="rooms"
            label={t('page.publish.field.rooms')}
            value={draft.rooms}
            inputMode="decimal"
            onChange={(v) => patch({ rooms: v })}
          />
          <Field
            name="apartments"
            label={t('page.publish.field.apartments')}
            value={draft.apartments}
            inputMode="numeric"
            onChange={(v) => patch({ apartments: v })}
          />
          <Field
            name="surfaceLiving"
            label={t('page.publish.field.surfaceLiving')}
            value={draft.surfaceLiving}
            inputMode="numeric"
            onChange={(v) => patch({ surfaceLiving: v })}
          />
          <Field
            name="surfaceProperty"
            label={t('page.publish.field.surfaceProperty')}
            value={draft.surfaceProperty}
            inputMode="numeric"
            onChange={(v) => patch({ surfaceProperty: v })}
          />
          <Field
            name="surfaceUsable"
            label={t('page.publish.field.surfaceUsable')}
            value={draft.surfaceUsable}
            inputMode="numeric"
            onChange={(v) => patch({ surfaceUsable: v })}
          />
          <Field
            name="volume"
            label={t('page.publish.field.volume')}
            value={draft.volume}
            inputMode="numeric"
            onChange={(v) => patch({ volume: v })}
          />
          <Field
            name="yearBuilt"
            label={t('page.publish.field.yearBuilt')}
            value={draft.yearBuilt}
            inputMode="numeric"
            onChange={(v) => patch({ yearBuilt: v })}
            error={err('yearBuilt')}
          />
          <Field
            name="yearRenovated"
            label={t('page.publish.field.yearRenovated')}
            value={draft.yearRenovated}
            inputMode="numeric"
            onChange={(v) => patch({ yearRenovated: v })}
            error={err('yearRenovated')}
          />
          <Field
            name="numberOfFloors"
            label={t('page.publish.field.numberOfFloors')}
            value={draft.numberOfFloors}
            inputMode="numeric"
            onChange={(v) => patch({ numberOfFloors: v })}
          />
        </>,
      )}

      <section className="surface rounded-2xl p-4 sm:p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('page.publish.section.features')}
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
          {FEATURE_KEYS.map((key) => {
            const checked = draft.features[key] === 'Y';
            return (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm text-gray-300 transition-colors hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => patchFeature(key, e.target.checked ? 'Y' : '')}
                  className="h-4 w-4 flex-shrink-0 rounded border-white/20 bg-ink-900 accent-cyan-500 focus-ring"
                />
                <span className="min-w-0 truncate">{t(`page.publish.feature.${key}`)}</span>
              </label>
            );
          })}
        </div>
      </section>

      {section(
        t('page.publish.section.contact'),
        <>
          <Field
            name="agencyId"
            label={t('page.publish.field.agencyId')}
            value={draft.agencyId}
            onChange={(v) => patch({ agencyId: v })}
            hint={t('page.publish.agencyIdHint')}
            error={err('agencyId')}
            className="sm:col-span-2"
          />
          <Field
            name="agencyName"
            label={t('page.publish.field.agencyName')}
            value={draft.agencyName}
            onChange={(v) => patch({ agencyName: v })}
          />
          <Field
            name="agencyReference"
            label={t('page.publish.field.agencyReference')}
            value={draft.agencyReference}
            onChange={(v) => patch({ agencyReference: v })}
          />
          <Field
            name="agencyPhone"
            label={t('page.publish.field.agencyPhone')}
            type="tel"
            inputMode="tel"
            value={draft.agencyPhone}
            onChange={(v) => patch({ agencyPhone: v })}
          />
          <Field
            name="agencyEmail"
            label={t('page.publish.field.agencyEmail')}
            type="email"
            inputMode="email"
            value={draft.agencyEmail}
            onChange={(v) => patch({ agencyEmail: v })}
          />
          <Field
            name="visitName"
            label={t('page.publish.field.visitName')}
            value={draft.visitName}
            onChange={(v) => patch({ visitName: v })}
          />
          <Field
            name="visitPhone"
            label={t('page.publish.field.visitPhone')}
            type="tel"
            inputMode="tel"
            value={draft.visitPhone}
            onChange={(v) => patch({ visitPhone: v })}
          />
          <Field
            name="visitRemark"
            label={t('page.publish.field.visitRemark')}
            value={draft.visitRemark}
            onChange={(v) => patch({ visitRemark: v })}
            className="sm:col-span-2"
          />
        </>,
      )}
    </div>
  );
}
