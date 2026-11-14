import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  CreditCard,
  Headphones,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { GpayLogo } from './GpayLogo';
import {
  approveEcoinSubmission,
  approveUpgradeSubmission,
  CommunityLinks,
  CompanyBankDetails,
  declineEcoinSubmission,
  declineUpgradeSubmission,
  DEFAULT_COMMUNITY_LINKS,
  DEFAULT_COMPANY_BANK,
  DEFAULT_ECOIN_PRICES,
  EcoinPrices,
  EcoinSubmission,
  getCommunityLinks,
  getCompanyBankDetails,
  getEcoinPrices,
  getRegisteredUserAmounts,
  RegisteredUserAmount,
  saveCommunityLinks,
  saveCompanyBankDetails,
  saveEcoinPrices,
  sendAdminSupportReply,
  subscribeAllSupportThreads,
  subscribeCommunityLinks,
  subscribeCompanyBankDetails,
  subscribeEcoinPrices,
  subscribeEcoinSubmissions,
  subscribeRegisteredUserAmounts,
  subscribeUpgradeSubmissions,
  SupportThread,
  UpgradeSubmission,
} from '../utils/evermoreStore';

interface AdminDashboardProps {
  darkMode: boolean;
  onExit: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  darkMode,
  onExit,
}) => {
  const [bankDetails, setBankDetails] = useState<CompanyBankDetails>(DEFAULT_COMPANY_BANK);
  const [ecoinPriceInputs, setEcoinPriceInputs] = useState<{
    standardPrice: string;
    proPrice: string;
  }>({
    standardPrice: String(DEFAULT_ECOIN_PRICES.standardPrice),
    proPrice: String(DEFAULT_ECOIN_PRICES.proPrice),
  });
  const [communityLinks, setCommunityLinks] = useState<CommunityLinks>(DEFAULT_COMMUNITY_LINKS);
  const [submissions, setSubmissions] = useState<EcoinSubmission[]>([]);
  const [upgradeSubmissions, setUpgradeSubmissions] = useState<UpgradeSubmission[]>([]);
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [selectedThreadUserId, setSelectedThreadUserId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [userSummary, setUserSummary] = useState<{
    totalUsers: number;
    totalBalance: number;
    users: RegisteredUserAmount[];
  }>({ totalUsers: 0, totalBalance: 0, users: [] });
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'support' | 'bank' | 'groups' | 'users'>('payments');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubBank = subscribeCompanyBankDetails((details) => {
      setBankDetails(details);
    });
    const unsubPrices = subscribeEcoinPrices((prices: EcoinPrices) => {
      setEcoinPriceInputs({
        standardPrice: String(prices.standardPrice),
        proPrice: String(prices.proPrice),
      });
    });
    const unsubLinks = subscribeCommunityLinks((links) => {
      setCommunityLinks(links);
    });
    const unsubEcoin = subscribeEcoinSubmissions((items) => {
      setSubmissions(items);
    });
    const unsubUpgrade = subscribeUpgradeSubmissions((items) => {
      setUpgradeSubmissions(items);
    });
    const unsubSupport = subscribeAllSupportThreads((threads) => {
      setSupportThreads(threads);
    });
    const unsubUsers = subscribeRegisteredUserAmounts((summary) => {
      setUserSummary(summary);
    });

    return () => {
      unsubBank();
      unsubPrices();
      unsubLinks();
      unsubEcoin();
      unsubUpgrade();
      unsubSupport();
      unsubUsers();
    };
  }, []);

  const showNotice = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => {
      setStatusBanner((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const handleManualRefresh = async () => {
    try {
      const [bank, prices, links, summary] = await Promise.all([
        getCompanyBankDetails(),
        getEcoinPrices(),
        getCommunityLinks(),
        getRegisteredUserAmounts(),
      ]);
      setBankDetails(bank);
      setEcoinPriceInputs({
        standardPrice: String(prices.standardPrice),
        proPrice: String(prices.proPrice),
      });
      setCommunityLinks(links);
      setUserSummary(summary);
      showNotice('Synced with Firebase.');
    } catch {
      showNotice('Sync check failed.');
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !bankDetails.bankName.trim() ||
      !bankDetails.accountNumber.trim() ||
      !bankDetails.accountName.trim()
    ) {
      return;
    }
    setBusyId('save-bank');
    try {
      await saveCompanyBankDetails({
        bankName: bankDetails.bankName.trim(),
        accountNumber: bankDetails.accountNumber.trim(),
        accountName: bankDetails.accountName.trim(),
      });
      showNotice('Company bank account details saved to Firebase.');
    } catch {
      showNotice('Failed to save bank details. Check Firestore rules.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveCommunityLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId('save-links');
    try {
      await saveCommunityLinks({
        telegramUrl: communityLinks.telegramUrl.trim(),
        whatsappUrl: communityLinks.whatsappUrl.trim(),
      });
      showNotice('Telegram & WhatsApp channel links saved to Firebase.');
    } catch {
      showNotice('Failed to save channel links. Check Firestore rules.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSaveEcoinPrices = async (e: React.FormEvent) => {
    e.preventDefault();
    const standardPrice = Number(ecoinPriceInputs.standardPrice);
    const proPrice = Number(ecoinPriceInputs.proPrice);
    if (!standardPrice || standardPrice <= 0 || !proPrice || proPrice <= 0) {
      showNotice('Please enter valid Ecoin prices greater than 0.');
      return;
    }
    setBusyId('save-prices');
    try {
      await saveEcoinPrices({ standardPrice, proPrice });
      showNotice('Ecoin prices updated across Firebase.');
    } catch {
      showNotice('Failed to save Ecoin prices. Check Firestore rules.');
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = async (submission: EcoinSubmission) => {
    setBusyId(submission.id);
    try {
      const code = await approveEcoinSubmission(submission);
      showNotice(`Payment approved! Ecoin code ${code} issued to user.`);
    } catch {
      showNotice('Failed to approve Ecoin payment.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (id: string) => {
    setBusyId(id);
    try {
      await declineEcoinSubmission(id);
      showNotice('Payment declined.');
    } catch {
      showNotice('Failed to decline payment.');
    } finally {
      setBusyId(null);
    }
  };

  const handleApproveUpgrade = async (submission: UpgradeSubmission) => {
    setBusyId(submission.id);
    try {
      const tier = await approveUpgradeSubmission(submission);
      showNotice(`Upgrade approved! User upgraded to ${tier} tier.`);
    } catch {
      showNotice('Failed to approve upgrade payment.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeclineUpgrade = async (id: string) => {
    setBusyId(id);
    try {
      await declineUpgradeSubmission(id);
      showNotice('Upgrade payment declined.');
    } catch {
      showNotice('Failed to decline upgrade payment.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSendSupportReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadUserId || !replyText.trim()) return;
    setBusyId(`reply-${selectedThreadUserId}`);
    try {
      await sendAdminSupportReply(selectedThreadUserId, replyText);
      setReplyText('');
      showNotice('Reply sent to user.');
    } catch {
      showNotice('Failed to send reply. Check Firestore rules.');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount =
    submissions.filter((s) => s.status === 'pending').length +
    upgradeSubmissions.filter((u) => u.status === 'pending').length;
  const totalSubmissionsCount = submissions.length + upgradeSubmissions.length;
  const awaitingSupportCount = supportThreads.filter((t) => t.awaitingAdminReply).length;
  const selectedThread =
    supportThreads.find((t) => t.userId === selectedThreadUserId) || null;

  return (
    <div className="min-h-screen bg-[#f6f3ff] dark:bg-[#0f051d] text-[#1e1b4b] dark:text-white pb-16 transition-colors duration-200">
      {statusBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] rounded-xl bg-[#7c3aed] text-white px-4 py-2.5 shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* Top Admin Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-[#150829] border-b border-purple-100 dark:border-[#2d1650]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <GpayLogo size="sm" lightText={darkMode} />
            <span className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc] border-l border-purple-200 dark:border-[#331860] pl-2.5">
              Admin Console
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              aria-label="Refresh admin data"
              className="w-8 h-8 rounded-full bg-[#f3e8ff] dark:bg-[#220e42] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center hover:bg-[#e9d5ff] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Top Metrics Strip */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-3.5">
            <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
              Registered Users
            </p>
            <p className="font-mono-num text-xl font-extrabold text-[#7c3aed] dark:text-[#a855f7] mt-0.5">
              {userSummary.totalUsers}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-3.5">
            <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
              Pending Approvals
            </p>
            <p className="font-mono-num text-xl font-extrabold text-[#1e1b4b] dark:text-white mt-0.5">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-3.5">
            <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd]">
              Total User Balance
            </p>
            <p className="font-mono-num text-lg sm:text-xl font-extrabold text-[#7c3aed] dark:text-[#a855f7] mt-0.5 truncate">
              ₦{userSummary.totalBalance.toLocaleString('en-NG')}
            </p>
          </div>
        </section>

        {/* Segmented Tab Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl bg-purple-100/70 dark:bg-[#17092e] border border-purple-200/70 dark:border-[#31175c]">
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'payments'
                ? 'bg-white dark:bg-[#7c3aed] text-[#7c3aed] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#c4b5fd] hover:text-[#1e1b4b]'
            }`}
          >
            Payments ({totalSubmissionsCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'support'
                ? 'bg-white dark:bg-[#7c3aed] text-[#7c3aed] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#c4b5fd] hover:text-[#1e1b4b]'
            }`}
          >
            Support ({awaitingSupportCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'bank'
                ? 'bg-white dark:bg-[#7c3aed] text-[#7c3aed] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#c4b5fd] hover:text-[#1e1b4b]'
            }`}
          >
            Bank &amp; Prices
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('groups')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'groups'
                ? 'bg-white dark:bg-[#7c3aed] text-[#7c3aed] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#c4b5fd] hover:text-[#1e1b4b]'
            }`}
          >
            Group Links
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`col-span-2 sm:col-span-1 py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white dark:bg-[#7c3aed] text-[#7c3aed] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#c4b5fd] hover:text-[#1e1b4b]'
            }`}
          >
            User Amounts ({userSummary.totalUsers})
          </button>
        </div>

        {/* TAB 1: Ecoin & Account Upgrade Payment Approvals */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <section className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#7c3aed]" />
                  <span>Uploaded Upgrade Payment Proofs</span>
                </h2>
              </div>

              {upgradeSubmissions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-[#c4b5fd]">
                  No account upgrade payment receipts uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {upgradeSubmissions.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] p-3.5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-extrabold text-[#1e1b4b] dark:text-white">
                            {item.userName} ·{' '}
                            <span className="text-[#7c3aed] dark:text-[#c084fc]">
                              ₦{item.amount.toLocaleString('en-NG')}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-[#b794f4] mt-0.5">
                            Upgrade Tier: {item.tier} · Receipt: {item.receiptName}
                          </p>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                            item.status === 'approved'
                              ? 'bg-purple-100 dark:bg-purple-900/50 text-[#7c3aed] dark:text-[#c084fc]'
                              : item.status === 'declined'
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {item.status === 'pending' && <Clock className="w-3 h-3" />}
                          {item.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'declined' && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>

                      {item.receiptPreviewUrl && (
                        <div className="rounded-lg overflow-hidden border border-purple-200/70 dark:border-[#2d1554] bg-white dark:bg-[#0f051d] max-h-48 flex items-center justify-center">
                          <img
                            src={item.receiptPreviewUrl}
                            alt={`Upgrade receipt ${item.receiptName}`}
                            referrerPolicy="no-referrer"
                            className="max-h-48 w-auto object-contain"
                          />
                        </div>
                      )}

                      {item.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleApproveUpgrade(item)}
                            className="py-2 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleDeclineUpgrade(item.id)}
                            className="py-2 rounded-full border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-60 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#7c3aed]" />
                  <span>Uploaded Ecoin Payment Proofs</span>
                </h2>
              </div>

              {submissions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 dark:text-[#c4b5fd]">
                  No Ecoin payment receipts have been uploaded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] p-3.5 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-extrabold text-[#1e1b4b] dark:text-white">
                            {item.userName} ·{' '}
                            <span className="text-[#7c3aed] dark:text-[#c084fc]">
                              ₦{item.amount.toLocaleString('en-NG')}
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-[#b794f4] mt-0.5">
                            Plan: {item.plan === 'standard' ? 'Standard Ecoin' : 'VIP Unlimited'} · Receipt: {item.receiptName}
                          </p>
                        </div>

                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                            item.status === 'approved'
                              ? 'bg-purple-100 dark:bg-purple-900/50 text-[#7c3aed] dark:text-[#c084fc]'
                              : item.status === 'declined'
                              ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {item.status === 'pending' && <Clock className="w-3 h-3" />}
                          {item.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {item.status === 'declined' && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>

                      {item.receiptPreviewUrl && (
                        <div className="rounded-lg overflow-hidden border border-purple-200/70 dark:border-[#2d1554] bg-white dark:bg-[#0f051d] max-h-48 flex items-center justify-center">
                          <img
                            src={item.receiptPreviewUrl}
                            alt={`Payment receipt ${item.receiptName}`}
                            referrerPolicy="no-referrer"
                            className="max-h-48 w-auto object-contain"
                          />
                        </div>
                      )}

                      {item.ecoinCode && (
                        <p className="text-[11px] font-mono-num font-bold text-[#7c3aed] dark:text-[#c084fc]">
                          Issued Code: {item.ecoinCode}
                        </p>
                      )}

                      {item.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleApprove(item)}
                            className="py-2 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleDecline(item.id)}
                            className="py-2 rounded-full border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-60 font-bold text-xs cursor-pointer inline-flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: Support Chat Inbox & Replies */}
        {activeTab === 'support' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 space-y-3.5">
            {!selectedThread ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-[#7c3aed]" />
                    <span>Support Messages</span>
                  </h2>
                  <span className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                    {awaitingSupportCount} awaiting reply
                  </span>
                </div>

                {supportThreads.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-500 dark:text-[#c4b5fd]">
                    No user support messages yet.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {supportThreads.map((thread) => {
                      const lastMsg = thread.messages[thread.messages.length - 1];
                      return (
                        <button
                          key={thread.userId}
                          type="button"
                          onClick={() => {
                            setSelectedThreadUserId(thread.userId);
                            setReplyText('');
                          }}
                          className="w-full text-left p-3.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] hover:border-[#7c3aed] transition-colors flex items-center justify-between gap-3 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#1e1b4b] dark:text-white truncate">
                              {thread.userName}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-[#c4b5fd] truncate mt-0.5">
                              {lastMsg
                                ? `${lastMsg.sender === 'admin' ? 'You: ' : ''}${lastMsg.text}`
                                : 'No messages yet'}
                            </p>
                          </div>
                          <span
                            className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                              thread.awaitingAdminReply
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-purple-100 dark:bg-purple-900/50 text-[#7c3aed] dark:text-[#c084fc]'
                            }`}
                          >
                            {thread.awaitingAdminReply ? 'Awaiting Reply' : 'Replied'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-purple-100 dark:border-[#2a134f]">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedThreadUserId(null);
                        setReplyText('');
                      }}
                      className="w-8 h-8 rounded-full bg-[#f3e8ff] dark:bg-[#261147] text-[#7c3aed] dark:text-[#c084fc] flex items-center justify-center hover:bg-[#e9d5ff] cursor-pointer shrink-0"
                      aria-label="Back to support inbox"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#1e1b4b] dark:text-white truncate">
                        {selectedThread.userName}
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-[#b794f4]">
                        {selectedThread.awaitingAdminReply
                          ? 'Waiting for your reply'
                          : 'Replied — user can send next message'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                      selectedThread.awaitingAdminReply
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-purple-100 dark:bg-purple-900/50 text-[#7c3aed] dark:text-[#c084fc]'
                    }`}
                  >
                    {selectedThread.awaitingAdminReply ? 'Awaiting Reply' : 'Replied'}
                  </span>
                </div>

                {/* Chat Messages */}
                <div className="h-72 overflow-y-auto space-y-2.5 pr-1">
                  {selectedThread.messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    const timeLabel = new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isAdmin ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${
                            isAdmin
                              ? 'bg-[#7c3aed] text-white rounded-br-sm'
                              : 'bg-[#f3e8ff] dark:bg-[#220e42] text-[#1e1b4b] dark:text-white rounded-bl-sm'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-[#b794f4] mt-1 px-1">
                          {isAdmin ? 'EverMore Support' : selectedThread.userName} · {timeLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Admin Reply Form */}
                <form
                  onSubmit={handleSendSupportReply}
                  className="pt-2 border-t border-purple-100 dark:border-[#2a134f] flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedThread.userName}...`}
                    required
                    className="flex-1 px-3.5 py-2.5 rounded-full bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs focus:outline-none focus:border-[#7c3aed]"
                  />
                  <button
                    type="submit"
                    disabled={
                      busyId === `reply-${selectedThread.userId}` || !replyText.trim()
                    }
                    className="px-4 py-2.5 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            )}
          </section>
        )}

        {/* TAB 3: Set Company Bank Account Details & Ecoin Prices */}
        {activeTab === 'bank' && (
          <div className="space-y-4">
            <section className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#7c3aed]" />
                <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                  Ecoin Code Pricing
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#c4b5fd]">
                Set the prices shown to users when purchasing Standard Ecoin or VIP
                Unlimited codes.
              </p>

              <form onSubmit={handleSaveEcoinPrices} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                      Standard Ecoin Price (₦)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={ecoinPriceInputs.standardPrice}
                      onChange={(e) =>
                        setEcoinPriceInputs((prev) => ({
                          ...prev,
                          standardPrice: e.target.value,
                        }))
                      }
                      placeholder="5500"
                      required
                      className="font-mono-num w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                      VIP Unlimited Price (₦)
                    </label>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={ecoinPriceInputs.proPrice}
                      onChange={(e) =>
                        setEcoinPriceInputs((prev) => ({
                          ...prev,
                          proPrice: e.target.value,
                        }))
                      }
                      placeholder="10000"
                      required
                      className="font-mono-num w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busyId === 'save-prices'}
                  className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
                >
                  {busyId === 'save-prices' ? 'Saving...' : 'Save Ecoin Prices'}
                </button>
              </form>
            </section>

            <section className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#7c3aed]" />
                <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                  Company Receiving Account Details
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#c4b5fd]">
                Whatever account details you save here will immediately sync across
                Firebase to all users on the Ecoin and Upgrade payment pages.
              </p>

              <form onSubmit={handleSaveBank} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.bankName}
                    onChange={(e) =>
                      setBankDetails((prev) => ({ ...prev, bankName: e.target.value }))
                    }
                    placeholder="e.g. Moniepoint MFB"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={bankDetails.accountNumber}
                    onChange={(e) =>
                      setBankDetails((prev) => ({
                        ...prev,
                        accountNumber: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    placeholder="10-digit account number"
                    required
                    className="font-mono-num w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1">
                    Account Name
                  </label>
                  <input
                    type="text"
                    value={bankDetails.accountName}
                    onChange={(e) =>
                      setBankDetails((prev) => ({
                        ...prev,
                        accountName: e.target.value,
                      }))
                    }
                    placeholder="e.g. EverMore Technologies Ltd"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busyId === 'save-bank'}
                  className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
                >
                  {busyId === 'save-bank' ? 'Saving...' : 'Save Company Account Details'}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* TAB 3: Set Telegram & WhatsApp Group Channel Links */}
        {activeTab === 'groups' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#7c3aed]" />
              <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white">
                Telegram &amp; WhatsApp Channel Links
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#c4b5fd]">
              Set the official Telegram and WhatsApp channel links shown to users on the
              Groups page. Changes sync across Firebase immediately.
            </p>

            <form onSubmit={handleSaveCommunityLinks} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span>Telegram Channel Link</span>
                </label>
                <input
                  type="text"
                  value={communityLinks.telegramUrl}
                  onChange={(e) =>
                    setCommunityLinks((prev) => ({
                      ...prev,
                      telegramUrl: e.target.value,
                    }))
                  }
                  placeholder="https://t.me/yourchannel"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-purple-100 mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#7c3aed]" />
                  <span>WhatsApp Channel Link</span>
                </label>
                <input
                  type="text"
                  value={communityLinks.whatsappUrl}
                  onChange={(e) =>
                    setCommunityLinks((prev) => ({
                      ...prev,
                      whatsappUrl: e.target.value,
                    }))
                  }
                  placeholder="https://whatsapp.com/channel/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <button
                type="submit"
                disabled={busyId === 'save-links'}
                className="w-full py-3 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-60 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] cursor-pointer"
              >
                {busyId === 'save-links' ? 'Saving...' : 'Save Channel Links'}
              </button>
            </form>
          </section>
        )}

        {/* TAB 4: Registered User Amounts (Amounts Only, Not Personal Data) */}
        {activeTab === 'users' && (
          <section className="rounded-2xl bg-white dark:bg-[#17092e] border border-purple-100 dark:border-[#31175c] p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-[#1e1b4b] dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#7c3aed]" />
                <span>Registered User Amounts</span>
              </h2>
              <span className="text-xs font-bold text-[#7c3aed] dark:text-[#c084fc]">
                Total: {userSummary.totalUsers}
              </span>
            </div>

            {userSummary.users.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 dark:text-[#c4b5fd]">
                No registered users yet.
              </div>
            ) : (
              <div className="divide-y divide-purple-100 dark:divide-[#2a134f] text-xs">
                {userSummary.users.map((u, idx) => (
                  <div
                    key={u.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <span className="font-semibold text-[#1e1b4b] dark:text-white">
                      #{idx + 1} · {u.name}
                    </span>
                    <span className="font-mono-num font-extrabold text-[#7c3aed] dark:text-[#c084fc]">
                      ₦{u.balance.toLocaleString('en-NG')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};
