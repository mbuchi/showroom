import { Check, X } from 'lucide-react';
import { avatarOptions, avatarUrl } from '../lib/avatars';
import { useAvatar } from '../lib/useAvatar';

interface AvatarPickerProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export function AvatarPicker({ isDarkMode, onClose }: AvatarPickerProps) {
  const { avatarId, setAvatarId } = useAvatar();

  const bg = isDarkMode ? 'bg-slate-900' : 'bg-white';
  const border = isDarkMode ? 'border-slate-700/80' : 'border-gray-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${bg} ${border}`}
        style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both' }}
      >
        <div className={`flex items-center justify-between px-6 py-4 border-b ${border}`}>
          <h2 className={`text-base font-semibold ${textPrimary}`}>Choose your avatar</h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className={`text-xs mb-4 ${textSecondary}`}>Your pick will follow you across all Swissnovo apps.</p>
          <div className="grid grid-cols-4 gap-3">
            {avatarOptions.map((opt) => {
              const selected = opt.id === avatarId;
              return (
                <button
                  key={opt.id}
                  onClick={() => { setAvatarId(opt.id); onClose(); }}
                  title={opt.label}
                  className={`relative aspect-square rounded-xl flex items-center justify-center transition-all border-2 ${
                    selected
                      ? 'border-sky-500 ring-2 ring-sky-500/30'
                      : isDarkMode
                        ? 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
                        : 'border-gray-200 hover:border-gray-400 bg-gray-50'
                  }`}
                >
                  <img src={avatarUrl(opt)} alt={opt.label} className="w-full h-full rounded-lg" />
                  {selected && (
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
