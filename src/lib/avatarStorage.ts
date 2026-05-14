const LS_KEY = 'swissnovo:avatar_id';
const ZITADEL_AUTHORITY = 'https://swissnovo-ekqvxs.ch1.zitadel.cloud';
const METADATA_KEY = 'avatar_id';

let warnedAboutZitadel = false;

export function loadLocalAvatarId(): string | null {
  try {
    return window.localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

function writeLocal(id: string | null) {
  try {
    if (id) window.localStorage.setItem(LS_KEY, id);
    else window.localStorage.removeItem(LS_KEY);
  } catch {
    /* ignore */
  }
}

export async function fetchRemoteAvatarId(accessToken: string | undefined): Promise<string | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch(`${ZITADEL_AUTHORITY}/auth/v1/users/me/metadata/${METADATA_KEY}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { metadata?: { value?: string } };
    const b64 = data?.metadata?.value;
    if (!b64) return null;
    return atob(b64);
  } catch {
    return null;
  }
}

export async function saveAvatarId(id: string, accessToken: string | undefined): Promise<void> {
  writeLocal(id);
  if (!accessToken) return;
  try {
    const res = await fetch(`${ZITADEL_AUTHORITY}/auth/v1/users/me/metadata/${METADATA_KEY}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: btoa(id) }),
    });
    if (!res.ok && !warnedAboutZitadel && import.meta.env.DEV) {
      warnedAboutZitadel = true;
      console.info('[avatar] ZITADEL metadata write returned', res.status, '— using localStorage only. Configure user.metadata.write scope on the project to sync across apps.');
    }
  } catch {
    /* network error — localStorage already saved */
  }
}
