// The five Aireon apps the reporter recreates as live widget cards.
// Single source of truth for their identity, live URL and deep-link shape.

export type ReporterAppId = 'valoo' | 'roofs' | 'roots' | 'soolar' | 'boom';

export interface ReporterApp {
  id: ReporterAppId;
  label: string;
  /** One-line description of what the card shows. */
  blurb: string;
  /** Live app base URL (no trailing slash). */
  baseUrl: string;
}

export const REPORTER_APPS: ReporterApp[] = [
  { id: 'valoo',  label: 'Valoo',  blurb: 'Parcel valuation',     baseUrl: 'https://valoo.aireon.ch' },
  { id: 'roofs',  label: 'Roofs',  blurb: 'Building height',      baseUrl: 'https://roofs.aireon.ch' },
  { id: 'roots',  label: 'Roots',  blurb: 'Construction year',    baseUrl: 'https://roots.aireon.ch' },
  { id: 'soolar', label: 'Soolar', blurb: 'Solar PV potential',   baseUrl: 'https://soolar.aireon.ch' },
  { id: 'boom',   label: 'Boom',   blurb: 'Road-noise exposure',  baseUrl: 'https://boom.aireon.ch' },
];

/** Look an app up by id. */
export function reporterApp(id: ReporterAppId): ReporterApp {
  const app = REPORTER_APPS.find((a) => a.id === id);
  if (!app) throw new Error(`Unknown reporter app: ${id}`);
  return app;
}

/** Build a `?lat&lng` deep link into the live app at a location. */
export function deepLink(app: ReporterApp, lat: number, lng: number): string {
  return `${app.baseUrl}/?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`;
}
