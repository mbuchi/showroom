import { describe, it, expect } from 'vitest';
import { normalizeParcelProps } from '../parcelInfo';

describe('normalizeParcelProps', () => {
  it('maps a representative parcel_data properties object', () => {
    const info = normalizeParcelProps(
      {
        address: 'Bahnhofstrasse 1',
        zip: 8001,
        cityname: 'Zürich',
        canton: 'ZH',
        parcel_id: 'CH807151234567',
        bldg_size: 420,
        bldg_vol_sb3dgdb: 1850,
        bldg_flats: 8,
        cz_abbrev: 'W3',
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
      zone: 'W3',
      lat: 47.3768,
      lng: 8.5395,
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
});
