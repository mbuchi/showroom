import { useState } from 'react';

interface AvatarProps {
  url: string | null;
  initials: string;
  size?: number;
  isDarkMode?: boolean;
  className?: string;
}

export function Avatar({ url, initials, size = 28, isDarkMode = false, className = '' }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const show = url && !errored;

  const fallback = (
    <span
      className={`rounded-full flex items-center justify-center font-semibold ${
        isDarkMode ? 'bg-sky-600 text-white' : 'bg-sky-600 text-white'
      } ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {initials}
    </span>
  );

  if (!show) return fallback;

  return (
    <img
      src={url!}
      alt=""
      width={size}
      height={size}
      onError={() => setErrored(true)}
      className={`rounded-full bg-white object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
