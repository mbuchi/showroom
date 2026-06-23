// Node serverless function.
//
// Forwards Claire's surrounding-POI lookups to the RES backend's
// `/score/poi-osm` endpoint (local PostGIS dataset, ~100 ms). Mirrors
// scoore's `/api/overpass` proxy - same shape, dedicated path for Claire.
export const config = { maxDuration: 15 };

const RES_POI_URL = "https://res.zeroo.ch/score/poi-osm";
const RES_API_TOKEN = "DNfbHaqajFigz4jPX9B8vnatUduLKZXVwA83WKZG";
const UPSTREAM_TIMEOUT_MS = 12000;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Client-IP, X-User-Token",
};

interface NodeReq {
  method?: string;
  body?: unknown;
}

interface NodeRes {
  setHeader(name: string, value: string): void;
  status(code: number): NodeRes;
  json(body: unknown): void;
  end(): void;
}

function send(res: NodeRes, status: number, body: unknown): void {
  for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
  res.status(status).json(body);
}

export default async function handler(req: NodeReq, res: NodeRes): Promise<void> {
  if (req.method === "OPTIONS") {
    for (const [k, v] of Object.entries(CORS_HEADERS)) res.setHeader(k, v);
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  let body: { lat?: unknown; lng?: unknown } | undefined;
  if (typeof req.body === "string") {
    try {
      body = JSON.parse(req.body);
    } catch {
      send(res, 400, { error: "Invalid JSON body" });
      return;
    }
  } else {
    body = req.body as { lat?: unknown; lng?: unknown } | undefined;
  }

  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    send(res, 400, { error: "Missing or invalid 'lat'/'lng'" });
    return;
  }

  const url = `${RES_POI_URL}?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const upstream = await fetch(url, {
      headers: { token: RES_API_TOKEN },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      send(res, 502, {
        error: "POI service error",
        details: `RES /score/poi-osm returned HTTP ${upstream.status}`,
      });
      return;
    }
    const data = await upstream.json();
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=86400, stale-while-revalidate=604800"
    );
    send(res, 200, data);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    send(res, 502, { error: "POI service unreachable", details: msg });
  } finally {
    clearTimeout(timer);
  }
}
