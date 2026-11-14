import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  Headphones,
  KeyRound,
  List,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Target,
  TrendingUp,
  Tv,
  UserPlus,
  Users,
  Wifi,
} from 'lucide-react';
import { GpayLogo } from './GpayLogo';
import { UserAccount } from './AuthPage';

interface DashboardPageProps {
  user: UserAccount;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
}

type SubPageType =
  | 'home'
  | 'withdraw'
  | 'ecoin'
  | 'claim'
  | 'groups'
  | 'top_earners'
  | 'airtime'
  | 'data'
  | 'support'
  | 'tv'
  | 'betting'
  | 'loan'
  | 'invite'
  | 'more'
  | 'notifications'
  | 'help';

const NIGERIAN_BANKS = [
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'First City Monument Bank (FCMB)',
  'Globus Bank',
  'Guaranty Trust Bank (GTBank)',
  'Heritage Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Moniepoint MFB',
  'OPay',
  'PalmPay',
  'Polaris Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'Wema Bank',
  'Zenith Bank',
];

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onLogout,
}) => {
  const storageKey = `evermore_state_${user.email.toLowerCase()}`;

  const [subPage, setSubPage] = useState<SubPageType>('home');
  const [balance, setBalance] = useState<number>(user.balance ?? 0);
  const [currencyView, setCurrencyView] = useState<'NGN' | 'ECOIN'>('NGN');
  const [hideBalance, setHideBalance] = useState(false);
  const [invitesCount, setInvitesCount] = useState(0);
  const [checkInCount, setCheckInCount] = useState(0);
  const [earnedTotal, setEarnedTotal] = useState(0);

  // Purchased Ecoin withdrawal codes owned by this user
  const [purchasedCodes, setPurchasedCodes] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Withdraw Page Form State (Account Number -> Select Bank -> Account Name -> Ecoin Code)
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawEcoinCode, setWithdrawEcoinCode] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // Buy Ecoin Page State
  const [selectedEcoinPlan, setSelectedEcoinPlan] = useState<'standard' | 'pro'>('standard');
  const [payerName, setPayerName] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [newlyGeneratedCode, setNewlyGeneratedCode] = useState<string | null>(null);

  // Utility / Service Pages Form State
  const [serviceNetwork, setServiceNetwork] = useState('MTN');
  const [servicePhone, setServicePhone] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [serviceStatus, setServiceStatus] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState('');

  // Load persisted dashboard state for this user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.balance === 'number') setBalance(parsed.balance);
        if (typeof parsed.invitesCount === 'number') setInvitesCount(parsed.invitesCount);
        if (typeof parsed.checkInCount === 'number') setCheckInCount(parsed.checkInCount);
        if (typeof parsed.earnedTotal === 'number') setEarnedTotal(parsed.earnedTotal);
        if (Array.isArray(parsed.purchasedCodes)) setPurchasedCodes(parsed.purchasedCodes);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  // Save state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          balance,
          invitesCount,
          checkInCount,
          earnedTotal,
          purchasedCodes,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [balance, invitesCount, checkInCount, earnedTotal, purchasedCodes, storageKey]);

  const firstName = user.name.trim().split(/\s+/)[0] || 'User';

  const navigateTo = (page: SubPageType) => {
    setWithdrawError('');
    setWithdrawSuccess('');
    setServiceStatus(null);
    setSubPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleDailyClaim = () => {
    const reward = 1000;
    setBalance((prev) => prev + reward);
    setCheckInCount((prev) => prev + 1);
    setEarnedTotal((prev) => prev + reward);
    navigateTo('claim');
  };

  const handlePurchaseEcoinCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payerName.trim()) return;
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const newCode = `EC-${randomDigits}`;
    setPurchasedCodes((prev) => [newCode, ...prev]);
    setNewlyGeneratedCode(newCode);
    setPayerName('');
    setPaymentReference('');
    showToast(`Ecoin Code ${newCode} purchased and activated!`);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');
    setWithdrawSuccess('');

    const cleanAcctNo = withdrawAccountNumber.replace(/\D/g, '');
    if (cleanAcctNo.length !== 10) {
      setWithdrawError('Please enter a valid 10-digit bank account number.');
      return;
    }
    if (!withdrawBank) {
      setWithdrawError('Please select your bank.');
      return;
    }
    if (!withdrawAccountName.trim()) {
      setWithdrawError('Please enter the account holder name.');
      return;
    }

    const enteredCode = withdrawEcoinCode.trim().toUpperCase();
    if (!enteredCode) {
      setWithdrawError(
        'Ecoin code is required. You cannot withdraw without entering a purchased Ecoin code.'
      );
      return;
    }

    // Strict check: user must have purchased an Ecoin code and entered a valid purchased code
    if (purchasedCodes.length === 0 || !purchasedCodes.includes(enteredCode)) {
      setWithdrawError(
        'Withdrawal blocked: You do not have a valid purchased Ecoin code. Please purchase an Ecoin code first to unlock withdrawal.'
      );
      return;
    }

    const amountNum = withdrawAmount ? Number(withdrawAmount) : balance;
    if (!amountNum || amountNum <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      return;
    }
    if (amountNum > balance) {
      setWithdrawError(
        `Insufficient balance. Your available balance is ₦${balance.toLocaleString('en-NG')}.`
      );
      return;
    }

    // Consume balance and mark withdrawal complete
    setBalance((prev) => prev - amountNum);
    setWithdrawSuccess(
      `Withdrawal of ₦${amountNum.toLocaleString('en-NG')} to ${withdrawAccountName.trim()} (${withdrawBank} - ${cleanAcctNo}) has been approved using Ecoin code ${enteredCode}!`
    );
    setWithdrawAccountNumber('');
    setWithdrawBank('');
    setWithdrawAccountName('');
    setWithdrawAmount('');
    setWithdrawEcoinCode('');
  };

  const handleServiceSubmit = (serviceLabel: string) => (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(serviceAmount);
    if (!num || num <= 0) return;
    if (num > balance) {
      setServiceStatus(
        `Insufficient balance (₦${balance.toLocaleString('en-NG')}). Claim daily rewards first.`
      );
      return;
    }
    setBalance((prev) => prev - num);
    setServiceStatus(
      `${serviceLabel} of ₦${num.toLocaleString('en-NG')} for ${servicePhone || 'your account'} (${serviceNetwork}) was completed!`
    );
    setServiceAmount('');
    setServicePhone('');
  };

  const handleCopyInviteLink = () => {
    const inviteUrl = `${window.location.origin}/?ref=${firstName.toLowerCase()}2026`;
    navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    setInvitesCount((prev) => prev + 1);
    showToast('Referral link copied! Share with friends to earn bonuses.');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    showToast(`Copied Ecoin code: ${code}`);
  };

  // Sub-page title lookup
  const pageTitleMap: Record<Exclude<SubPageType, 'home'>, string> = {
    withdraw: 'Withdraw Funds',
    ecoin: 'Buy Ecoin Code',
    claim: 'Daily Check-In Reward',
    groups: 'EverMore Earner Groups',
    top_earners: 'Top Earners Leaderboard',
    airtime: 'Buy Airtime',
    data: 'Buy Data Bundle',
    support: 'Support Center',
    tv: 'TV Subscription',
    betting: 'Fund Betting Wallet',
    loan: 'EverMore Instant Loan',
    invite: 'Invite Friends & Earn',
    more: 'More Options & Account',
    notifications: 'Notifications',
    help: 'Help & Customer Care',
  };

  return (
    <div className="min-h-screen bg-[#f6f3ff] dark:bg-[#0f051d] text-[#1e1b4b] dark:text-white pb-20 transition-colors duration-200">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-xs w-[90%] rounded-xl bg-[#7c3aed] text-white px-3.5 py-2.5 shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#150829] border-b border-purple-100 dark:border-[#2d1650]">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {subPage === 'home' ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <GpayLogo size="sm" iconOnly />
              <div className="leading-tight truncate">
                <p className="text-xs text-[#6b6684] dark:text-[#c4b5fd] font-normal truncate">
                  Hi, {firstName}
                </p>
                <p className="text-[15px] font-extrabold tracking-tight text-[#1e1b4b] dark:text-white">
                  Ever<span className="text-[#7c3aed] dark:text-[#a855f7]">More</span>
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => navigateTo('home')}
                className="w-8 h-8 rounded-full bg-[#f3e8ff] dark:bg-[#220e42] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center hover:bg-[#e9d5ff] transition-colors cursor-pointer shrink-0"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
              </button>
              <h1 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white truncate">
                {pageTitleMap[subPage]}
              </h1>
            </div>
          )}

          {/* Right Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigateTo('help')}
              className="flex flex-col items-center justify-center text-[#7c3aed] dark:text-[#c084fc] hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Help and Support"
            >
              <span className="text-[10px] font-extrabold leading-none mb-0.5">
                Help
              </span>
              <Headphones className="w-4 h-4 stroke-[2.2]" />
            </button>

            <button
              type="button"
              onClick={onToggleDarkMode}
              aria-label="Toggle color theme"
              className="w-8 h-8 rounded-full bg-[#f3e8ff] dark:bg-[#220e42] border border-purple-200/80 dark:border-[#3b1c6e] flex items-center justify-center hover:border-[#7c3aed]/50 transition-colors cursor-pointer"
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
              onClick={() => navigateTo('notifications')}
              aria-label="Notifications"
              className="p-1 text-[#4c4669] dark:text-purple-100 hover:text-[#7c3aed] transition-colors cursor-pointer relative"
            >
              <Bell className="w-5 h-5 stroke-[2]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-md mx-auto px-3.5 pt-4 space-y-4">
        {/* ==================== HOME DASHBOARD VIEW ==================== */}
        {subPage === 'home' && (
          <>
            {/* 1. Compact Balance Card */}
            <section className="rounded-2xl bg-white dark:bg-[#17092e] p-4 shadow-[0_6px_22px_rgba(124,58,237,0.06)] border border-purple-100 dark:border-[#31175c]">
              <div className="flex items-center justify-between mb-2">
                <div className="inline-flex items-center gap-1 text-[#7c3aed] dark:text-[#c084fc]">
                  <ShieldCheck className="w-4 h-4 stroke-[2]" />
                  <span className="text-xs font-medium">Secured</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrencyView((prev) => (prev === 'NGN' ? 'ECOIN' : 'NGN'))
                    }
                    className="bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] px-2.5 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-[#e9d5ff] transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3 h-3 stroke-[2.2]" />
                    <span>{currencyView}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHideBalance((prev) => !prev)}
                    aria-label="Toggle balance visibility"
                    className="text-[#6b6684] dark:text-[#c4b5fd] hover:text-[#1e1b4b] dark:hover:text-white p-0.5 cursor-pointer"
                  >
                    {hideBalance ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 my-1.5">
                <div>
                  <p className="text-xs text-[#6b6684] dark:text-[#c4b5fd] font-normal">
                    Available Balance
                  </p>
                  <p className="font-mono-num text-2xl sm:text-3xl font-extrabold text-[#7c3aed] dark:text-[#a855f7] leading-tight tracking-tight mt-0.5">
                    {hideBalance
                      ? '****'
                      : currencyView === 'NGN'
                      ? `₦${balance.toLocaleString('en-NG')}`
                      : `${purchasedCodes.length} Ecoin`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDailyClaim}
                  className="bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 text-white px-4 py-2 rounded-full font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all shrink-0 cursor-pointer"
                >
                  <Gift className="w-4 h-4 stroke-[2]" />
                  <span>Claim</span>
                </button>
              </div>

              <div className="border-t border-purple-100/80 dark:border-[#2a134f] my-3" />

              {/* Bottom Row: 3 Status Pills */}
              <div className="grid grid-cols-3 gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => navigateTo('invite')}
                  className="bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] px-2 py-1 rounded-full text-[10.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 truncate"
                >
                  <Users className="w-3 h-3 shrink-0" />
                  <span className="truncate">{invitesCount} Invites</span>
                </button>

                <button
                  type="button"
                  onClick={handleDailyClaim}
                  className="bg-[#fdf3dc] dark:bg-amber-950/60 text-[#78460a] dark:text-amber-300 px-2 py-1 rounded-full text-[10.5px] sm:text-xs font-semibold inline-flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 truncate"
                >
                  <Gift className="w-3 h-3 text-[#d97706] shrink-0" />
                  <span className="truncate">{checkInCount} Check-in +₦1,000</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('claim')}
                  className="bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] px-2 py-1 rounded-full text-[10.5px] sm:text-xs font-semibold inline-flex items-center justify-center truncate cursor-pointer hover:opacity-90"
                >
                  <span className="truncate">
                    ₦{earnedTotal.toLocaleString('en-NG')} Earned
                  </span>
                </button>
              </div>
            </section>

            {/* 2. Four Circular Purple Action Buttons */}
            <section className="grid grid-cols-4 gap-2 px-1 py-0.5">
              <button
                type="button"
                onClick={() => navigateTo('ecoin')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-[#7c3aed] group-hover:bg-[#6d28d9] group-active:scale-95 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all">
                  <CreditCard className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-[#7c3aed] dark:text-[#c084fc] whitespace-nowrap">
                  Buy Ecoin
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('groups')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-[#7c3aed] group-hover:bg-[#6d28d9] group-active:scale-95 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all">
                  <Building2 className="w-4 h-4 stroke-[2]" />
                </div>
                <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-[#7c3aed] dark:text-[#c084fc] whitespace-nowrap">
                  Groups
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('withdraw')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-[#7c3aed] group-hover:bg-[#6d28d9] group-active:scale-95 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all">
                  <TrendingUp className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-[#7c3aed] dark:text-[#c084fc] whitespace-nowrap">
                  Withdraw
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigateTo('top_earners')}
                className="flex flex-col items-center group cursor-pointer"
              >
                <div className="w-11 h-11 rounded-full bg-[#7c3aed] group-hover:bg-[#6d28d9] group-active:scale-95 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(124,58,237,0.25)] transition-all">
                  <TrendingUp className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="mt-1.5 text-[11px] sm:text-xs font-semibold text-[#7c3aed] dark:text-[#c084fc] whitespace-nowrap">
                  Top Earners
                </span>
              </button>
            </section>

            {/* 3. Eight-Service Grid Compact White Card */}
            <section className="rounded-2xl bg-white dark:bg-[#17092e] p-4 sm:p-5 shadow-[0_6px_22px_rgba(124,58,237,0.06)] border border-purple-100 dark:border-[#31175c]">
              <div className="grid grid-cols-4 gap-y-5 gap-x-2">
                <button
                  type="button"
                  onClick={() => navigateTo('airtime')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <Smartphone className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    Airtime
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('data')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <Wifi className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    Data
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('support')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <Users className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    Support
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('tv')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <Tv className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    TV
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('betting')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <Target className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    Betting
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('loan')}
                  className="flex flex-col items-center group cursor-pointer relative"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex flex-col items-center justify-center text-[#1e1b4b] dark:text-white transition-colors relative">
                    <span className="absolute -top-1.5 -right-2 bg-[#fbc275] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs tracking-wide leading-none">
                      HOT
                    </span>
                    <List className="w-4 h-4 stroke-[2.2] mt-0.5" />
                    <ChevronDown className="w-3 h-3 text-[#7c3aed] dark:text-[#c084fc] -mb-1.5 mt-0.5 stroke-[2.5]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    Loan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('invite')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <UserPlus className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd] text-center leading-tight">
                    Invite
                    <br />
                    Friends
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('more')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex flex-col items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <MoreHorizontal className="w-4 h-4 stroke-[2.5] mt-0.5" />
                    <ChevronDown className="w-3 h-3 text-[#7c3aed] dark:text-[#c084fc] -mb-1.5 mt-0.5 stroke-[2.5]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    More
                  </span>
                </button>
              </div>
            </section>

            {/* 4. Compact Bottom Telecom Promo Banner Card */}
            <section
              onClick={() => navigateTo('airtime')}
              className="rounded-2xl bg-gradient-to-b from-[#f3e8ff] to-[#e9d5ff] dark:from-[#210d40] dark:to-[#150829] border border-purple-200 dark:border-[#31175c] pt-3.5 px-4 pb-0 overflow-hidden cursor-pointer shadow-xs"
            >
              <p className="text-center text-xs sm:text-sm font-bold text-[#7c3aed] dark:text-[#c084fc] mb-3">
                Top up airtime &amp; data easily and stay connected.
              </p>

              <div className="flex items-end justify-between gap-2">
                <div className="relative w-32 h-24 shrink-0 flex items-end">
                  <div className="w-11 h-18 rounded-md bg-[#1e1b4b] text-white p-1.5 shadow-sm transform -rotate-24 translate-x-1 translate-y-1.5 border border-white/10 flex flex-col justify-between">
                    <span className="text-[9px] font-black text-purple-300">9</span>
                    <span className="text-[6px] text-purple-200">9mobile</span>
                  </div>
                  <div className="w-11 h-18 rounded-md bg-[#7c3aed] text-white p-1.5 shadow-sm transform -rotate-12 -translate-x-3 translate-y-1 border border-white/20 flex flex-col justify-between">
                    <span className="text-[9px] font-extrabold">glo</span>
                    <span className="text-[6px] text-white/80">Data</span>
                  </div>
                  <div className="w-11 h-18 rounded-md bg-[#dc2626] text-white p-1.5 shadow-sm transform -rotate-3 -translate-x-7 translate-y-1 border border-white/20 flex flex-col justify-between">
                    <span className="text-[8px] font-bold">airtel</span>
                    <span className="text-[6px] text-white/80">Top-up</span>
                  </div>
                  <div className="w-12 h-18 rounded-md bg-[#facc15] text-slate-900 p-1.5 shadow-sm transform rotate-12 -translate-x-11 translate-y-1.5 border border-white/40 flex flex-col justify-between">
                    <span className="px-1 py-0.5 rounded-full bg-[#0284c7] text-white text-[7px] font-black italic text-center">
                      MTN
                    </span>
                    <div className="w-full h-4 rounded-xs bg-[#7c3aed]/90" />
                  </div>
                </div>

                <div className="w-36 bg-white dark:bg-[#1b0b36] rounded-t-xl border-t-3 border-x-3 border-[#1e1b4b] p-2.5 shadow-md transform rotate-2 translate-y-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-[#7c3aed] dark:text-[#c084fc] mb-1.5">
                    <span>←</span>
                    <span>Airtime</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 rounded-xs bg-[#faf7ff] dark:bg-[#110622] px-1.5 flex items-center text-[7px] text-slate-400">
                      Phone number
                    </div>
                    <div className="h-4 rounded-xs bg-[#faf7ff] dark:bg-[#110622] px-1.5 flex items-center justify-between text-[7px] text-slate-400">
                      <span>Select network</span>
                      <span className="w-2 h-2 rounded-xs bg-[#7c3aed]" />
                    </div>
                    <div className="h-4 rounded-xs bg-[#faf7ff] dark:bg-[#110622] px-1.5 flex items-center text-[7px] text-slate-400">
                      Amount
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ==================== WITHDRAW PAGE ==================== */}
        {subPage === 'withdraw' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-[#2a134f]">
              <div>
                <p className="text-xs text-[#6b6684] dark:text-[#c4b5fd]">
                  Available Balance
                </p>
                <p className="font-mono-num text-xl font-extrabold text-[#7c3aed] dark:text-[#a855f7]">
                  ₦{balance.toLocaleString('en-NG')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('ecoin')}
                className="px-3 py-1.5 rounded-full bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] text-xs font-bold hover:bg-[#e9d5ff] cursor-pointer"
              >
                Buy Ecoin Code →
              </button>
            </div>

            {withdrawError && (
              <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 p-3.5 text-xs text-red-700 dark:text-red-300 space-y-2">
                <div className="flex items-start gap-2 font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <span>{withdrawError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('ecoin')}
                  className="inline-block font-bold text-[#7c3aed] dark:text-[#c084fc] underline cursor-pointer"
                >
                  Click here to Purchase an Ecoin Code
                </button>
              </div>
            )}

            {withdrawSuccess && (
              <div className="rounded-xl bg-purple-50 dark:bg-[#220e42] border border-purple-200 dark:border-[#3b1c6e] p-3.5 text-xs text-[#4c1d95] dark:text-purple-200 font-medium">
                {withdrawSuccess}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-3.5" noValidate>
              {/* 1. Account Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={withdrawAccountNumber}
                  onChange={(e) => {
                    setWithdrawAccountNumber(e.target.value.replace(/\D/g, ''));
                    if (withdrawError) setWithdrawError('');
                  }}
                  placeholder="Enter 10-digit account number"
                  required
                  className="font-mono-num w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              {/* 2. Select Bank */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  Select Bank
                </label>
                <select
                  value={withdrawBank}
                  onChange={(e) => {
                    setWithdrawBank(e.target.value);
                    if (withdrawError) setWithdrawError('');
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                >
                  <option value="">-- Choose your bank --</option>
                  {NIGERIAN_BANKS.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Account Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={withdrawAccountName}
                  onChange={(e) => {
                    setWithdrawAccountName(e.target.value);
                    if (withdrawError) setWithdrawError('');
                  }}
                  placeholder="Enter account holder full name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              {/* Withdrawal Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  Amount to Withdraw (₦)
                </label>
                <input
                  type="number"
                  min="100"
                  value={withdrawAmount}
                  onChange={(e) => {
                    setWithdrawAmount(e.target.value);
                    if (withdrawError) setWithdrawError('');
                  }}
                  placeholder="Enter withdrawal amount"
                  required
                  className="font-mono-num w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              {/* 4. Enter Ecoin Code */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100">
                    Enter Ecoin Code
                  </label>
                  <button
                    type="button"
                    onClick={() => navigateTo('ecoin')}
                    className="text-[11px] font-bold text-[#7c3aed] dark:text-[#c084fc] hover:underline cursor-pointer"
                  >
                    Need Ecoin Code? Buy Here
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#7c3aed] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={withdrawEcoinCode}
                    onChange={(e) => {
                      setWithdrawEcoinCode(e.target.value.toUpperCase());
                      if (withdrawError) setWithdrawError('');
                    }}
                    placeholder="Enter purchased Ecoin code (e.g. EC-123456)"
                    required
                    className="font-mono-num w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm uppercase tracking-wider focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-[#b794f4] mt-1">
                  Note: A valid purchased Ecoin code is required to authorize all
                  withdrawals.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all cursor-pointer mt-2"
              >
                Withdraw Now
              </button>
            </form>
          </section>
        )}

        {/* ==================== BUY ECOIN PAGE ==================== */}
        {subPage === 'ecoin' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            <div className="p-3.5 rounded-xl bg-[#f3e8ff] dark:bg-[#220e42] border border-purple-200 dark:border-[#3b1c6e]">
              <h2 className="text-sm font-extrabold text-[#7c3aed] dark:text-[#c084fc]">
                What is an Ecoin Code?
              </h2>
              <p className="text-xs text-slate-600 dark:text-purple-100/90 mt-1 leading-relaxed">
                Ecoin is your mandatory withdrawal activation code on EverMore.
                Once purchased, enter your unique Ecoin code on the withdrawal
                page to transfer your earnings instantly to your bank account.
              </p>
            </div>

            {newlyGeneratedCode && (
              <div className="p-4 rounded-xl bg-purple-900 text-white space-y-2">
                <p className="text-xs text-purple-200">
                  Your Purchased Ecoin Withdrawal Code:
                </p>
                <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                  <span className="font-mono-num text-base font-extrabold tracking-wider">
                    {newlyGeneratedCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(newlyGeneratedCode)}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-white text-[#7c3aed] px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawEcoinCode(newlyGeneratedCode);
                    navigateTo('withdraw');
                  }}
                  className="w-full py-2 rounded-lg bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold text-xs cursor-pointer mt-1"
                >
                  Use Code on Withdraw Page →
                </button>
              </div>
            )}

            {purchasedCodes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Your Active Ecoin Codes ({purchasedCodes.length}):
                </p>
                <div className="space-y-1.5">
                  {purchasedCodes.map((code) => (
                    <div
                      key={code}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs"
                    >
                      <span className="font-mono-num font-bold text-[#7c3aed] dark:text-[#c084fc]">
                        {code}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code)}
                          className="text-slate-500 hover:text-[#7c3aed] font-semibold cursor-pointer"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setWithdrawEcoinCode(code);
                            navigateTo('withdraw');
                          }}
                          className="text-[#7c3aed] dark:text-[#c084fc] font-bold hover:underline cursor-pointer"
                        >
                          Use to Withdraw →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handlePurchaseEcoinCode} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1.5">
                  Select Ecoin Package
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedEcoinPlan('standard')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEcoinPlan === 'standard'
                        ? 'border-[#7c3aed] bg-[#f3e8ff] dark:bg-[#261147]'
                        : 'border-purple-200 dark:border-[#331860] bg-[#faf7ff] dark:bg-[#110622]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                      Standard Ecoin
                    </p>
                    <p className="font-mono-num text-sm font-extrabold text-[#7c3aed] dark:text-[#c084fc] mt-0.5">
                      ₦5,500
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-purple-200/70 mt-0.5">
                      Instant Withdrawal Code
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedEcoinPlan('pro')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEcoinPlan === 'pro'
                        ? 'border-[#7c3aed] bg-[#f3e8ff] dark:bg-[#261147]'
                        : 'border-purple-200 dark:border-[#331860] bg-[#faf7ff] dark:bg-[#110622]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                      VIP Unlimited Ecoin
                    </p>
                    <p className="font-mono-num text-sm font-extrabold text-[#7c3aed] dark:text-[#c084fc] mt-0.5">
                      ₦10,000
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-purple-200/70 mt-0.5">
                      Priority Zero-Fee Payouts
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  Your Full Name / Sender Name
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  Email for Ecoin Delivery
                </label>
                <input
                  type="email"
                  value={paymentReference || user.email}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
              >
                Purchase Ecoin Code (
                {selectedEcoinPlan === 'standard' ? '₦5,500' : '₦10,000'})
              </button>
            </form>
          </section>
        )}

        {/* ==================== CLAIM PAGE ==================== */}
        {subPage === 'claim' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center mx-auto">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1e1b4b] dark:text-white">
                Daily Check-In Reward Credited!
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                You received{' '}
                <span className="font-bold text-[#7c3aed] dark:text-[#c084fc]">
                  +₦1,000
                </span>{' '}
                in your EverMore wallet.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left">
              <div className="p-3 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-100 dark:border-[#2a134f]">
                <p className="text-[11px] text-slate-500 dark:text-[#b794f4]">
                  Total Check-Ins
                </p>
                <p className="font-mono-num text-base font-extrabold text-[#1e1b4b] dark:text-white mt-0.5">
                  {checkInCount}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-100 dark:border-[#2a134f]">
                <p className="text-[11px] text-slate-500 dark:text-[#b794f4]">
                  Total Earned
                </p>
                <p className="font-mono-num text-base font-extrabold text-[#7c3aed] dark:text-[#c084fc] mt-0.5">
                  ₦{earnedTotal.toLocaleString('en-NG')}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleDailyClaim}
                className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
              >
                Claim Another +₦1,000 Bonus
              </button>
              <button
                type="button"
                onClick={() => navigateTo('withdraw')}
                className="w-full py-2.5 rounded-full border border-purple-200 dark:border-[#331860] text-[#7c3aed] dark:text-[#c084fc] font-bold text-xs cursor-pointer"
              >
                Go to Withdraw Page
              </button>
            </div>
          </section>
        )}

        {/* ==================== UTILITY PAGES (AIRTIME / DATA / TV / BETTING) ==================== */}
        {(subPage === 'airtime' ||
          subPage === 'data' ||
          subPage === 'tv' ||
          subPage === 'betting') && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            {serviceStatus && (
              <div className="p-3 rounded-xl bg-[#f3e8ff] dark:bg-[#220e42] text-xs font-semibold text-[#7c3aed] dark:text-[#c084fc]">
                {serviceStatus}
              </div>
            )}

            <form
              onSubmit={handleServiceSubmit(pageTitleMap[subPage])}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1.5">
                  Select Network / Provider
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(subPage === 'tv'
                    ? ['DSTV', 'GOtv', 'Startimes', 'Showmax']
                    : subPage === 'betting'
                    ? ['SportyBet', 'Bet9ja', '1xBet', 'BetKing']
                    : ['MTN', 'Airtel', 'Glo', '9mobile']
                  ).map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setServiceNetwork(provider)}
                      className={`py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                        serviceNetwork === provider
                          ? 'bg-[#7c3aed] text-white border-[#7c3aed]'
                          : 'bg-[#faf7ff] dark:bg-[#110622] text-slate-700 dark:text-purple-100 border-purple-200 dark:border-[#331860]'
                      }`}
                    >
                      {provider}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  {subPage === 'tv'
                    ? 'Smartcard / IUC Number'
                    : subPage === 'betting'
                    ? 'Betting User ID'
                    : 'Phone Number'}
                </label>
                <input
                  type="text"
                  value={servicePhone}
                  onChange={(e) => setServicePhone(e.target.value)}
                  placeholder={
                    subPage === 'tv'
                      ? 'Enter IUC number'
                      : subPage === 'betting'
                      ? 'Enter User ID'
                      : '0803 000 0000'
                  }
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  min="50"
                  value={serviceAmount}
                  onChange={(e) => setServiceAmount(e.target.value)}
                  placeholder="Enter amount in Naira"
                  required
                  className="font-mono-num w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                Continue &amp; Pay
              </button>
            </form>
          </section>
        )}

        {/* ==================== TOP EARNERS PAGE ==================== */}
        {subPage === 'top_earners' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-3">
            <p className="text-xs text-slate-500 dark:text-[#c4b5fd]">
              Verified members with the highest daily check-ins and referrals today:
            </p>
            <div className="divide-y divide-purple-100 dark:divide-[#2a134f] text-xs">
              {[
                { name: 'Chinedu Okafor', amount: '₦485,000', invites: '42 Invites' },
                { name: 'Amina Bello', amount: '₦392,500', invites: '35 Invites' },
                { name: 'Tunde Adeyemi', amount: '₦310,000', invites: '29 Invites' },
                { name: 'Blessing Nwosu', amount: '₦264,000', invites: '24 Invites' },
                { name: 'Sadiq Ibrahim', amount: '₦218,000', invites: '19 Invites' },
              ].map((earner, idx) => (
                <div
                  key={earner.name}
                  className="py-3 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-[#1e1b4b] dark:text-white">
                      #{idx + 1} {earner.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
                      {earner.invites}
                    </p>
                  </div>
                  <span className="font-mono-num font-bold text-[#7c3aed] dark:text-[#c084fc]">
                    {earner.amount}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================== GROUPS PAGE ==================== */}
        {subPage === 'groups' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-3.5">
            <p className="text-xs text-slate-600 dark:text-[#c4b5fd]">
              Join official EverMore communities to get daily Ecoin promos,
              payment proofs, and instant updates:
            </p>
            {[
              {
                title: 'EverMore Official Telegram Channel',
                members: '28,400+ Members',
              },
              {
                title: 'EverMore VIP Earners Group',
                members: '14,200+ Members',
              },
              {
                title: 'EverMore Daily Payout Proofs',
                members: '39,100+ Members',
              },
            ].map((grp) => (
              <div
                key={grp.title}
                className="p-3.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-100 dark:border-[#2a134f] flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                    {grp.title}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-[#b794f4]">
                    {grp.members}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast(`Joined ${grp.title}!`)}
                  className="px-3.5 py-1.5 rounded-full bg-[#7c3aed] text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  Join
                </button>
              </div>
            ))}
          </section>
        )}

        {/* ==================== INVITE FRIENDS PAGE ==================== */}
        {subPage === 'invite' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] text-center space-y-4">
            <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center mx-auto">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#1e1b4b] dark:text-white">
                Invite Friends &amp; Earn ₦2,500 Per Invite
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                Share your referral link below. Every friend who registers gives
                you instant referral rewards.
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs font-mono-num text-[#7c3aed] dark:text-[#c084fc] truncate">
              {window.location.origin}/?ref={firstName.toLowerCase()}2026
            </div>
            <button
              type="button"
              onClick={handleCopyInviteLink}
              className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Referral Link</span>
            </button>
          </section>
        )}

        {/* ==================== LOAN PAGE ==================== */}
        {subPage === 'loan' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            <div className="p-3.5 rounded-xl bg-[#f3e8ff] dark:bg-[#220e42]">
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#fbc275] text-white">
                HOT OFFER
              </span>
              <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white mt-2">
                Instant Credit up to ₦500,000
              </h2>
              <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                Zero collateral required. Disbursement goes straight to your
                EverMore wallet once your Ecoin verification is active.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('ecoin')}
              className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
            >
              Verify with Ecoin Code to Apply
            </button>
          </section>
        )}

        {/* ==================== SUPPORT / HELP PAGE ==================== */}
        {(subPage === 'support' || subPage === 'help') && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
              24/7 EverMore Customer Care
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#c4b5fd]">
              Need help purchasing your Ecoin withdrawal code or verifying a
              payout? Send a message below:
            </p>
            <textarea
              rows={3}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="Describe how we can help you..."
              className="w-full p-3 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs focus:outline-none focus:border-[#7c3aed]"
            />
            <button
              type="button"
              onClick={() => {
                if (!supportMessage.trim()) return;
                setSupportMessage('');
                showToast('Message sent to EverMore Support!');
              }}
              className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
            >
              Send Message
            </button>
          </section>
        )}

        {/* ==================== NOTIFICATIONS PAGE ==================== */}
        {subPage === 'notifications' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-3">
            <div className="p-3.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-100 dark:border-[#2a134f]">
              <p className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                Account Secured &amp; Active
              </p>
              <p className="text-xs text-slate-600 dark:text-purple-100/80 mt-1">
                Welcome to EverMore, {user.name}! Claim your daily +₦1,000
                check-in bonus and purchase your Ecoin code whenever you are
                ready to withdraw.
              </p>
            </div>
          </section>
        )}

        {/* ==================== MORE / ACCOUNT PAGE ==================== */}
        {subPage === 'more' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            <div className="space-y-1 text-xs">
              <p className="text-slate-500 dark:text-[#b794f4]">Account Holder</p>
              <p className="font-bold text-sm text-[#1e1b4b] dark:text-white">
                {user.name}
              </p>
              <p className="text-slate-500 dark:text-[#b794f4] pt-2">
                Registered Email
              </p>
              <p className="font-bold text-sm text-[#1e1b4b] dark:text-white">
                {user.email}
              </p>
            </div>

            <div className="pt-3 border-t border-purple-100 dark:border-[#2a134f] space-y-2">
              <button
                type="button"
                onClick={() => navigateTo('withdraw')}
                className="w-full py-2.5 rounded-full bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] font-bold text-xs cursor-pointer"
              >
                Go to Withdraw Page
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2.5 rounded-full border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of EverMore</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Compact Floating Purple Chat Button */}
      <button
        type="button"
        onClick={() => navigateTo('help')}
        aria-label="Open Live Support Page"
        className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 text-white shadow-[0_6px_18px_rgba(124,58,237,0.4)] flex items-center justify-center transition-all cursor-pointer"
      >
        <MessageCircle className="w-5 h-5 stroke-[2.2]" />
      </button>
    </div>
  );
};
