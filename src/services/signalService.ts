// Address-search signal collection.
//
// When a user picks an address, we POST a lightweight signal to the shared
// RES API (res.zeroo.ch) — the same telemetry every map/data app in the
// SwissNovo suite emits. The request goes through the /api/signal-collect
// Vercel edge function, which attaches the server-side bearer token and
// forwards the client IP so the RES API can geolocate the visitor.

const SIGNAL_ENDPOINT = '/api/signal-collect';
const APP_NAME = 'showroom';

interface AddressSearchSignal {
  /** Human-readable address the user selected. */
  address: string;
  /** WGS84 latitude of the searched address. */
  lat: number;
  /** WGS84 longitude of the searched address. */
  lng: number;
}

/**
 * Fire-and-forget: reports an address search to the RES API. Never throws —
 * telemetry must not interfere with the search flow.
 */
export async function sendAddressSearchSignal({
  address,
  lat,
  lng,
}: AddressSearchSignal): Promise<void> {
  try {
    await fetch(SIGNAL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_name: APP_NAME,
        user_action: 'Search for Address',
        lat,
        lng,
        target_address: address,
        target_lat: lat,
        target_lng: lng,
      }),
    });
  } catch (err) {
    console.error('Signal collection error:', err);
  }
}
