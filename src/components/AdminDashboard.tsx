import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { GpayLogo } from './GpayLogo';
import {
  approveEcoinSubmission,
  approveUpgradeSubmission,
  CompanyBankDetails,
  declineEcoinSubmission,
  declineUpgradeSubmission,
  DEFAULT_COMPANY_BANK,
  EcoinSubmission,
  getCompanyBankDetails,
  getRegisteredUserAmounts,
  RegisteredUserAmount,
  saveCompanyBankDetails,
  subscribeCompanyBankDetails,
  subscribeEcoinSubmissions,
  subscribeRegisteredUserAmounts,
  subscribeUpgradeSubmissions,
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
  const [submissions, setSubmissions] = useState<EcoinSubmission[]>([]);
  const [upgradeSubmissions, setUpgradeSubmissions] = useState<UpgradeSubmission[]>([]);
  const [userSummary, setUserSummary] = useState<{
    totalUsers: number;
    totalBalance: number;
    users: RegisteredUserAmount[];
  }>({ totalUsers: 0, totalBalance: 0, users: [] });
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'payments' | 'bank' | 'users'>('payments');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubBank = subscribeCompanyBankDetails((details) => {
      setBankDetails(details);
    });
    const unsubEcoin = subscribeEcoinSubmissions((items) => {
      setSubmissions(items);
    });
    const unsubUpgrade = subscribeUpgradeSubmissions((items) => {
      setUpgradeSubmissions(items);
    });
    const unsubUsers = subscribeRegisteredUserAmounts((summary) => {
      setUserSummary(summary);
    });

    return () => {
      unsubBank();
      unsubEcoin();
      unsubUpgrade();
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
      const [bank, summary] = await Promise.all([
        getCompanyBankDetails(),
        getRegisteredUserAmounts(),
      ]);
      setBankDetails(bank);
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

  const pendingCount =
    submissions.filter((s) => s.status === 'pending').length +
    upgradeSubmissions.filter((u) => u.status === 'pending').length;
  const totalSubmissionsCount = submissions.length + upgradeSubmissions.length;

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
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-purple-100/70 dark:bg-[#17092e] border border-purple-200/70 dark:border-[#31175c]">
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
            onClick={() => setActiveTab('bank')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'bank'
                ? 'bg-white dark:bg-[#7c3aed] text-[#7c3aed] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-[#c4b5fd] hover:text-[#1e1b4b]'
            }`}
          >
            Company Bank
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
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

        {/* TAB 2: Set Company Bank Account Details */}
        {activeTab === 'bank' && (
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
        )}

        {/* TAB 3: Registered User Amounts (Amounts Only, Not Personal Data) */}
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
