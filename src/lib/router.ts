import { useEffect, useState } from 'react';

// Showroom is a two-page app (gallery + reporter); a full router would be
// overkill. This is a minimal pushState wrapper so navigation stays a SPA
// transition instead of a full reload (which would re-run the auth boot).

export interface Location {
  pathname: string;
  search: string;
}

function currentLocation(): Location {
  return { pathname: window.location.pathname, search: window.location.search };
}

export function navigate(to: string): void {
  if (to === window.location.pathname + window.location.search) return;
  window.history.pushState({}, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function useRoute(): Location {
  const [loc, setLoc] = useState<Location>(currentLocation);
  useEffect(() => {
    const onPop = () => setLoc(currentLocation());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return loc;
}
