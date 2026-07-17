import { useEffect, useRef, useState } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS, type CallBackProps, type Step } from 'react-joyride';
import { useI18n } from '../contexts/I18nContext';
import { useRoute } from '../lib/router';

/** True when the selector resolves to an element that is actually laid out
 *  (present in the DOM, not `display:none`, and with a real box).
 *  react-joyride STALLS on a missing or hidden target, so every step is
 *  probed against the live DOM right before the tour starts (same pattern
 *  as the voogle/choose/scoops tours). This is what drops the navbar steps
 *  on phones (the nav links and search collapse below `sm`) and the
 *  reporter steps that only exist once a location or parcel is resolved. */
function laidOut(selector: string): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.querySelector(selector);
  if (!el) return false;
  const rects = el.getClientRects();
  return rects.length > 0 && (rects[0].width > 0 || rects[0].height > 0);
}

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string;

/** Steps are assembled per route and probed at call time - NEVER at module or
 *  render scope, because the React Compiler would memoize the array and the
 *  DOM probes would go stale (the suite-wide "compiler-safe step list" fix). */
function buildSteps(t: TranslateFn, pathname: string): Step[] {
  const candidates: Step[] =
    pathname === '/reporter'
      ? [
          // Reporter: search is always there; the actions row + widget grid
          // render only once a location is in the URL, and Claire's launcher
          // only once the parcel resolves - all gated by the laidOut probe.
          { target: '[data-tour="reporter-search"]', content: t('tour.reporter_search'), disableBeacon: true, placement: 'bottom' },
          { target: '[data-tour="report-grid"]', content: t('tour.report_grid'), disableBeacon: true, placement: 'top' },
          { target: '[data-tour="report-actions"]', content: t('tour.report_actions'), disableBeacon: true, placement: 'bottom' },
          { target: '[data-tour="claire"] button', content: t('tour.claire'), disableBeacon: true, placement: 'left' },
        ]
      : [
          // Gallery (the entry view): toolbar + content shell are always
          // rendered, even while loading (skeletons) or empty.
          { target: '[data-tour="gallery-content"]', content: t('tour.gallery'), disableBeacon: true, placement: 'top' },
          { target: '[data-tour="gallery-toolbar"]', content: t('tour.toolbar'), disableBeacon: true, placement: 'bottom' },
          { target: '[data-tour="gallery-search"]', content: t('tour.search'), disableBeacon: true, placement: 'bottom' },
        ];

  // Shared navbar chrome, present on both routes.
  candidates.push(
    { target: '[data-tour="nav-links"]', content: t('tour.nav'), disableBeacon: true, placement: 'bottom' },
    { target: '[data-tour="account-menu"]', content: t('tour.account'), disableBeacon: true, placement: 'bottom' },
  );

  return candidates.filter((s) => typeof s.target === 'string' && laidOut(s.target));
}

interface TourSession {
  steps: Step[];
  isDark: boolean;
  pathname: string;
}

/** Suite tour standard: translucent tint + spotlight only - NO backdrop blur
 *  (removed suite-wide 2026-06-09). Colors follow the app's cyan accent and
 *  flip with the theme; showroom is dark-first but honors the shared cookie. */
function buildStyles(isDark: boolean) {
  return {
    options: {
      zIndex: 10000,
      arrowColor: isDark ? '#0b1220' : '#ffffff',
      backgroundColor: isDark ? '#0b1220' : '#ffffff',
      primaryColor: isDark ? '#06b6d4' : '#0891b2',
      textColor: isDark ? '#e2e8f0' : '#0f172a',
      overlayColor: isDark ? 'rgba(2, 6, 23, 0.62)' : 'rgba(15, 23, 42, 0.42)',
    },
    tooltip: {
      borderRadius: 14,
      border: isDark ? '1px solid rgba(148, 163, 184, 0.16)' : '1px solid rgba(15, 23, 42, 0.08)',
    },
    tooltipContent: { fontSize: 14, lineHeight: 1.55 },
    spotlight: { borderRadius: 12 },
    buttonNext: { borderRadius: 8, fontWeight: 600, color: isDark ? '#04141a' : '#ffffff' },
    buttonBack: { color: '#94a3b8' },
    buttonSkip: { color: '#64748b' },
    // Skip (footer) is the only dismiss path - suite standard hides the X.
    buttonClose: { display: 'none' },
  };
}

/**
 * Guided onboarding tour (react-joyride v2). Mounted by the app shell only
 * while a tour is wanted: on a visitor's first run (localStorage-gated) or
 * after the account menu's "Take the tour" row fires TOUR_REQUEST_EVENT.
 * `onClose(completed)` unmounts it; completed=true stamps the seen flag.
 */
export function Tour({ onClose }: { onClose: (completed: boolean) => void }) {
  const { t } = useI18n();
  const { pathname } = useRoute();
  const [session, setSession] = useState<TourSession | null>(null);

  // Refs so the mount-once launch effect always reads the live t/onClose
  // without re-arming its timers on every render.
  const tRef = useRef(t);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    tRef.current = t;
    onCloseRef.current = onClose;
  });

  // Launch shortly after mount. The 900 ms grace lets the route settle
  // (auth just resolved, gallery list loading, reporter chunk streaming in).
  // If no target is laid out yet, retry once, then give up WITHOUT marking
  // the tour as seen so the next visit tries again.
  useEffect(() => {
    let timer: number;
    let retried = false;
    const attempt = () => {
      const steps = buildSteps(tRef.current, window.location.pathname);
      if (steps.length > 0) {
        setSession({
          steps,
          isDark: document.documentElement.classList.contains('dark'),
          pathname: window.location.pathname,
        });
        return;
      }
      if (!retried) {
        retried = true;
        timer = window.setTimeout(attempt, 1800);
        return;
      }
      onCloseRef.current(false);
    };
    timer = window.setTimeout(attempt, 900);
    return () => window.clearTimeout(timer);
  }, []);

  // The steps were probed for the route they started on; if the route changes
  // mid-tour (browser back), the targets are gone - close instead of stalling.
  useEffect(() => {
    if (session && pathname !== session.pathname) onClose(true);
  }, [session, pathname, onClose]);

  if (!session) return null;

  const handleCallback = (data: CallBackProps) => {
    const finished = ([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(data.status);
    const closed = data.action === ACTIONS.CLOSE && data.type === EVENTS.STEP_AFTER;
    if (finished || closed) onClose(true);
  };

  return (
    <Joyride
      run
      steps={session.steps}
      continuous
      showSkipButton
      showProgress
      disableScrolling
      scrollToFirstStep={false}
      callback={handleCallback}
      locale={{
        back: t('tour.back'),
        close: t('tour.close'),
        last: t('tour.done'),
        next: t('tour.next'),
        skip: t('tour.skip'),
      }}
      styles={buildStyles(session.isDark)}
    />
  );
}
