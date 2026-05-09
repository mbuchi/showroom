import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const authority = import.meta.env.VITE_ZITADEL_AUTHORITY;
const origin = window.location.origin;

export const userManager = new UserManager({
  authority,
  client_id: import.meta.env.VITE_ZITADEL_CLIENT_ID,
  redirect_uri: `${origin}/`,
  post_logout_redirect_uri: `${origin}/`,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  monitorSession: false,
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
