import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const rawAuthority = import.meta.env.VITE_ZITADEL_AUTHORITY as string | undefined;
const rawClientId = import.meta.env.VITE_ZITADEL_CLIENT_ID as string | undefined;
const origin = window.location.origin;

// Vite inlines env vars at *build* time. If the deploy target (e.g. Vercel)
// doesn't have these set, both reads come back undefined and oidc-client-ts
// throws an opaque "Error: client_id" on the first signinRedirect. Surface
// that clearly instead of dying silently in the console.
export const missingAuthEnvVars: string[] = [
  ...(rawAuthority ? [] : ['VITE_ZITADEL_AUTHORITY']),
  ...(rawClientId ? [] : ['VITE_ZITADEL_CLIENT_ID']),
];
export const isAuthConfigured = missingAuthEnvVars.length === 0;

const authority = rawAuthority || 'https://auth.invalid';
const clientId = rawClientId || 'missing-client-id';

export const userManager = new UserManager({
  authority,
  client_id: clientId,
  redirect_uri: `${origin}/`,
  post_logout_redirect_uri: `${origin}/`,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  monitorSession: false,
  // Default is 10s — way too long to leave a freshly-loaded SPA hanging when
  // there's no active Zitadel session. 4s is plenty for a same-origin iframe
  // round-trip and falls back to the sign-in gate quickly otherwise.
  silentRequestTimeoutInSeconds: 4,
  metadata: {
    issuer: authority,
    authorization_endpoint: `${authority}/oauth/v2/authorize`,
    token_endpoint: `${authority}/oauth/v2/token`,
    userinfo_endpoint: `${authority}/oidc/v1/userinfo`,
    end_session_endpoint: `${authority}/oidc/v1/end_session`,
    revocation_endpoint: `${authority}/oauth/v2/revoke`,
    introspection_endpoint: `${authority}/oauth/v2/introspect`,
    jwks_uri: `${authority}/oauth/v2/keys`,
  },
});
