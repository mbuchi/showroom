import type { User } from 'oidc-client-ts';

type Profile = User['profile'] | undefined;

function readClaim(p: Profile, key: string): string | undefined {
  const v = (p as Record<string, unknown> | undefined)?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

export function emailOf(user: User | null | undefined): string {
  return readClaim(user?.profile, 'email') ?? '';
}

export function fullNameOf(user: User | null | undefined): string {
  const p = user?.profile;
  const name = readClaim(p, 'name');
  if (name) return name;
  const given = readClaim(p, 'given_name');
  const family = readClaim(p, 'family_name');
  const combined = [given, family].filter(Boolean).join(' ').trim();
  if (combined) return combined;
  return readClaim(p, 'preferred_username') ?? '';
}

export function firstNameOf(user: User | null | undefined): string {
  const given = readClaim(user?.profile, 'given_name');
  if (given) return given;
  const full = fullNameOf(user);
  if (full) {
    const head = full.split(/\s+/)[0];
    if (head) return head;
  }
  const email = emailOf(user);
  if (email.includes('@')) return email.split('@')[0]!;
  return email || 'Account';
}

export function initialsOf(user: User | null | undefined): string {
  const full = fullNameOf(user);
  const source = full || emailOf(user);
  if (!source) return '?';
  if (source.includes('@')) return source[0]!.toUpperCase();
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((p) => p[0]!.toUpperCase()).join('');
  return letters || source[0]!.toUpperCase();
}
