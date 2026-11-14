import React, { useState } from 'react';
import {
  ArrowRight,
  Download,
  Menu,
  X,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Zap,
  Smartphone,
} from 'lucide-react';
import { GpayLogo } from './GpayLogo';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  darkMode,
  onToggleDarkMode,
}) => {
  const [showInstallCard, setShowInstallCard] = useState(true);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed'>('idle');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleInstallApp = () => {
    if (installStatus !== 'idle') return;
    setInstallStatus('installing');
    setTimeout(() => {
      setInstallStatus('installed');
    }, 900);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7ff] dark:bg-[#0f051d] text-[#1e1b4b] dark:text-white transition-colors duration-200 selection:bg-[#7c3aed] selection:text-white">
      {/* Compact Top Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#140826]/95 backdrop-blur-md border-b border-purple-100 dark:border-[#2d1650]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Zone 1: Brand */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="focus:outline-none"
          >
            <GpayLogo size="sm" lightText={darkMode} />
          </a>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-[#c4b5fd]">
            <a
              href="#features"
              className="hover:text-[#7c3aed] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#earnings"
              className="hover:text-[#7c3aed] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Daily Earnings
            </a>
            <a
              href="#security"
              className="hover:text-[#7c3aed] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Security
            </a>
            {!showInstallCard && (
              <button
                type="button"
                onClick={() => setShowInstallCard(true)}
                className="hover:text-[#7c3aed] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Install App
              </button>
            )}
          </nav>

          {/* Zone 3: Compact Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onLogin}
              className="px-3.5 py-1.5 rounded-full border border-[#7c3aed] dark:border-[#9333ea] bg-purple-50/80 dark:bg-[#1f0d3d] text-[#7c3aed] dark:text-[#c084fc] text-xs font-semibold hover:bg-purple-100 dark:hover:bg-[#2e1459] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Login
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Toggle color theme"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-8 h-8 rounded-full border border-purple-200/80 dark:border-[#331a5c] bg-[#f5f0ff] dark:bg-[#1a0b33] flex items-center justify-center hover:border-[#7c3aed]/60 transition-colors shrink-0 cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="12" cy="12" r="5.5" className="fill-[#f59e0b]" />
                <path
                  d="M12 2V4.5M12 19.5V22M4.93 4.93L6.7 6.7M17.3 17.3L19.07 19.07M2 12H4.5M19.5 12H22M4.93 19.07L6.7 17.3M17.3 6.7L19.07 4.93"
                  stroke="#ea580c"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="w-8 h-8 rounded-full border border-purple-200/80 dark:border-[#331a5c] bg-[#f5f0ff] dark:bg-[#1a0b33] flex items-center justify-center text-[#1e1b4b] dark:text-white hover:border-[#7c3aed]/60 transition-colors shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Slide-down Drawer Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-purple-100 dark:border-[#2d1650] bg-white dark:bg-[#16082b] px-5 py-4 shadow-xl">
            <div className="max-w-5xl mx-auto flex flex-col gap-2">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-xs font-medium text-slate-700 dark:text-purple-100/90 hover:text-[#7c3aed]"
              >
                Platform Features
              </a>
              <a
                href="#earnings"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-xs font-medium text-slate-700 dark:text-purple-100/90 hover:text-[#7c3aed]"
              >
                Daily Earnings &amp; Returns
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-xs font-medium text-slate-700 dark:text-purple-100/90 hover:text-[#7c3aed]"
              >
                Bank-Grade Security
              </a>
              <div className="pt-2.5 mt-1 border-t border-purple-100 dark:border-[#2d1650] flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onGetStarted();
                  }}
                  className="px-4 py-2 rounded-full bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-colors cursor-pointer"
                >
                  Create Free Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogin();
                  }}
                  className="px-4 py-2 rounded-full border border-[#7c3aed] text-[#7c3aed] dark:text-[#c084fc] font-semibold text-xs hover:bg-purple-500/10 transition-colors cursor-pointer"
                >
                  Login to Account
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main id="top" className="relative flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute -top-24 right-0 w-[400px] h-[400px] rounded-full bg-[#7c3aed]/12 dark:bg-[#7c3aed]/25 blur-[110px]" />
          <div className="absolute top-1/3 -left-24 w-[320px] h-[320px] rounded-full bg-[#a855f7]/10 dark:bg-[#9333ea]/20 blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left / Primary Column */}
            <div className="lg:col-span-7 relative z-10">
              {/* Hero Display Typography (Reduced Size) */}
              <div className="relative z-10">
                <p className="text-lg sm:text-xl font-medium text-[#312e81] dark:text-white leading-snug tracking-tight mb-0.5">
                  Your Trusted
                </p>
                <h1 className="text-3xl sm:text-4xl font-extrabold leading-[1.08] tracking-tight text-[#1e1b4b] dark:text-white">
                  Financial
                  <span className="block text-[#7c3aed] dark:text-[#a855f7]">
                    Partner
                  </span>
                </h1>

                <p className="mt-3.5 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-[#c4b5fd] max-w-[380px] font-normal">
                  Earn daily, manage payments, and grow your money securely with
                  Nigeria&apos;s most trusted fintech platform.
                </p>

                {/* Compact Get Started Button */}
                <div className="relative mt-6 mb-8 inline-block">
                  <div
                    aria-hidden="true"
                    className="cta-glow pointer-events-none absolute -inset-2.5 rounded-full bg-[#7c3aed]/25 blur-lg"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-1.5 rounded-full border border-[#7c3aed]/20"
                  />

                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="relative z-10 bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.98] text-white font-bold text-sm pl-5 pr-1.5 py-1.5 rounded-full inline-flex items-center gap-3 shadow-[0_6px_22px_rgba(124,58,237,0.4)] transition-all cursor-pointer"
                  >
                    <span className="whitespace-nowrap">Get Started</span>
                    <span className="w-8 h-8 rounded-full bg-[#a78bfa]/40 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4 text-white stroke-[2.5]" />
                    </span>
                  </button>
                </div>
              </div>

              {/* Compact Install EverMore Card */}
              {showInstallCard && (
                <div className="relative z-10 max-w-[380px] rounded-2xl bg-gradient-to-b from-[#8b5cf6] to-[#6d28d9] p-4 sm:p-5 text-white shadow-[0_14px_35px_rgba(109,40,217,0.3)] border border-[#c084fc]/35">
                  <div className="flex items-center gap-3 mb-4">
                    <GpayLogo size="md" iconOnly />
                    <div>
                      <h2 className="text-base font-bold leading-snug text-white">
                        Install EverMore
                      </h2>
                      <p className="text-xs text-purple-100/95 leading-snug mt-0.5">
                        Get faster access &amp; offline support
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleInstallApp}
                    className="w-full bg-white hover:bg-purple-50 active:scale-[0.99] text-[#6d28d9] font-bold text-xs sm:text-sm py-2.5 px-4 rounded-full flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                  >
                    {installStatus === 'installed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#6d28d9] shrink-0" />
                        <span className="whitespace-nowrap">EverMore Ready on Device</span>
                      </>
                    ) : installStatus === 'installing' ? (
                      <span className="whitespace-nowrap">Preparing EverMore Shortcut...</span>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-[#6d28d9] stroke-[2.25] shrink-0" />
                        <span className="whitespace-nowrap">Install App</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowInstallCard(false)}
                    className="w-full mt-2.5 pt-0.5 text-center text-xs font-semibold text-white/95 hover:text-white transition-colors cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Compact Preview Showcase */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-5 shadow-lg">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-purple-100/80 dark:border-[#2a134f]">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-[#b794f4]">
                      Live EverMore Vault Balance
                    </p>
                    <p className="font-mono-num text-xl font-extrabold text-[#1e1b4b] dark:text-white mt-0.5">
                      ₦250,000.00
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-[#7c3aed] dark:text-[#c084fc]">
                    +18% p.a. Daily
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-[#210d42] border border-purple-200/60 dark:border-[#391b69] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                          Daily Interest Credited
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#b794f4]">
                          Automated daily payout at 06:00 AM
                        </p>
                      </div>
                    </div>
                    <span className="font-mono-num text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                      +₦1,250
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#faf7ff] dark:bg-[#1b0b36] border border-purple-100 dark:border-[#2d1554] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                          Instant Bank Transfer
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#b794f4]">
                          Settled in 2.4 seconds · Zero fee
                        </p>
                      </div>
                    </div>
                    <span className="font-mono-num text-xs font-bold text-[#1e1b4b] dark:text-purple-100">
                      ₦45,000
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#faf7ff] dark:bg-[#1b0b36] border border-purple-100 dark:border-[#2d1554] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                          4-Digit PIN Protection
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-[#b794f4]">
                          Encrypted account access
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#7c3aed] dark:text-[#c084fc]">
                      Verified
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-purple-100/80 dark:border-[#2a134f] flex items-center justify-between text-[11px] text-slate-500 dark:text-[#b794f4]">
                  <span>Takes less than 30 seconds to join</span>
                  <button
                    type="button"
                    onClick={onGetStarted}
                    className="font-bold text-[#7c3aed] dark:text-[#c084fc] hover:underline cursor-pointer"
                  >
                    Open Account →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Feature Grid Below the Fold */}
          <section id="features" className="mt-10 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                id="earnings"
                className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 shadow-xs transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center mb-3">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1e1b4b] dark:text-white mb-1">
                  01. Earn Daily Returns
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#c4b5fd] leading-relaxed">
                  Put your idle funds to work and watch your balance grow every
                  single day with transparent, automated daily payouts.
                </p>
              </div>

              <div className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 shadow-xs transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center mb-3">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1e1b4b] dark:text-white mb-1">
                  02. Seamless Payments
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#c4b5fd] leading-relaxed">
                  Send money to any bank in Nigeria, top up airtime and mobile
                  data, and settle utility bills within seconds.
                </p>
              </div>

              <div
                id="security"
                className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 shadow-xs transition-colors sm:col-span-2 lg:col-span-1"
              >
                <div className="w-9 h-9 rounded-xl bg-[#7c3aed]/15 text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center mb-3">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#1e1b4b] dark:text-white mb-1">
                  03. Simple 4-Digit Security
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#c4b5fd] leading-relaxed">
                  Sign up in seconds with just your name, email, and a secure
                  4-digit PIN. Built for speed, simplicity, and peace of mind.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-purple-100 dark:border-[#241042] bg-white dark:bg-[#0f051d] py-5 px-6 text-center text-[11px] text-slate-500 dark:text-[#a78bfa]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <GpayLogo size="sm" lightText={darkMode} />
          <p>© {new Date().getFullYear()} EverMore Financial Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
