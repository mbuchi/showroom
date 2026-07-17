// Guided-tour plumbing shared between the lazy Tour component (which pulls in
// react-joyride) and the always-eager chrome (account menu, app shell). Kept
// separate from Tour.tsx so importing these helpers never drags the joyride
// chunk into the eager bundle.

/** localStorage flag - set once the visitor finishes or skips the tour. */
const COMPLETED_KEY = 'showroom:tourCompleted';

/** Window event dispatched by the account menu's "Take the tour" row. */
export const TOUR_REQUEST_EVENT = 'showroom:tour:start';

export function hasCompletedTour(): boolean {
  try {
    return localStorage.getItem(COMPLETED_KEY) !== null;
  } catch {
    // Storage blocked (private mode / embedded) - never auto-start, or the
    // tour would replay on every single visit.
    return true;
  }
}

export function markTourCompleted(): void {
  try {
    localStorage.setItem(COMPLETED_KEY, new Date().toISOString());
  } catch {
    // Best effort - worst case the tour auto-runs again next visit.
  }
}

/** Ask the app shell to (re)launch the guided tour. */
export function requestTour(): void {
  window.dispatchEvent(new Event(TOUR_REQUEST_EVENT));
}
