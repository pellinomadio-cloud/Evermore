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
  Crown,
  Eye,
  EyeOff,
  Gift,
  Headphones,
  History,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Upload,
  User,
  UserPlus,
  Users,
  Wifi,
  X,
  XCircle,
} from 'lucide-react';
import { GpayLogo } from './GpayLogo';
import { UserAccount } from './AuthPage';
import {
  addEcoinSubmission,
  addUpgradeSubmission,
  CompanyBankDetails,
  getCompanyBankDetails,
  getEcoinSubmissions,
  getUpgradeSubmissions,
} from '../utils/evermoreStore';

interface DashboardPageProps {
  user: UserAccount;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout: () => void;
  onOpenAdminDashboard: () => void;
}

type SubPageType =
  | 'home'
  | 'withdraw'
  | 'ecoin'
  | 'ecoin_payment'
  | 'groups'
  | 'top_earners'
  | 'airtime'
  | 'data'
  | 'support'
  | 'upgrade'
  | 'upgrade_payment'
  | 'watch_earn'
  | 'history'
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

interface TransactionEntry {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
}

interface StoredDashboardState {
  balance: number;
  invitesCount: number;
  checkInCount: number;
  earnedTotal: number;
  purchasedCodes: string[];
  lastClaimDate: string | null;
  transactions: TransactionEntry[];
  watchedVideoIds: string[];
  accountTier: 'Starter' | 'Silver' | 'Gold VIP';
}

