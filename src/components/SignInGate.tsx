import { useState } from 'react';
import { Images, Layers, Sparkles, Lock, ArrowRight, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { isAuthConfigured, missingAuthEnvVars } from '../auth/authConfig';

export default function SignInGate() {
  const { login, register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<'login' | 'register' | null>(null);

  const wrap = (kind: 'login' | 'register', fn: () => Promise<void>) => async () => {
    if (!isAuthConfigured) {
      setError(
        `Authentication isn't configured for this deployment. Missing env var${
          missingAuthEnvVars.length > 1 ? 's' : ''
        }: ${missingAuthEnvVars.join(', ')}.`
      );
      return;
    }
    setError(null);
    setPending(kind);
    try {
      await fn();
    } catch (err) {
      setPending(null);
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Couldn't start the sign-in flow: ${msg}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 w-[480px] h-[480px] rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[200px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-500 shadow-glow-cyan mb-5">
            <Images size={26} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-100">
            Welcome to <span className="text-gradient-cyan">Showroom</span>
          </h1>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
            A modern gallery for your parcel exports — screenshots, reports, and
            rendered outputs from across the Swissnovo toolbox.
          </p>
        </div>

        <div className="surface-raised rounded-2xl p-6 sm:p-7 shadow-2xl">
          <div className="space-y-3 mb-6">
            <FeatureRow icon={<Layers size={14} />} label="Smart parcel grouping" />
            <FeatureRow icon={<Sparkles size={14} />} label="Polished gallery & lightbox" />
            <FeatureRow icon={<ShieldCheck size={14} />} label="Private to your account" />
          </div>

          {!isAuthConfigured && <ConfigBanner />}

          {error && isAuthConfigured && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200 flex gap-2 items-start animate-fade-in">
              <AlertTriangle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="break-words">{error}</span>
            </div>
          )}

          <div className="space-y-2.5">
            <button
              onClick={wrap('register', register)}
              disabled={pending !== null}
              className="group w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:from-cyan-400 hover:to-indigo-400 transition-all focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending === 'register' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  <span>Create free account</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
            <button
              onClick={wrap('login', login)}
              disabled={pending !== null}
              className="w-full py-2.5 px-4 rounded-xl bg-ink-700 hover:bg-ink-600 text-gray-100 text-sm font-medium transition-colors focus-ring disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {pending === 'login' ? <Loader2 size={14} className="animate-spin" /> : 'Sign in'}
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-gray-500">
            <Lock size={11} />
            <span>Secured with single sign-on via Zitadel</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Showroom needs a Swissnovo account so it can show <em>your</em> exports.
        </p>
      </div>
    </div>
  );
}

function FeatureRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-300">
      <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-300 flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

function ConfigBanner() {
  return (
    <div className="mb-5 p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-100">
      <div className="flex gap-2 items-start">
        <AlertTriangle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1.5 leading-relaxed">
          <p className="font-semibold text-amber-200">Authentication isn't configured</p>
          <p>
            This deployment is missing build-time env vars:
          </p>
          <ul className="font-mono text-[11px] space-y-0.5 pl-1">
            {missingAuthEnvVars.map((v) => (
              <li key={v}>· {v}</li>
            ))}
          </ul>
          <p className="pt-1">
            Set them in the host's project settings (Vercel → Environment Variables) and
            redeploy — Vite inlines them at build time.
          </p>
        </div>
      </div>
    </div>
  );
}
