const LS_KEY = 'swissnovo:avatar_id';
const DEFAULT_PROFILE_URL = 'https://res.zeroo.ch/res_api/swissnovo_user/profile';

const PROFILE_URL =
  (import.meta.env.VITE_PROFILE_API_URL as string | undefined)?.trim() ||
  DEFAULT_PROFILE_URL;

let warnedAboutRemote = false;

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
    const res = await fetch(PROFILE_URL, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { avatar_icon?: string | null };
    const id = data?.avatar_icon;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

export async function saveAvatarId(id: string, accessToken: string | undefined): Promise<void> {
  writeLocal(id);
  if (!accessToken) return;
  try {
    const res = await fetch(PROFILE_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ avatar_icon: id }),
    });
    if (!res.ok && !warnedAboutRemote && import.meta.env.DEV) {
      warnedAboutRemote = true;
      console.info('[avatar] RES API profile PUT returned', res.status, '— using localStorage only.');
    }
  } catch {
    /* network error — localStorage already saved */
  }
}