function readDashboardState(storageKey: string, fallbackBalance: number): StoredDashboardState {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        balance: typeof parsed.balance === 'number' ? parsed.balance : fallbackBalance,
        invitesCount: typeof parsed.invitesCount === 'number' ? parsed.invitesCount : 0,
        checkInCount: typeof parsed.checkInCount === 'number' ? parsed.checkInCount : 0,
        earnedTotal: typeof parsed.earnedTotal === 'number' ? parsed.earnedTotal : 0,
        purchasedCodes: Array.isArray(parsed.purchasedCodes) ? parsed.purchasedCodes : [],
        lastClaimDate: typeof parsed.lastClaimDate === 'string' ? parsed.lastClaimDate : null,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
        watchedVideoIds: Array.isArray(parsed.watchedVideoIds) ? parsed.watchedVideoIds : [],
        accountTier:
          parsed.accountTier === 'Silver' || parsed.accountTier === 'Gold VIP'
            ? parsed.accountTier
            : 'Starter',
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    balance: fallbackBalance,
    invitesCount: 0,
    checkInCount: 0,
    earnedTotal: 0,
    purchasedCodes: [],
    lastClaimDate: null,
    transactions: [],
    watchedVideoIds: [],
    accountTier: 'Starter',
  };
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  darkMode,
  onToggleDarkMode,
  onLogout,
  onOpenAdminDashboard,
}) => {
  const storageKey = `evermore_state_${user.email.toLowerCase()}`;
  const initialState = readDashboardState(storageKey, user.balance ?? 0);

  const [subPage, setSubPage] = useState<SubPageType>('home');
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [accessKeyError, setAccessKeyError] = useState('');
  const [balance, setBalance] = useState<number>(initialState.balance);
  const [currencyView, setCurrencyView] = useState<'NGN' | 'ECOIN'>('NGN');
  const [hideBalance, setHideBalance] = useState(false);
  const [invitesCount, setInvitesCount] = useState(initialState.invitesCount);
  const [checkInCount, setCheckInCount] = useState(initialState.checkInCount);
  const [earnedTotal, setEarnedTotal] = useState(initialState.earnedTotal);

  // Purchased Ecoin withdrawal codes owned by this user
  const [purchasedCodes, setPurchasedCodes] = useState<string[]>(initialState.purchasedCodes);
  const [transactions, setTransactions] = useState<TransactionEntry[]>(initialState.transactions);
  const [watchedVideoIds, setWatchedVideoIds] = useState<string[]>(initialState.watchedVideoIds);
  const [accountTier, setAccountTier] = useState<'Starter' | 'Silver' | 'Gold VIP'>(
    initialState.accountTier
  );
  const [activeWatchVideo, setActiveWatchVideo] = useState<{
    id: string;
    title: string;
    reward: number;
  } | null>(null);
  const [watchSecondsLeft, setWatchSecondsLeft] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Withdraw Page Form State (Account Number -> Select Bank -> Account Name -> Ecoin Code)
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawBank, setWithdrawBank] = useState('');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawEcoinCode, setWithdrawEcoinCode] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  // Buy Ecoin & Payment Proof State
  const [companyBank, setCompanyBank] = useState<CompanyBankDetails>(() =>
    getCompanyBankDetails()
  );
  const [selectedEcoinPlan, setSelectedEcoinPlan] = useState<'standard' | 'pro'>('standard');
  const [isLoadingPaymentPage, setIsLoadingPaymentPage] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string | undefined>(undefined);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [paymentApprovalStatus, setPaymentApprovalStatus] = useState<
    'idle' | 'pending' | 'approved' | 'declined'
  >('idle');
  const [newlyGeneratedCode, setNewlyGeneratedCode] = useState<string | null>(null);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(initialState.lastClaimDate);

  // Upgrade Plan Payment & Approval State
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<{
    tier: 'Silver' | 'Gold VIP';
    fee: number;
  }>({ tier: 'Silver', fee: 25000 });
  const [isLoadingUpgradePayment, setIsLoadingUpgradePayment] = useState(false);
  const [upgradeProofFile, setUpgradeProofFile] = useState<string | null>(null);
  const [upgradeProofPreview, setUpgradeProofPreview] = useState<string | undefined>(undefined);
  const [activeUpgradeSubId, setActiveUpgradeSubId] = useState<string | null>(null);
  const [upgradeApprovalStatus, setUpgradeApprovalStatus] = useState<
    'idle' | 'pending' | 'approved' | 'declined'
  >('idle');

  // Utility / Service Pages Form State
  const [serviceNetwork, setServiceNetwork] = useState('MTN');
  const [servicePhone, setServicePhone] = useState('');
  const [serviceAmount, setServiceAmount] = useState('');
  const [serviceStatus, setServiceStatus] = useState<string | null>(null);
  const [supportMessage, setSupportMessage] = useState('');

  // Re-sync if active user storageKey changes
  useEffect(() => {
    const loaded = readDashboardState(storageKey, user.balance ?? 0);
    setBalance(loaded.balance);
    setInvitesCount(loaded.invitesCount);
    setCheckInCount(loaded.checkInCount);
    setEarnedTotal(loaded.earnedTotal);
    setPurchasedCodes(loaded.purchasedCodes);
    setLastClaimDate(loaded.lastClaimDate);
    setTransactions(loaded.transactions);
    setWatchedVideoIds(loaded.watchedVideoIds);
    setAccountTier(loaded.accountTier);
  }, [storageKey, user.balance]);

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
          lastClaimDate,
          transactions,
          watchedVideoIds,
          accountTier,
        })
      );
    } catch {
      // ignore storage errors
    }
  }, [
    balance,
    invitesCount,
    checkInCount,
    earnedTotal,
    purchasedCodes,
    lastClaimDate,
    transactions,
    watchedVideoIds,
    accountTier,
    storageKey,
  ]);

  const recordTransaction = (title: string, amount: number, type: 'credit' | 'debit') => {
    const entry: TransactionEntry = {
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      amount,
      type,
      date: new Date().toLocaleString('en-NG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setTransactions((prev) => [entry, ...prev].slice(0, 50));
  };

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

  const todayKey = new Date().toISOString().slice(0, 10);
  const alreadyClaimedToday = lastClaimDate === todayKey;

  const handleDailyClaim = () => {
    if (alreadyClaimedToday) {
      showToast("You've already claimed today's ₦67,000 bonus. Come back tomorrow!");
      return;
    }
    const reward = 67000;
    setBalance((prev) => prev + reward);
    setCheckInCount((prev) => prev + 1);
    setEarnedTotal((prev) => prev + reward);
    setLastClaimDate(todayKey);
    recordTransaction('Daily Check-in Bonus', reward, 'credit');
    showToast('+₦67,000 daily bonus added to your balance!');
  };

  // Watch to Earn countdown timer
  useEffect(() => {
    if (!activeWatchVideo) return;
    if (watchSecondsLeft <= 0) {
      const completed = activeWatchVideo;
      setActiveWatchVideo(null);
      if (!watchedVideoIds.includes(completed.id)) {
        setWatchedVideoIds((prev) => [...prev, completed.id]);
        setBalance((prev) => prev + completed.reward);
        setEarnedTotal((prev) => prev + completed.reward);
        recordTransaction(`Watch to Earn: ${completed.title}`, completed.reward, 'credit');
        showToast(`+₦${completed.reward.toLocaleString('en-NG')} earned from watching!`);
      }
      return;
    }
    const timer = setTimeout(() => {
      setWatchSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [activeWatchVideo, watchSecondsLeft, watchedVideoIds]);

  const handleStartPurchaseCoin = (plan?: 'standard' | 'pro') => {
    if (plan) {
      setSelectedEcoinPlan(plan);
    }
    setCompanyBank(getCompanyBankDetails());
    setIsLoadingPaymentPage(true);
    setPaymentProofFile(null);
    setPaymentProofPreview(undefined);
    setActiveSubmissionId(null);
    setPaymentApprovalStatus('idle');
    setNewlyGeneratedCode(null);
    navigateTo('ecoin_payment');
    setTimeout(() => {
      setIsLoadingPaymentPage(false);
    }, 1200);
  };

  const handleUploadProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentProofFile(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setPaymentProofPreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setPaymentProofPreview(undefined);
      }
    }
  };

  const handleSubmitPaymentForApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProofFile) {
      showToast('Please upload your payment receipt first.');
      return;
    }
    const submissionId = `sub-${Date.now()}`;
    addEcoinSubmission({
      id: submissionId,
      userName: user.name,
      userEmail: user.email,
      plan: selectedEcoinPlan,
      amount: selectedEcoinPlan === 'standard' ? 5500 : 10000,
      receiptName: paymentProofFile,
      receiptPreviewUrl: paymentProofPreview,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setActiveSubmissionId(submissionId);
    setPaymentApprovalStatus('pending');
    showToast('Payment receipt submitted for approval.');
  };

  const handleCheckCompanyApproval = () => {
    if (!activeSubmissionId) return;
    const allSubs = getEcoinSubmissions();
    const match = allSubs.find((s) => s.id === activeSubmissionId);
    if (!match) return;

    if (match.status === 'approved' && match.ecoinCode) {
      setPurchasedCodes((prev) =>
        prev.includes(match.ecoinCode!) ? prev : [match.ecoinCode!, ...prev]
      );
      setNewlyGeneratedCode(match.ecoinCode);
      setPaymentApprovalStatus('approved');
      showToast(`Approved! Your Ecoin code is ${match.ecoinCode}`);
    } else if (match.status === 'declined') {
      setPaymentApprovalStatus('declined');
      showToast('Payment was declined. Please upload a valid receipt.');
    } else {
      showToast('Still pending review. Please check back shortly.');
    }
  };

  const handleStartUpgradePayment = (tier: 'Silver' | 'Gold VIP', fee: number) => {
    setSelectedUpgradePlan({ tier, fee });
    setCompanyBank(getCompanyBankDetails());
    setIsLoadingUpgradePayment(true);
    setUpgradeProofFile(null);
    setUpgradeProofPreview(undefined);
    setActiveUpgradeSubId(null);
    setUpgradeApprovalStatus('idle');
    navigateTo('upgrade_payment');
    setTimeout(() => {
      setIsLoadingUpgradePayment(false);
    }, 1200);
  };

  const handleUpgradeProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUpgradeProofFile(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setUpgradeProofPreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setUpgradeProofPreview(undefined);
      }
    }
  };

  const handleSubmitUpgradeForApproval = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeProofFile) {
      showToast('Please upload your payment receipt first.');
      return;
    }
    const submissionId = `upg-${Date.now()}`;
    addUpgradeSubmission({
      id: submissionId,
      userName: user.name,
      userEmail: user.email,
      tier: selectedUpgradePlan.tier,
      amount: selectedUpgradePlan.fee,
      receiptName: upgradeProofFile,
      receiptPreviewUrl: upgradeProofPreview,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    setActiveUpgradeSubId(submissionId);
    setUpgradeApprovalStatus('pending');
    showToast('Upgrade payment submitted for approval.');
  };

  const handleCheckUpgradeApproval = () => {
    if (!activeUpgradeSubId) return;
    const allSubs = getUpgradeSubmissions();
    const match = allSubs.find((s) => s.id === activeUpgradeSubId);
    if (!match) return;

    if (match.status === 'approved') {
      setAccountTier(match.tier);
      setUpgradeApprovalStatus('approved');
      recordTransaction(`Upgraded to ${match.tier} Tier`, match.amount, 'debit');
      showToast(`Approved! Your account is now ${match.tier} Tier.`);
    } else if (match.status === 'declined') {
      setUpgradeApprovalStatus('declined');
      showToast('Upgrade payment was declined. Please upload a valid receipt.');
    } else {
      showToast('Still pending review. Please check back shortly.');
    }
  };

  const handleAccessKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessKeyInput.trim() === 'MACELL999') {
      setShowKeyPrompt(false);
      setAccessKeyInput('');
      setAccessKeyError('');
      onOpenAdminDashboard();
    } else {
      setAccessKeyError('Invalid key.');
    }
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
    recordTransaction(`Withdrawal to ${withdrawBank}`, amountNum, 'debit');
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
    if (accountTier === 'Starter') {
      setServiceStatus('Please upgrade your account before purchasing Airtime or Data.');
      return;
    }
    const num = Number(serviceAmount);
    if (!num || num <= 0) return;
    if (num > balance) {
      setServiceStatus(
        `Insufficient balance (₦${balance.toLocaleString('en-NG')}). Claim daily rewards first.`
      );
      return;
    }
    setBalance((prev) => prev - num);
    recordTransaction(`${serviceLabel} (${serviceNetwork})`, num, 'debit');
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
    ecoin_payment: 'Complete Ecoin Payment',
    groups: 'EverMore Earner Groups',
    top_earners: 'Top Earners Leaderboard',
    airtime: 'Buy Airtime',
    data: 'Buy Data Bundle',
    support: 'Support Center',
    upgrade: 'Upgrade Account',
    upgrade_payment: 'Complete Upgrade Payment',
    watch_earn: 'Watch to Earn',
    history: 'Transaction History',
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
              <button
                type="button"
                onClick={() => setIsLeftDrawerOpen(true)}
                aria-label="Open menu drawer"
                className="cursor-pointer focus:outline-none rounded-lg active:scale-95 transition-transform"
              >
                <GpayLogo size="sm" iconOnly />
              </button>
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
                  className={`px-4 py-2 rounded-full font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                    alreadyClaimedToday
                      ? 'bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc]'
                      : 'bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-95 text-white shadow-[0_4px_14px_rgba(124,58,237,0.3)]'
                  }`}
                >
                  <Gift className="w-4 h-4 stroke-[2]" />
                  <span>{alreadyClaimedToday ? 'Claimed' : 'Claim'}</span>
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
                  <span className="truncate">{checkInCount} Check-in +₦67,000</span>
                </button>

                <div className="bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] px-2 py-1 rounded-full text-[10.5px] sm:text-xs font-semibold inline-flex items-center justify-center truncate">
                  <span className="truncate">
                    ₦{earnedTotal.toLocaleString('en-NG')} Earned
                  </span>
                </div>
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
                  onClick={() => navigateTo('upgrade')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <Crown className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    Upgrade
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('watch_earn')}
                  className="flex flex-col items-center group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <PlayCircle className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-[11px] font-medium text-[#4c4669] dark:text-[#c4b5fd] text-center leading-tight">
                    Watch to
                    <br />
                    Earn
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('history')}
                  className="flex flex-col items-center group cursor-pointer relative"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] dark:bg-[#261147] group-hover:bg-[#e9d5ff] flex items-center justify-center text-[#7c3aed] dark:text-[#c084fc] transition-colors">
                    <History className="w-4 h-4 stroke-[2]" />
                  </div>
                  <span className="mt-1.5 text-xs font-medium text-[#4c4669] dark:text-[#c4b5fd]">
                    History
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
                  onClick={() => setIsLeftDrawerOpen(true)}
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

        {/* ==================== BUY ECOIN PAGE (SELECT PLAN ONLY) ==================== */}
        {subPage === 'ecoin' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            <div className="p-3.5 rounded-xl bg-[#f3e8ff] dark:bg-[#220e42] border border-purple-200 dark:border-[#3b1c6e]">
              <h2 className="text-sm font-extrabold text-[#7c3aed] dark:text-[#c084fc]">
                Purchase Ecoin Withdrawal Code
              </h2>
              <p className="text-xs text-slate-600 dark:text-purple-100/90 mt-1 leading-relaxed">
                Select an Ecoin plan below to get your payment details and activate
                withdrawals.
              </p>
            </div>

            {purchasedCodes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-700 dark:text-purple-200">
                  Your Approved Ecoin Codes ({purchasedCodes.length}):
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

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-2">
                  Select Plan
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleStartPurchaseCoin('standard')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEcoinPlan === 'standard'
                        ? 'border-[#7c3aed] bg-[#f3e8ff] dark:bg-[#261147]'
                        : 'border-purple-200 dark:border-[#331860] bg-[#faf7ff] dark:bg-[#110622]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                      Standard Ecoin
                    </p>
                    <p className="font-mono-num text-base font-extrabold text-[#7c3aed] dark:text-[#c084fc] mt-1">
                      ₦5,500
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-purple-200/70 mt-0.5">
                      1 Withdrawal Code
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartPurchaseCoin('pro')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedEcoinPlan === 'pro'
                        ? 'border-[#7c3aed] bg-[#f3e8ff] dark:bg-[#261147]'
                        : 'border-purple-200 dark:border-[#331860] bg-[#faf7ff] dark:bg-[#110622]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                      VIP Unlimited
                    </p>
                    <p className="font-mono-num text-base font-extrabold text-[#7c3aed] dark:text-[#c084fc] mt-1">
                      ₦10,000
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-purple-200/70 mt-0.5">
                      Priority Payouts
                    </p>
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleStartPurchaseCoin(selectedEcoinPlan)}
                className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  Purchase Coin (
                  {selectedEcoinPlan === 'standard' ? '₦5,500' : '₦10,000'})
                </span>
              </button>
            </div>
          </section>
        )}

        {/* ==================== ECOIN COMPANY PAYMENT & UPLOAD PAGE ==================== */}
        {subPage === 'ecoin_payment' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            {isLoadingPaymentPage ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Loading Payment Details...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#c4b5fd]">
                    Preparing company bank account for{' '}
                    <strong>
                      {selectedEcoinPlan === 'standard'
                        ? 'Standard Ecoin (₦5,500)'
                        : 'VIP Unlimited (₦10,000)'}
                    </strong>
                  </p>
                </div>
              </div>
            ) : (
              paymentApprovalStatus === 'idle' && (
              <>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                    Step 1: Pay into Company Account
                  </p>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd]">
                    Transfer{' '}
                    <strong className="text-[#1e1b4b] dark:text-white">
                      {selectedEcoinPlan === 'standard' ? '₦5,500' : '₦10,000'}
                    </strong>{' '}
                    to the account below:
                  </p>
                </div>

                {/* Simple & Clear Company Bank Box (Managed from Admin) */}
                <div className="rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#b794f4]">Bank Name</span>
                    <span className="font-bold text-[#1e1b4b] dark:text-white">
                      {companyBank.bankName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#b794f4]">
                      Account Number
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num font-extrabold text-sm text-[#7c3aed] dark:text-[#c084fc]">
                        {companyBank.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(companyBank.accountNumber)}
                        className="px-2 py-0.5 rounded-md bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] font-bold text-[11px] cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-[#b794f4]">
                      Account Name
                    </span>
                    <span className="font-bold text-[#1e1b4b] dark:text-white">
                      {companyBank.accountName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-purple-100 dark:border-[#2a134f]">
                    <span className="text-slate-500 dark:text-[#b794f4]">Amount</span>
                    <span className="font-mono-num font-extrabold text-sm text-[#1e1b4b] dark:text-white">
                      {selectedEcoinPlan === 'standard' ? '₦5,500' : '₦10,000'}
                    </span>
                  </div>
                </div>

                {/* Step 2: Upload Payment Proof */}
                <form onSubmit={handleSubmitPaymentForApproval} className="space-y-3.5">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                      Step 2: Upload Payment Receipt
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
                      After making the transfer, upload your receipt for company
                      approval.
                    </p>
                  </div>

                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 dark:border-[#3b1c6e] bg-[#faf7ff] dark:bg-[#110622] p-5 text-center cursor-pointer hover:border-[#7c3aed] transition-colors">
                    <Upload className="w-5 h-5 text-[#7c3aed] dark:text-[#c084fc]" />
                    <span className="text-xs font-semibold text-[#1e1b4b] dark:text-white">
                      {paymentProofFile
                        ? `Uploaded: ${paymentProofFile}`
                        : 'Tap to upload payment screenshot / receipt'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-[#b794f4]">
                      JPG, PNG or PDF supported
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleUploadProofChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
                  >
                    Submit Payment for Approval
                  </button>
                </form>
              </>
            ))}

            {!isLoadingPaymentPage && paymentApprovalStatus === 'pending' && (
              <div className="text-center py-3 space-y-3.5">
                <div className="w-11 h-11 rounded-full bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center mx-auto">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Waiting for Company Approval
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                    Receipt <strong>{paymentProofFile}</strong> has been submitted for
                    review. Once approved, your Ecoin code will appear here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckCompanyApproval}
                  className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
                >
                  Check Approval Status
                </button>
              </div>
            )}

            {!isLoadingPaymentPage && paymentApprovalStatus === 'declined' && (
              <div className="text-center py-3 space-y-3.5">
                <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Payment Declined
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                    Your uploaded payment receipt could not be verified. Please
                    upload a clear receipt and try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentProofFile(null);
                    setPaymentProofPreview(undefined);
                    setPaymentApprovalStatus('idle');
                  }}
                  className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
                >
                  Upload New Receipt
                </button>
              </div>
            )}

            {!isLoadingPaymentPage && paymentApprovalStatus === 'approved' && newlyGeneratedCode && (
              <div className="text-center py-2 space-y-3.5">
                <div className="w-11 h-11 rounded-full bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Payment Approved!
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                    Your Ecoin withdrawal code is ready:
                  </p>
                </div>

                <div className="flex items-center justify-between bg-[#f3e8ff] dark:bg-[#261147] rounded-xl px-4 py-3">
                  <span className="font-mono-num text-base font-extrabold tracking-wider text-[#7c3aed] dark:text-[#c084fc]">
                    {newlyGeneratedCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(newlyGeneratedCode)}
                    className="inline-flex items-center gap-1 text-xs font-bold bg-[#7c3aed] text-white px-3 py-1 rounded-lg cursor-pointer"
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
                  className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
                >
                  Go to Withdraw Page →
                </button>
              </div>
            )}
          </section>
        )}

        {/* ==================== UTILITY PAGES (AIRTIME / DATA) ==================== */}
        {(subPage === 'airtime' || subPage === 'data') && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            {accountTier === 'Starter' ? (
              <div className="text-center py-4 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center mx-auto">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Upgrade Required for {subPage === 'airtime' ? 'Airtime' : 'Data'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] leading-relaxed">
                    Your account is currently on the <strong>Starter</strong> tier.
                    Please upgrade your account to Silver or Gold VIP to buy{' '}
                    {subPage === 'airtime' ? 'Airtime' : 'Data'}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('upgrade')}
                  className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
                >
                  Upgrade Account Now
                </button>
              </div>
            ) : (
              <>
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
                      {['MTN', 'Airtel', 'Glo', '9mobile'].map((provider) => (
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
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={servicePhone}
                      onChange={(e) => setServicePhone(e.target.value)}
                      placeholder="0803 000 0000"
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
              </>
            )}
          </section>
        )}

        {/* ==================== UPGRADE PAGE ==================== */}
        {subPage === 'upgrade' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            <div className="p-3.5 rounded-xl bg-[#f3e8ff] dark:bg-[#220e42] flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
                  Current Account Tier
                </p>
                <h2 className="text-sm font-extrabold text-[#7c3aed] dark:text-[#c084fc]">
                  {accountTier} Member
                </h2>
              </div>
              <Crown className="w-6 h-6 text-[#7c3aed] dark:text-[#c084fc]" />
            </div>

            <div className="space-y-3">
              {[
                {
                  tier: 'Silver' as const,
                  title: 'Silver Tier',
                  perk: 'Unlocks Watch to Earn & higher daily limits',
                  fee: 25000,
                },
                {
                  tier: 'Gold VIP' as const,
                  title: 'Gold VIP Tier',
                  perk: 'Unlocks Watch to Earn & priority Ecoin payouts',
                  fee: 50000,
                },
              ].map((plan) => {
                const isCurrent = accountTier === plan.tier;
                return (
                  <div
                    key={plan.tier}
                    className="p-4 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-[#1e1b4b] dark:text-white">
                        {plan.title}
                      </p>
                      <span className="font-mono-num text-xs font-extrabold text-[#7c3aed] dark:text-[#c084fc]">
                        ₦{plan.fee.toLocaleString('en-NG')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-[#c4b5fd]">
                      {plan.perk}
                    </p>
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => handleStartUpgradePayment(plan.tier, plan.fee)}
                      className={`w-full py-2.5 rounded-full font-bold text-xs ${
                        isCurrent
                          ? 'bg-purple-100 dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] cursor-default'
                          : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white cursor-pointer'
                      }`}
                    >
                      {isCurrent ? 'Active Plan' : `Select ${plan.title}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ==================== UPGRADE COMPANY PAYMENT & UPLOAD PAGE ==================== */}
        {subPage === 'upgrade_payment' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            {isLoadingUpgradePayment ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center mx-auto">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Loading Payment Details...
                  </p>
                  <p className="text-xs text-slate-500 dark:text-[#c4b5fd]">
                    Preparing company bank account for{' '}
                    <strong>
                      {selectedUpgradePlan.tier} Tier (₦
                      {selectedUpgradePlan.fee.toLocaleString('en-NG')})
                    </strong>
                  </p>
                </div>
              </div>
            ) : (
              upgradeApprovalStatus === 'idle' && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                      Step 1: Pay into Company Account
                    </p>
                    <p className="text-xs text-slate-600 dark:text-[#c4b5fd]">
                      Transfer{' '}
                      <strong className="text-[#1e1b4b] dark:text-white">
                        ₦{selectedUpgradePlan.fee.toLocaleString('en-NG')}
                      </strong>{' '}
                      to upgrade to{' '}
                      <strong className="text-[#1e1b4b] dark:text-white">
                        {selectedUpgradePlan.tier} Tier
                      </strong>
                      :
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] p-4 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#b794f4]">Bank Name</span>
                      <span className="font-bold text-[#1e1b4b] dark:text-white">
                        {companyBank.bankName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#b794f4]">
                        Account Number
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-num font-extrabold text-sm text-[#7c3aed] dark:text-[#c084fc]">
                          {companyBank.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(companyBank.accountNumber)}
                          className="px-2 py-0.5 rounded-md bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] font-bold text-[11px] cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#b794f4]">
                        Account Name
                      </span>
                      <span className="font-bold text-[#1e1b4b] dark:text-white">
                        {companyBank.accountName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-purple-100 dark:border-[#2a134f]">
                      <span className="text-slate-500 dark:text-[#b794f4]">Amount</span>
                      <span className="font-mono-num font-extrabold text-sm text-[#1e1b4b] dark:text-white">
                        ₦{selectedUpgradePlan.fee.toLocaleString('en-NG')}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitUpgradeForApproval} className="space-y-3.5">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                        Step 2: Upload Payment Receipt
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
                        After making the transfer, upload your receipt for company
                        approval.
                      </p>
                    </div>

                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-purple-300 dark:border-[#3b1c6e] bg-[#faf7ff] dark:bg-[#110622] p-5 text-center cursor-pointer hover:border-[#7c3aed] transition-colors">
                      <Upload className="w-5 h-5 text-[#7c3aed] dark:text-[#c084fc]" />
                      <span className="text-xs font-semibold text-[#1e1b4b] dark:text-white">
                        {upgradeProofFile
                          ? `Uploaded: ${upgradeProofFile}`
                          : 'Tap to upload payment screenshot / receipt'}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-[#b794f4]">
                        JPG, PNG or PDF supported
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleUpgradeProofChange}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
                    >
                      Submit Payment for Approval
                    </button>
                  </form>
                </>
              )
            )}

            {!isLoadingUpgradePayment && upgradeApprovalStatus === 'pending' && (
              <div className="text-center py-3 space-y-3.5">
                <div className="w-11 h-11 rounded-full bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center mx-auto">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Waiting for Company Approval
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                    Receipt <strong>{upgradeProofFile}</strong> has been submitted for{' '}
                    <strong>{selectedUpgradePlan.tier} Tier</strong>. Once approved,
                    Watch to Earn will unlock.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckUpgradeApproval}
                  className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
                >
                  Check Approval Status
                </button>
              </div>
            )}

            {!isLoadingUpgradePayment && upgradeApprovalStatus === 'declined' && (
              <div className="text-center py-3 space-y-3.5">
                <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Payment Declined
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                    Your uploaded payment receipt could not be verified. Please
                    upload a clear receipt and try again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUpgradeProofFile(null);
                    setUpgradeProofPreview(undefined);
                    setUpgradeApprovalStatus('idle');
                  }}
                  className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
                >
                  Upload New Receipt
                </button>
              </div>
            )}

            {!isLoadingUpgradePayment && upgradeApprovalStatus === 'approved' && (
              <div className="text-center py-2 space-y-3.5">
                <div className="w-11 h-11 rounded-full bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Account Upgraded to {accountTier}!
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                    Watch to Earn is now unlocked on your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('watch_earn')}
                  className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
                >
                  Open Watch to Earn →
                </button>
              </div>
            )}
          </section>
        )}

        {/* ==================== WATCH TO EARN PAGE ==================== */}
        {subPage === 'watch_earn' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-4">
            {accountTier === 'Starter' ? (
              <div className="text-center py-4 space-y-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center mx-auto">
                  <Crown className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                    Upgrade Required to Open Watch to Earn
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] leading-relaxed">
                    Your account is currently on the <strong>Starter</strong> tier.
                    Please upgrade your account to Silver or Gold VIP to unlock
                    Watch to Earn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('upgrade')}
                  className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
                >
                  Upgrade Account Now
                </button>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-xl bg-[#f3e8ff] dark:bg-[#220e42]">
                  <h2 className="text-sm font-extrabold text-[#7c3aed] dark:text-[#c084fc]">
                    Watch Videos &amp; Earn Instant Rewards
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-[#c4b5fd] mt-1">
                    Watch short featured clips below for 5 seconds to add Naira
                    rewards to your balance.
                  </p>
                </div>

                {activeWatchVideo && (
                  <div className="p-4 rounded-xl bg-[#1e1b4b] text-white space-y-2.5 text-center">
                    <PlayCircle className="w-8 h-8 text-[#c084fc] mx-auto animate-pulse" />
                    <p className="text-xs font-bold">{activeWatchVideo.title}</p>
                    <p className="text-[11px] text-purple-200">
                      Watching... Reward unlocks in{' '}
                      <span className="font-mono-num font-extrabold text-white">
                        {watchSecondsLeft}s
                      </span>
                    </p>
                  </div>
                )}

                <div className="space-y-2.5">
                  {[
                    { id: 'vid-1', title: 'EverMore Wallet Intro', duration: '5s', reward: 1500 },
                    { id: 'vid-2', title: 'Partner Brand Spotlight', duration: '5s', reward: 2000 },
                    { id: 'vid-3', title: 'Daily Cashback Promo Clip', duration: '5s', reward: 2500 },
                  ].map((video) => {
                    const alreadyWatched = watchedVideoIds.includes(video.id);
                    const isWatching = activeWatchVideo?.id === video.id;
                    return (
                      <div
                        key={video.id}
                        className="p-3.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] flex items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-xs font-bold text-[#1e1b4b] dark:text-white">
                            {video.title}
                          </p>
                          <p className="text-[11px] text-[#7c3aed] dark:text-[#c084fc] font-semibold mt-0.5">
                            +₦{video.reward.toLocaleString('en-NG')} · {video.duration}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={alreadyWatched || Boolean(activeWatchVideo)}
                          onClick={() => {
                            setActiveWatchVideo({
                              id: video.id,
                              title: video.title,
                              reward: video.reward,
                            });
                            setWatchSecondsLeft(5);
                          }}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 ${
                            alreadyWatched
                              ? 'bg-purple-100 dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc]'
                              : isWatching
                              ? 'bg-[#6d28d9] text-white'
                              : 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white cursor-pointer'
                          }`}
                        >
                          {alreadyWatched ? 'Earned' : isWatching ? 'Watching...' : 'Watch'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {/* ==================== HISTORY PAGE ==================== */}
        {subPage === 'history' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] p-5 shadow-md border border-purple-100 dark:border-[#31175c] space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                Recent Activity
              </h2>
              <span className="text-[11px] font-bold text-[#7c3aed] dark:text-[#c084fc]">
                {transactions.length} {transactions.length === 1 ? 'record' : 'records'}
              </span>
            </div>

            {transactions.length === 0 ? (
              <div className="py-10 text-center space-y-1.5">
                <History className="w-7 h-7 text-purple-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-[#c4b5fd]">
                  No transactions yet.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-[#b794f4]">
                  Claim your daily bonus or watch videos to see your history here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-purple-100 dark:divide-[#2a134f]">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <p className="font-bold text-[#1e1b4b] dark:text-white">
                        {tx.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-[#b794f4]">
                        {tx.date}
                      </p>
                    </div>
                    <span
                      className={`font-mono-num font-extrabold shrink-0 ${
                        tx.type === 'credit'
                          ? 'text-[#7c3aed] dark:text-[#c084fc]'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {tx.type === 'credit' ? '+' : '-'}₦
                      {tx.amount.toLocaleString('en-NG')}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
                Welcome to EverMore, {user.name}! Claim your daily +₦67,000
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

      {/* Left-Side Slide-Out Navigation Drawer */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${
          isLeftDrawerOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isLeftDrawerOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setIsLeftDrawerOpen(false)}
          className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        />

        {/* Slide Panel from Left */}
        <aside
          className={`relative h-full w-72 max-w-[82vw] bg-white dark:bg-[#150829] border-r border-purple-100 dark:border-[#2d1650] shadow-2xl flex flex-col transform transition-transform duration-200 ease-out ${
            isLeftDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Top Header */}
          <div className="px-4 py-4 border-b border-purple-100 dark:border-[#2d1650] flex items-center justify-between">
            <GpayLogo size="sm" lightText={darkMode} />
            <button
              type="button"
              onClick={() => setIsLeftDrawerOpen(false)}
              aria-label="Close drawer"
              className="w-8 h-8 rounded-full bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center hover:bg-[#e9d5ff] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Profile & Balance Summary */}
          <div className="px-4 py-4 bg-[#faf7ff] dark:bg-[#1b0b36] border-b border-purple-100 dark:border-[#2d1650]">
            <p className="text-sm font-extrabold text-[#1e1b4b] dark:text-white truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd] truncate">
              {user.email}
            </p>
            <div className="mt-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-[#b794f4]">Balance</span>
              <span className="font-mono-num font-extrabold text-[#7c3aed] dark:text-[#a855f7]">
                ₦{balance.toLocaleString('en-NG')}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1 text-xs font-semibold">
            {[
              { label: 'Dashboard Home', page: 'home' as SubPageType, icon: Home },
              { label: 'Buy Ecoin Code', page: 'ecoin' as SubPageType, icon: CreditCard },
              { label: 'Withdraw Funds', page: 'withdraw' as SubPageType, icon: TrendingUp },
              { label: 'Upgrade Account', page: 'upgrade' as SubPageType, icon: Crown },
              { label: 'Watch to Earn', page: 'watch_earn' as SubPageType, icon: PlayCircle },
              { label: 'History', page: 'history' as SubPageType, icon: History },
              { label: 'Top Earners', page: 'top_earners' as SubPageType, icon: TrendingUp },
              { label: 'Earner Groups', page: 'groups' as SubPageType, icon: Building2 },
              { label: 'Airtime & Data', page: 'airtime' as SubPageType, icon: Smartphone },
              { label: 'Invite Friends', page: 'invite' as SubPageType, icon: UserPlus },
              { label: 'Account Profile', page: 'more' as SubPageType, icon: User },
              { label: 'Support & Help', page: 'help' as SubPageType, icon: Headphones },
            ].map((item) => {
              const IconComp = item.icon;
              const isActive = subPage === item.page;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setIsLeftDrawerOpen(false);
                    navigateTo(item.page);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc]'
                      : 'text-[#4c4669] dark:text-[#c4b5fd] hover:bg-[#faf7ff] dark:hover:bg-[#1d0c38]'
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Drawer Footer: Logout + Silent Red Dot at the bottom */}
          <div className="p-3 border-t border-purple-100 dark:border-[#2d1650] space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsLeftDrawerOpen(false);
                onLogout();
              }}
              className="w-full py-2.5 rounded-full border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs inline-flex items-center justify-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <div className="flex justify-center pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setIsLeftDrawerOpen(false);
                  setAccessKeyInput('');
                  setAccessKeyError('');
                  setShowKeyPrompt(true);
                }}
                className="w-2.5 h-2.5 rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
              />
            </div>
          </div>
        </aside>
      </div>

      {/* Silent Key Verification Modal */}
      {showKeyPrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17092e] border border-purple-200 dark:border-[#31175c] rounded-2xl max-w-xs w-full p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                Enter Access Key
              </h3>
              <button
                type="button"
                onClick={() => setShowKeyPrompt(false)}
                className="w-7 h-7 rounded-full bg-[#f3e8ff] dark:bg-[#261147] flex items-center justify-center text-[#7c3aed] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {accessKeyError && (
              <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                {accessKeyError}
              </p>
            )}

            <form onSubmit={handleAccessKeySubmit} className="space-y-3">
              <input
                type="password"
                value={accessKeyInput}
                onChange={(e) => {
                  setAccessKeyInput(e.target.value);
                  if (accessKeyError) setAccessKeyError('');
                }}
                placeholder="Enter key"
                autoFocus
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs cursor-pointer"
              >
                Continue
              </button>
            </form>
          </div>
        </div>
      )}

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
