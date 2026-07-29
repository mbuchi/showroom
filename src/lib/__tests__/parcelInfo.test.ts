import { describe, it, expect } from 'vitest';
import { normalizeParcelProps } from '../parcelInfo';

describe('normalizeParcelProps', () => {
  it('maps a representative parcel_data properties object', () => {
    const info = normalizeParcelProps(
      {
        address: 'Bahnhofstrasse 1',
        zip: 8001,
        cityname: 'Zürich',
        cz_canton_name: 'ZH',
        parcel_id: 'CH807151234567',
        parcel_area: 6499.16,
        bldg_size: 420,
        bldg_vol_sb3dgdb: 1850,
        bldg_vol_gwr: 1900,
        bldg_flats: 8,
        bldg_rooms: 3.5,
        bldg_floors: 5,
        bldg_count: 4,
        bldg_constr_year: 1897,
        cz_local: 'W3 Wohnzone',
        estimated_price_m2: 13062.08,
      },
      47.3768,
      8.5395,
    );
    expect(info).toEqual({
      address: 'Bahnhofstrasse 1',
      locality: '8001 Zürich ZH',
      egrid: 'CH807151234567',
      buildingSizeM2: 420,
      buildingVolumeM3: 1850,
      flats: 8,
      zone: 'W3 Wohnzone',
      lat: 47.3768,
      lng: 8.5395,
      zip: '8001',
      city: 'Zürich',
      canton: 'ZH',
      parcelAreaM2: 6499.16,
      constructionYear: 1897,
      buildingFloors: 5,
      buildingRooms: 3.5,
      buildingCount: 4,
      pricePerM2Living: 13062.08,
    });
  });

  it('normalizes missing, null, zero and negative fields to null', () => {
    const info = normalizeParcelProps(
      {
        address: '',
        bldg_size: 0,
        bldg_vol_sb3dgdb: -5,
        bldg_flats: null,
        cz_abbrev: '   ',
        parcel_area: 0,
        bldg_constr_year: null,
        bldg_floors: null,
        bldg_rooms: null,
        bldg_count: null,
        estimated_price_m2: null,
      },
      47,
      8,
    );
    expect(info.address).toBeNull();
    expect(info.locality).toBeNull();
    expect(info.egrid).toBeNull();
    expect(info.buildingSizeM2).toBeNull();
    expect(info.buildingVolumeM3).toBeNull();
    expect(info.flats).toBeNull();
    expect(info.zone).toBeNull();
    expect(info.zip).toBeNull();
    expect(info.city).toBeNull();
    expect(info.canton).toBeNull();
    expect(info.parcelAreaM2).toBeNull();
    expect(info.constructionYear).toBeNull();
    expect(info.buildingFloors).toBeNull();
    expect(info.buildingRooms).toBeNull();
    expect(info.buildingCount).toBeNull();
    expect(info.pricePerM2Living).toBeNull();
    expect(info.lat).toBe(47);
    expect(info.lng).toBe(8);
  });

  it('assembles locality skipping blank components', () => {
    const info = normalizeParcelProps(
      { zip: 3000, cityname: '', canton: 'BE' },
      47,
      8,
    );
    expect(info.locality).toBe('3000 BE');
  });

  it('prefers cz_local for the zone and falls back to cz_abbrev', () => {
    const long = 'Zone für öffentliche Bauten: max. 4 Vollgeschosse, Höhe 16 m';
    expect(normalizeParcelProps({ cz_local: long, cz_abbrev: 'OeB' }, 47, 8).zone).toBe(long);
    expect(normalizeParcelProps({ cz_abbrev: 'W3' }, 47, 8).zone).toBe('W3');
    expect(normalizeParcelProps({}, 47, 8).zone).toBeNull();
  });

  it('reads the canton from cz_canton_name, uppercased, and rejects non-2-letter values', () => {
    expect(normalizeParcelProps({ cz_canton_name: 'zh' }, 47, 8).canton).toBe('ZH');
    expect(normalizeParcelProps({ canton: 'be' }, 47, 8).canton).toBe('BE');
    expect(normalizeParcelProps({ cz_canton_name: 'Zürich', canton: 'ZH' }, 47, 8).canton).toBe('ZH');
    expect(normalizeParcelProps({ cz_canton_name: 'Zürich' }, 47, 8).canton).toBeNull();
    expect(normalizeParcelProps({ cz_canton_name: 'Z' }, 47, 8).canton).toBeNull();
    expect(normalizeParcelProps({ cz_canton_name: 26 }, 47, 8).canton).toBeNull();
  });

  it('keeps the canton out of the locality when it is not a 2-letter code', () => {
    const info = normalizeParcelProps({ zip: 8001, cityname: 'Zürich', cz_canton_name: 'Zürich' }, 47, 8);
    expect(info.locality).toBe('8001 Zürich');
  });

  it('guards constructionYear to a plausible integer calendar year', () => {
    expect(normalizeParcelProps({ bldg_constr_year: 1897 }, 47, 8).constructionYear).toBe(1897);
    expect(normalizeParcelProps({ bldg_constr_year: '2015' }, 47, 8).constructionYear).toBe(2015);
    expect(normalizeParcelProps({ bldg_constr_year: 999 }, 47, 8).constructionYear).toBeNull();
    expect(normalizeParcelProps({ bldg_constr_year: 9999 }, 47, 8).constructionYear).toBeNull();
    expect(normalizeParcelProps({ bldg_constr_year: 1897.5 }, 47, 8).constructionYear).toBeNull();
  });
});
