// Shared contract for the IDX 3.01 export engine and the publish page UI.
// IDX 3.01 is the Swiss portal interchange format (ImmoScout24/Homegate via the
// SMG feed, newhome, Flatfox): one 183-field '#'-delimited record per listing
// in an ISO-8859-1 "unload.txt", assets alongside in images/.

export type OfferType = 'RENT' | 'SALE';

export type ObjectCategory =
  | 'APPT'
  | 'HOUSE'
  | 'PROP'
  | 'PARK'
  | 'INDUS'
  | 'GASTRO'
  | 'AGRI'
  | 'GARDEN'
  | 'SECONDARY';

export type PriceUnit = 'SELL' | 'SELLM2' | 'YEARLY' | 'M2YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY';

/** IDX tri-state boolean: '' = no statement, 'Y' / 'N' explicit. */
export type YesNo = '' | 'Y' | 'N';

export interface ListingImageRef {
  /** Gallery id of the source export. Opaque string (RES hands out UUIDs), so
   *  never coerce it to a number. */
  savedImageId: string;
  publicUrl: string;
  /** Sanitized unique filename ending in .jpg (set by the image picker). */
  filename: string;
  title: string;
}

export interface ListingFeatures {
  view: YesNo;
  fireplace: YesNo;
  cabletv: YesNo;
  elevator: YesNo;
  childFriendly: YesNo;
  parking: YesNo;
  garage: YesNo;
  balcony: YesNo;
  wheelchair: YesNo;
  animalAllowed: YesNo;
  newBuilding: YesNo;
  oldBuilding: YesNo;
  swimmingpool: YesNo;
  minergieGeneral: YesNo;
  minergieCertified: YesNo;
}

/**
 * Form-level listing state. Numeric-ish fields stay raw form strings; the
 * engine digit-cleans them at serialization time so typing never fights the UI.
 */
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
  /** i18n key suffix under page.publish.*, e.g. 'issue.zipInvalid'. */
  messageKey: string;
  params?: Record<string, string | number>;
}

export interface PreparedImage {
  filename: string;
  data: Uint8Array;
}

export function emptyListingFeatures(): ListingFeatures {
  return {
    view: '',
    fireplace: '',
    cabletv: '',
    elevator: '',
    childFriendly: '',
    parking: '',
    garage: '',
    balcony: '',
    wheelchair: '',
    animalAllowed: '',
    newBuilding: '',
    oldBuilding: '',
    swimmingpool: '',
    minergieGeneral: '',
    minergieCertified: '',
  };
}

export function emptyListingDraft(): ListingDraft {
  return {
    offerType: 'SALE',
    category: 'APPT',
    objectType: 1,
    refProperty: '',
    street: '',
    zip: '',
    city: '',
    canton: '',
    country: 'CH',
    situation: '',
    lat: null,
    lng: null,
    title: '',
    description: '',
    availableFrom: '',
    url: '',
    sellingPrice: '',
    rentNet: '',
    rentExtra: '',
    priceUnit: '',
    currency: 'CHF',
    floor: '',
    rooms: '',
    apartments: '',
    surfaceLiving: '',
    surfaceProperty: '',
    surfaceUsable: '',
    volume: '',
    yearBuilt: '',
    yearRenovated: '',
    numberOfFloors: '',
    features: emptyListingFeatures(),
    agencyId: '',
    agencyName: '',
    agencyReference: '',
    agencyPhone: '',
    agencyEmail: '',
    visitName: '',
    visitPhone: '',
    visitRemark: '',
    images: [],
  };
}
