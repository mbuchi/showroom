import { useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Search, Sparkles, ChevronDown, ChevronUp, ExternalLink, GitPullRequest, Tag,
} from 'lucide-react';
import { RELEASES, KIND_META, REPO_URL, type ChangeKind } from '../data/releaseNotes';

interface ReleaseNotesPanelProps {
  onClose: () => void;
}

const FILTERS: { kind: ChangeKind | 'all'; label: string }[] = [
  { kind: 'all', label: 'All' },
  { kind: 'new', label: 'New' },
  { kind: 'improved', label: 'Improved' },
  { kind: 'fixed', label: 'Fixed' },
  { kind: 'docs', label: 'Docs' },
];

const ReleaseNotesPanel = ({ onClose }: ReleaseNotesPanelProps) => {
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChangeKind | 'all'>('all');
  const [openVersions, setOpenVersions] = useState<Record<string, boolean>>(() => ({
    [RELEASES[0].version]: true,
  }));
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const toggle = (v: string) =>
    setOpenVersions((prev) => ({ ...prev, [v]: !prev[v] }));

  const filteredReleases = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RELEASES.map((release) => {
      const items = release.items.filter((item) => {
        const kindOk = activeFilter === 'all' || item.kind === activeFilter;
        const queryOk =
          !q ||
          item.text.toLowerCase().includes(q) ||
          release.codename.toLowerCase().includes(q) ||
          release.version.includes(q) ||
          item.prs.some((n) => `#${n}`.includes(q) || String(n) === q);
        return kindOk && queryOk;
      });
      return { ...release, items };
    }).filter((r) => r.items.length > 0);
  }, [query, activeFilter]);

  const totals = useMemo(() => {
    const all = RELEASES.flatMap((r) => r.items);
    return {
      releases: RELEASES.length,
      changes: all.length,
      latest: RELEASES[0],
    };
  }, []);

  const latest = totals.latest;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-end transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Release notes"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className={`relative w-full max-w-3xl h-full overflow-hidden flex flex-col transition-transform duration-200 bg-ink-900 text-gray-100 border-l border-white/5 ${
          visible ? 'translate-x-0' : 'translate-x-6'
        }`}
      >
        {/* Header */}
        <div className="relative shrink-0 px-6 pt-6 pb-5 border-b border-white/5">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors text-gray-500 hover:text-gray-200 hover:bg-ink-800"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-cyan-500/15 border border-cyan-500/30">
              <Sparkles className="text-cyan-400" size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-gray-50">
                What's new in{' '}
                <span className="font-normal font-varela">
                  showr<span className="text-red-600">oo</span>m
                </span>
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">
                Every shipped change, grouped by version. Latest release{' '}
                <span className="font-mono font-semibold text-cyan-400">v{latest.version}</span>{' '}
                · <span className="font-medium">{latest.codename}</span> · {latest.date}.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  v{latest.version} live
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-800 text-gray-300 border border-white/5">
                  <Tag size={12} /> {totals.releases} releases
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-800 text-gray-300 border border-white/5">
                  <GitPullRequest size={12} /> {totals.changes} changes
                </span>
                <a
                  href={`${REPO_URL}/pulls?q=is%3Apr+is%3Aclosed`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors bg-ink-800 text-gray-300 border border-white/5 hover:bg-ink-700 hover:text-gray-100"
                >
                  <ExternalLink size={12} /> View all PRs
                </a>
              </div>
            </div>
          </div>

          {/* Search + filter row */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search changes, versions, or PR numbers… ( / to focus)"
                className="w-full h-9 pl-9 pr-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/40 transition-colors bg-ink-800/70 border border-white/5 text-gray-100 placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {FILTERS.map((f) => {
                const active = activeFilter === f.kind;
                return (
                  <button
                    key={f.kind}
                    onClick={() => setActiveFilter(f.kind)}
                    className={`px-2.5 h-7 rounded-full text-xs font-medium transition-colors border ${
                      active
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        : 'bg-transparent border-white/5 text-gray-400 hover:text-gray-200 hover:border-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto thin-scrollbar px-6 py-6">
          {filteredReleases.length === 0 && (
            <div className="text-center py-16 rounded-2xl border-2 border-dashed border-white/10 text-gray-500">
              <p className="text-sm">No changes match that filter.</p>
            </div>
          )}

          <ol className="relative space-y-5">
            {filteredReleases.map((release, idx) => {
              const isOpen = openVersions[release.version] ?? false;
              const isLatest = idx === 0 && release.version === RELEASES[0].version;
              return (
                <li key={release.version} className="relative">
                  {/* Vertical timeline rail */}
                  {idx < filteredReleases.length - 1 && (
                    <span
                      className="absolute left-[18px] top-12 bottom-[-20px] w-px bg-white/5"
                      aria-hidden
                    />
                  )}

                  <div className="flex items-stretch gap-4">
                    {/* Version dot */}
                    <div className="shrink-0 pt-3">
                      <div
                        className={`relative w-9 h-9 rounded-full flex items-center justify-center ${
                          isLatest
                            ? 'bg-cyan-500/15 border border-cyan-500/40'
                            : 'bg-ink-800 border border-white/5'
                        }`}
                      >
                        <Tag
                          size={14}
                          className={isLatest ? 'text-cyan-400' : 'text-gray-500'}
                        />
                        {isLatest && (
                          <span className="absolute inset-0 rounded-full bg-cyan-500/30 animate-ping opacity-50" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => toggle(release.version)}
                        className="w-full text-left rounded-2xl overflow-hidden border transition-colors bg-ink-850 border-white/5 hover:border-white/10"
                      >
                        <div className="flex items-center gap-3 px-5 py-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold font-mono text-gray-50">
                                v{release.version}
                              </span>
                              <span className="text-gray-600">·</span>
                              <span className="text-sm font-medium text-gray-200">
                                {release.codename}
                              </span>
                              {isLatest && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500 text-ink-950">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5 text-gray-500">
                              {release.date} · {release.items.length} change{release.items.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          {isOpen ? (
                            <ChevronUp size={16} className="text-gray-500" />
                          ) : (
                            <ChevronDown size={16} className="text-gray-500" />
                          )}
                        </div>

                        {isOpen && (
                          <div className="border-t border-white/5 px-5 py-4">
                            <p className="text-sm leading-relaxed text-gray-400">
                              {release.summary}
                            </p>
                          </div>
                        )}
                      </button>

                      {isOpen && (
                        <ul className="mt-3 space-y-2">
                          {release.items.map((item, i) => {
                            const meta = KIND_META[item.kind];
                            const Icon = item.icon;
                            return (
                              <li
                                key={i}
                                className="flex items-start gap-3 rounded-xl px-4 py-3 border transition-colors bg-ink-850/60 border-white/5 hover:border-white/10"
                              >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-ink-800 border border-white/5">
                                  <Icon size={15} className="text-gray-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide border ${meta.classes}`}
                                    >
                                      <span className={`w-1 h-1 rounded-full ${meta.dot}`} />
                                      {meta.label}
                                    </span>
                                    {item.prs.map((n) => (
                                      <a
                                        key={n}
                                        href={`${REPO_URL}/pull/${n}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors bg-ink-800 text-gray-400 hover:text-cyan-300 hover:bg-ink-700"
                                        title={`Pull request #${n}`}
                                      >
                                        <GitPullRequest size={10} />#{n}
                                      </a>
                                    ))}
                                  </div>
                                  <p className="text-sm leading-relaxed text-gray-300">
                                    {item.text}
                                  </p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
          <span>
            Versions follow{' '}
            <a
              href="https://semver.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-cyan-300 underline"
            >
              SemVer
            </a>
            . History is reconstructed from merged pull requests.
          </span>
          <button
            onClick={handleClose}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-md bg-ink-800 text-gray-400 hover:text-gray-200"
          >
            Close <kbd className="font-mono text-[10px]">Esc</kbd>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReleaseNotesPanel;
