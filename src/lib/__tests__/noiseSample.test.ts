import { describe, it, expect } from 'vitest';
import { nearestBand, wmtsTemplate, NOISE_BANDS } from '../noiseSample';

describe('noiseSample', () => {
  it('snaps each exact ramp colour to its own band', () => {
    for (const band of NOISE_BANDS) {
      const [r, g, b] = band.rgb;
      expect(nearestBand(r, g, b)?.index).toBe(band.index);
    }
  });

  it('snaps a near-ramp colour to the closest band', () => {
    expect(nearestBand(238, 110, 52)?.label).toBe('55–59.9 dB');
  });

  it('rejects an off-ramp colour', () => {
    expect(nearestBand(12, 200, 12)).toBeNull(); // bright green, not on ramp
  });

  it('builds a WMTS template for a layer id', () => {
    expect(wmtsTemplate('ch.bafu.laerm-strassenlaerm_tag')).toBe(
      'https://wmts.geo.admin.ch/1.0.0/ch.bafu.laerm-strassenlaerm_tag/default/current/3857/{z}/{x}/{y}.png',
    );
  });
});
