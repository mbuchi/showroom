export interface AvatarOption {
  id: string;
  label: string;
  style: 'fun-emoji' | 'bottts' | 'big-ears' | 'adventurer' | 'lorelei' | 'thumbs';
  seed: string;
}

const DICEBEAR = 'https://api.dicebear.com/9.x';

export const avatarOptions: AvatarOption[] = [
  { id: 'fox',      label: 'Fox',      style: 'fun-emoji', seed: 'Felix' },
  { id: 'panda',    label: 'Panda',    style: 'fun-emoji', seed: 'Aneka' },
  { id: 'tiger',    label: 'Tiger',    style: 'fun-emoji', seed: 'Sasha' },
  { id: 'koala',    label: 'Koala',    style: 'fun-emoji', seed: 'Bandit' },
  { id: 'owl',      label: 'Owl',      style: 'big-ears',  seed: 'Salem' },
  { id: 'rabbit',   label: 'Rabbit',   style: 'big-ears',  seed: 'Pixie' },
  { id: 'cat',      label: 'Cat',      style: 'big-ears',  seed: 'Mochi' },
  { id: 'dog',      label: 'Dog',      style: 'big-ears',  seed: 'Biscuit' },
  { id: 'bot-mint', label: 'Mint Bot', style: 'bottts',    seed: 'Sprout' },
  { id: 'bot-rose', label: 'Rose Bot', style: 'bottts',    seed: 'Cocoa' },
  { id: 'bot-sky',  label: 'Sky Bot',  style: 'bottts',    seed: 'Comet' },
  { id: 'bot-sun',  label: 'Sun Bot',  style: 'bottts',    seed: 'Honey' },
  { id: 'explorer', label: 'Explorer', style: 'adventurer', seed: 'Atlas' },
  { id: 'voyager',  label: 'Voyager',  style: 'adventurer', seed: 'River' },
  { id: 'lorelei',  label: 'Pal',      style: 'lorelei',   seed: 'Maple' },
  { id: 'thumbs',   label: 'Star',     style: 'thumbs',    seed: 'Nova' },
];

export function avatarUrl(opt: AvatarOption): string {
  return `${DICEBEAR}/${opt.style}/svg?seed=${encodeURIComponent(opt.seed)}&radius=50`;
}

export function avatarUrlById(id: string | null | undefined): string | null {
  if (!id) return null;
  const opt = avatarOptions.find((a) => a.id === id);
  return opt ? avatarUrl(opt) : null;
}
