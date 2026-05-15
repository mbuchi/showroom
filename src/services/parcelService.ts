import type { Parcel } from '../types/parcel';
import { userManager } from '@swissnovo/shared';

const API_BASE = 'https://res.zeroo.ch/res_api/swissnovo_user';

async function getAccessToken(): Promise<string> {
  const user = await userManager.getUser();
  if (!user || user.expired) throw new Error('Not authenticated');
  return user.access_token;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export function fetchParcels(): Promise<Parcel[]> {
  return request<Parcel[]>('/parcels');
}
