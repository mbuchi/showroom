import { describe, it, expect } from 'vitest';
import { REPORTER_APPS, reporterApp, deepLink } from '../reporterApps';

describe('reporterApps', () => {
  it('lists the 5 reporter apps in order', () => {
    expect(REPORTER_APPS.map((a) => a.id)).toEqual([
      'valoo', 'roofs', 'roots', 'soolar', 'boom',
    ]);
  });

  it('looks an app up by id', () => {
    expect(reporterApp('soolar').label).toBe('Soolar');
  });

  it('throws on an unknown app id', () => {
    // @ts-expect-error — exercising the runtime guard
    expect(() => reporterApp('nope')).toThrow();
  });

  it('builds a ?lat&lng deep link for an app', () => {
    expect(deepLink(reporterApp('valoo'), 47.3769, 8.5417)).toBe(
      'https://swissnovo-valoo.vercel.app/?lat=47.376900&lng=8.541700',
    );
  });
});
