// Vercel Edge Function: /api/signal-collect
//
// Forwards address-search signals to the shared res.zeroo.ch signal endpoint
// with a server-side bearer token. The client IP is preserved via
// X-Forwarded-For so the RES API can geolocate the originating user even
// though the request hops through Vercel. Mirrors the signal-collect proxy
// used across the SwissNovo suite (roots, choose, roofs, …).

export const config = {
  runtime: "edge",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

const DEFAULT_SIGNAL_API_URL = "https://res.zeroo.ch/res_api/signal/collect";
const DEFAULT_API_TOKEN =
  "Bearer JNpkPe-PFAZh8iQ6H63aiJXwGA3Hov.LP3tjijxF6PAtACakK*x!Yxj4TcXQAGe**CLzFbh7yUZxBvDKnPZBa*x4sC";

function readEnv(...names: string[]): string | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  if (env) {
    for (const name of names) {
      const value = env[name];
      if (value) return value;
    }
  }
  const denoEnv = (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env;
  if (denoEnv) {
    for (const name of names) {
      const value = denoEnv.get(name);
      if (value) return value;
    }
  }
  return undefined;
}

const SIGNAL_API_URL =
  readEnv("SIGNAL_API_URL", "VITE_SIGNAL_API_URL") ?? DEFAULT_SIGNAL_API_URL;
const API_TOKEN_RAW = readEnv(
  "SIGNAL_API_TOKEN",
  "VITE_SIGNAL_API_TOKEN",
  "SIGNAL_API_BEARER",
);
const API_TOKEN = API_TOKEN_RAW
  ? API_TOKEN_RAW.startsWith("Bearer ")
    ? API_TOKEN_RAW
    : `Bearer ${API_TOKEN_RAW}`
  : DEFAULT_API_TOKEN;

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { client_ip, ...signalData } = body;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: API_TOKEN,
    };

    const forwardedFor =
      client_ip ??
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip");
    if (forwardedFor) {
      headers["X-Forwarded-For"] = forwardedFor;
    }

    const response = await fetch(SIGNAL_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(signalData),
    });

    const responseData = await response.text();

    return new Response(responseData, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
}
