import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, FileBarChart, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@aireon/shared';
import type { ReporterAppId } from '../../../lib/reporterApps';
import { REPORTER_APPS, reporterApp } from '../../../lib/reporterApps';
import type { ParcelInfo } from '../../../lib/parcelInfo';
import { useI18n } from '../../../contexts/I18nContext';
import { useAuth } from '../../../auth/AuthContext';
import { signal } from '../../../lib/signal';
import { captureMany } from './captureCard';
import { buildReportPayload, reportFilename } from './buildReport';
import type { WidgetReportRaw } from './types';

type Phase = 'idle' | 'capturing' | 'rendering' | 'ready' | 'error';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  address: string | null;
  parcel: ParcelInfo | null;
  selection: Set<ReporterAppId>;
  rawByWidget: Partial<Record<ReporterAppId, WidgetReportRaw>>;
}

export default function ReportDialog({
  open, onClose, lat, lng, address, parcel, selection, rawByWidget,
}: ReportDialogProps) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFilename, setPdfFilename] = useState<string>('showroom-report.pdf');
  const lastUrlRef = useRef<string | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // On open, remember the triggering element and move focus into the dialog
  // (the close button); on close, restore focus to the trigger so keyboard
  // users are not dropped at the top of the document.
  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => {
      prevFocusRef.current?.focus();
    };
  }, [open]);

  // Revoke the previous blob URL when a new one is generated or when the
  // dialog unmounts — otherwise the browser leaks the PDF blob.
  useEffect(() => {
    return () => {
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    };
  }, []);

  // Auto-run the capture+render pipeline whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (phase !== 'idle') return;
    void runReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedApps = REPORTER_APPS.filter((a) => selection.has(a.id));

  async function runReport() {
    setErrorMsg(null);
    setPdfUrl(null);
    setPhase('capturing');

    try {
      const captureIds = selectedApps.map((a) => `reporter-widget-${a.id}`);
      const snapshotMap = await captureMany(captureIds);

      // Re-key by widget id (captureMany returns by captureId).
      const snapshots: Partial<Record<ReporterAppId, string | null>> = {};
      for (const app of selectedApps) {
        snapshots[app.id] = snapshotMap[`reporter-widget-${app.id}`] ?? null;
      }

      setPhase('rendering');

      // Dynamic import keeps @react-pdf/renderer (~500KB gz) out of the
      // initial reporter chunk — only paid for when the user clicks Generate.
      const [{ pdf }, { default: ReportPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ReportPDF'),
      ]);

      const payload = buildReportPayload({
        lat,
        lng,
        address,
        locale,
        parcel,
        user: {
          name: user?.profile?.name ?? null,
          email: user?.profile?.email ?? null,
        },
        selection,
        rawByWidget,
        snapshots,
        t,
      });

      const blob = await pdf(<ReportPDF payload={payload} />).toBlob();
      const url = URL.createObjectURL(blob);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = url;
      setPdfUrl(url);
      setPdfFilename(reportFilename(payload.reportId));
      setPhase('ready');

      void signal.send('Generate Showroom Report', {
        address: address ?? undefined,
        lat,
        lng,
        metaData: {
          reportId: payload.reportId,
          widgets: selectedApps.map((a) => a.id),
        },
      });
    } catch (err) {
      console.error('Report generation failed', err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase('error');
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink-850 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300">
            <FileBarChart size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="report-dialog-title" className="text-sm font-semibold text-gray-100 truncate">
              {t('report.dialog.title')}
            </h2>
            <p className="text-[11px] text-gray-500 truncate">
              {address ?? `${lat.toFixed(6)}, ${lng.toFixed(6)}`}
            </p>
          </div>
          <button
            type="button"
            ref={closeBtnRef}
            onClick={onClose}
            aria-label={t('report.dialog.close')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-white/5 hover:text-gray-200 focus-ring"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 py-5">
          <PhaseBlock
            phase={phase}
            errorMsg={errorMsg}
            selectedApps={selectedApps.map((a) => a.label)}
            t={t}
          />
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-white/5 px-5 py-3.5">
          <div className="text-[11px] text-gray-500">
            {t('report.dialog.included_count', { n: selectedApps.length })}
          </div>
          <div className="flex items-center gap-2">
            {phase === 'error' && (
              <button
                type="button"
                onClick={runReport}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3.5 text-xs font-semibold text-gray-200 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-200"
              >
                {t('report.dialog.try_again')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3.5 text-xs font-semibold text-gray-300 hover:bg-white/5"
            >
              {t('report.dialog.close')}
            </button>
            {phase === 'ready' && pdfUrl && (
              <a
                href={pdfUrl}
                download={pdfFilename}
                onClick={() =>
                  void signal.send('Download Showroom Report', {
                    metaData: { filename: pdfFilename },
                  })
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-500 px-3.5 text-xs font-semibold text-ink-950 hover:bg-cyan-400"
              >
                <Download size={14} />
                {t('report.dialog.download')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PhaseBlock({
  phase,
  errorMsg,
  selectedApps,
  t,
}: {
  phase: Phase;
  errorMsg: string | null;
  selectedApps: string[];
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  if (phase === 'capturing') {
    return (
      <Stage
        icon={<Skeleton width={18} height={18} radius={5} />}
        title={t('report.dialog.capturing')}
        body={t('report.dialog.capturing_body')}
      >
        <div className="mt-4 flex flex-wrap gap-2">
          {selectedApps.map((_label, i) => (
            <Skeleton key={i} width={88} height={26} radius={6} delay={`${i * 70}ms`} />
          ))}
        </div>
      </Stage>
    );
  }
  if (phase === 'rendering') {
    return (
      <Stage
        icon={<Skeleton width={18} height={18} radius={5} />}
        title={t('report.dialog.rendering')}
        body={t('report.dialog.rendering_body')}
      >
        <div className="mt-4">
          <Skeleton height={120} radius={8} />
        </div>
      </Stage>
    );
  }
  if (phase === 'ready') {
    return (
      <Stage
        icon={<CheckCircle2 size={18} className="text-emerald-400" />}
        title={t('report.dialog.ready')}
        body={t('report.dialog.ready_body')}
      />
    );
  }
  if (phase === 'error') {
    return (
      <Stage
        icon={<AlertTriangle size={18} className="text-red-400" />}
        title={t('report.dialog.error')}
        body={errorMsg ?? t('report.dialog.error_body')}
        tone="error"
      />
    );
  }
  return (
    <Stage
      icon={<FileBarChart size={18} className="text-gray-400" />}
      title={t('report.dialog.ready_to_build')}
      body={t('report.dialog.preamble')}
    />
  );
}

function Stage({
  icon, title, body, children, tone = 'neutral',
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  children?: React.ReactNode;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div className={`rounded-xl border px-4 py-4 ${tone === 'error' ? 'border-red-500/30 bg-red-500/5' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-semibold ${tone === 'error' ? 'text-red-200' : 'text-gray-100'}`}>
            {title}
          </p>
          <p className={`mt-1 text-xs leading-relaxed ${tone === 'error' ? 'text-red-300/80' : 'text-gray-400'}`}>
            {body}
          </p>
          {children}
        </div>
      </div>
    </div>
  );
}

// Avoid unused-import warning when REPORTER_APPS isn't needed (it is, above).
void reporterApp;
