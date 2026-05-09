import { Images, Layers, Sparkles, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function SignInGate() {
  const { login, register } = useAuth();

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

          <div className="space-y-2.5">
            <button
              onClick={register}
              className="group w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 hover:from-cyan-400 hover:to-indigo-400 transition-all focus-ring"
            >
              <span>Create free account</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={login}
              className="w-full py-2.5 px-4 rounded-xl bg-ink-700 hover:bg-ink-600 text-gray-100 text-sm font-medium transition-colors focus-ring"
            >
              Sign in
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
