import { useState } from 'react';
import { ExternalLink, ImageOff, AlertTriangle, MapPinned } from 'lucide-react';
import type { Capture } from '../../services/reporterService';

const STATUS_META: Record<Capture['status'], { label: string; classes: string }> = {
  ok:     { label: 'Captured', classes: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30' },
  cached: { label: 'Cached',   classes: 'text-sky-300 bg-sky-500/10 border-sky-500/30' },
  no_map: { label: 'No map',   classes: 'text-amber-300 bg-amber-500/10 border-amber-500/30' },
  error:  { label: 'Failed',   classes: 'text-red-300 bg-red-500/10 border-red-500/30' },
};

export default function ReportCard({ capture }: { capture: Capture }) {
  const [loaded, setLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const meta = STATUS_META[capture.status];
  const showImage = !!capture.imageUrl && !imgFailed;

  return (
    <div className="surface-raised surface-hover rounded-xl overflow-hidden flex flex-col">
      <div className="relative aspect-[16/10] bg-ink-900 overflow-hidden">
        {showImage ? (
          <img
            src={capture.imageUrl as string}
            alt={`${capture.label} at this address`}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            onError={() => setImgFailed(true)}
            className={`img-fade-in w-full h-full object-cover ${loaded ? 'loaded' : ''}`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-600">
            {capture.status === 'error' ? (
              <AlertTriangle size={22} className="text-red-500/70" />
            ) : capture.status === 'no_map' ? (
              <MapPinned size={22} className="text-amber-500/70" />
            ) : (
              <ImageOff size={22} />
            )}
            <span className="text-[11px] uppercase tracking-wider font-semibold">
              No screenshot
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-100 truncate">{capture.label}</p>
          {capture.error && (
            <p className="text-[11px] text-red-400/80 truncate" title={capture.error}>
              {capture.error}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.classes}`}>
            {meta.label}
          </span>
          <a
            href={capture.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            title={`Open ${capture.label} at this address`}
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
