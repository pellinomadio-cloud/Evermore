import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'pill' | 'drawer' | 'card';
  className?: string;
  onBeforeOpenGuide?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'pill',
  className = '',
  onBeforeOpenGuide,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome !== 'unavailable') {
        return;
      }
    }
    onBeforeOpenGuide?.();
    setShowInstallGuide(true);
  };

  return (
    <>
      {variant === 'drawer' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full py-2.5 px-3 rounded-full bg-[#f3e8ff] dark:bg-[#261147] hover:bg-[#e9d5ff] dark:hover:bg-[#32175c] text-[#7c3aed] dark:text-[#c084fc] font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Install EverMore App</span>
        </button>
      ) : variant === 'card' ? (
        <button
          type="button"
          onClick={handleClick}
          className={`w-full bg-white hover:bg-purple-50 active:scale-[0.99] text-[#6d28d9] font-bold text-xs sm:text-sm py-2.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 text-[#6d28d9] stroke-[2.25] shrink-0" />
          <span className="whitespace-nowrap">Install App</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          aria-label="Install EverMore App"
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0 ${className}`}
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Install</span>
        </button>
      )}

      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17092e] border border-purple-200 dark:border-[#31175c] rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src="/pwa-192x192.png"
                  alt="EverMore App Icon"
                  className="w-12 h-12 rounded-2xl shadow-md border border-purple-200 dark:border-[#3b1c6e] shrink-0"
                />
                <div>
                  <h3 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    {isIOS ? 'Install on iPhone / iPad' : 'Install EverMore App'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
                    Add EverMore to your home screen for instant launch.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallGuide(false)}
                aria-label="Close install instructions"
                className="w-7 h-7 rounded-full bg-[#f3e8ff] dark:bg-[#261147] flex items-center justify-center text-[#7c3aed] cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isIOS ? (
              <div className="p-3.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-100 dark:border-[#2a134f] space-y-2.5 text-xs text-[#1e1b4b] dark:text-purple-100">
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong>{' '}
                    <Share className="w-3.5 h-3.5 inline text-[#7c3aed] -mt-0.5" />{' '}
                    button in your Safari toolbar.
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>, then tap{' '}
                    <strong>Add</strong>.
                  </span>
                </p>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-100 dark:border-[#2a134f] space-y-2.5 text-xs text-[#1e1b4b] dark:text-purple-100">
                <p className="flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-[#7c3aed] shrink-0 mt-0.5" />
                  <span>
                    Open your browser menu (<strong>⋮</strong> or{' '}
                    <strong>Install icon</strong> in the address bar) and choose{' '}
                    <strong>Install EverMore</strong> or{' '}
                    <strong>Add to Home Screen</strong>.
                  </span>
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
