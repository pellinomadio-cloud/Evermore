export interface CompanyBankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface EcoinSubmission {
  id: string;
  userName: string;
  userEmail: string;
  plan: 'standard' | 'pro';
  amount: number;
  receiptName: string;
  receiptPreviewUrl?: string;
  status: 'pending' | 'approved' | 'declined';
  ecoinCode?: string;
  createdAt: string;
}

export interface UpgradeSubmission {
  id: string;
  userName: string;
  userEmail: string;
  tier: 'Silver' | 'Gold VIP';
  amount: number;
  receiptName: string;
  receiptPreviewUrl?: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export interface RegisteredUserAmount {
  id: string;
  name: string;
  balance: number;
}

const COMPANY_BANK_KEY = 'evermore_company_bank_v1';
const ECOIN_SUBMISSIONS_KEY = 'evermore_ecoin_submissions_v1';
const UPGRADE_SUBMISSIONS_KEY = 'evermore_upgrade_submissions_v1';
const USERS_KEY = 'evermore_users_v1';

const DEFAULT_COMPANY_BANK: CompanyBankDetails = {
  bankName: 'Moniepoint MFB',
  accountNumber: '8104927361',
  accountName: 'EverMore Technologies Ltd',
};

export function getCompanyBankDetails(): CompanyBankDetails {
  try {
    const raw = localStorage.getItem(COMPANY_BANK_KEY);
    if (!raw) return DEFAULT_COMPANY_BANK;
    const parsed = JSON.parse(raw);
    return {
      bankName: parsed.bankName || DEFAULT_COMPANY_BANK.bankName,
      accountNumber: parsed.accountNumber || DEFAULT_COMPANY_BANK.accountNumber,
      accountName: parsed.accountName || DEFAULT_COMPANY_BANK.accountName,
    };
  } catch {
    return DEFAULT_COMPANY_BANK;
  }
}

export function saveCompanyBankDetails(details: CompanyBankDetails): void {
  try {
    localStorage.setItem(COMPANY_BANK_KEY, JSON.stringify(details));
  } catch {
    // ignore storage errors
  }
}

export function getEcoinSubmissions(): EcoinSubmission[] {
  try {
    const raw = localStorage.getItem(ECOIN_SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEcoinSubmissions(submissions: EcoinSubmission[]): void {
  try {
    localStorage.setItem(ECOIN_SUBMISSIONS_KEY, JSON.stringify(submissions));
  } catch {
    // ignore storage errors
  }
}

export function addEcoinSubmission(submission: EcoinSubmission): void {
  const existing = getEcoinSubmissions();
  saveEcoinSubmissions([submission, ...existing]);
}

export function approveEcoinSubmission(submissionId: string): string {
  const submissions = getEcoinSubmissions();
  const code = `EC-${Math.floor(100000 + Math.random() * 900000)}`;
  let targetEmail = '';

  const updated = submissions.map((item) => {
    if (item.id === submissionId) {
      targetEmail = item.userEmail.toLowerCase();
      return {
        ...item,
        status: 'approved' as const,
        ecoinCode: code,
      };
    }
    return item;
  });

  saveEcoinSubmissions(updated);

  // Also add the approved Ecoin code into the user's dashboard state
  if (targetEmail) {
    try {
      const userStateKey = `evermore_state_${targetEmail}`;
      const rawUserState = localStorage.getItem(userStateKey);
      const parsed = rawUserState ? JSON.parse(rawUserState) : {};
      const prevCodes: string[] = Array.isArray(parsed.purchasedCodes)
        ? parsed.purchasedCodes
        : [];
      if (!prevCodes.includes(code)) {
        localStorage.setItem(
          userStateKey,
          JSON.stringify({
            ...parsed,
            purchasedCodes: [code, ...prevCodes],
          })
        );
      }
    } catch {
      // ignore storage errors
    }
  }

  return code;
}

export function declineEcoinSubmission(submissionId: string): void {
  const submissions = getEcoinSubmissions();
  const updated = submissions.map((item) =>
    item.id === submissionId ? { ...item, status: 'declined' as const } : item
  );
  saveEcoinSubmissions(updated);
}

export function getUpgradeSubmissions(): UpgradeSubmission[] {
  try {
    const raw = localStorage.getItem(UPGRADE_SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUpgradeSubmissions(submissions: UpgradeSubmission[]): void {
  try {
    localStorage.setItem(UPGRADE_SUBMISSIONS_KEY, JSON.stringify(submissions));
  } catch {
    // ignore storage errors
  }
}

export function addUpgradeSubmission(submission: UpgradeSubmission): void {
  const existing = getUpgradeSubmissions();
  saveUpgradeSubmissions([submission, ...existing]);
}

export function approveUpgradeSubmission(submissionId: string): 'Silver' | 'Gold VIP' | null {
  const submissions = getUpgradeSubmissions();
  let targetEmail = '';
  let approvedTier: 'Silver' | 'Gold VIP' | null = null;

  const updated = submissions.map((item) => {
    if (item.id === submissionId) {
      targetEmail = item.userEmail.toLowerCase();
      approvedTier = item.tier;
      return {
        ...item,
        status: 'approved' as const,
      };
    }
    return item;
  });

  saveUpgradeSubmissions(updated);

  if (targetEmail && approvedTier) {
    try {
      const userStateKey = `evermore_state_${targetEmail}`;
      const rawUserState = localStorage.getItem(userStateKey);
      const parsed = rawUserState ? JSON.parse(rawUserState) : {};
      localStorage.setItem(
        userStateKey,
        JSON.stringify({
          ...parsed,
          accountTier: approvedTier,
        })
      );
    } catch {
      // ignore storage errors
    }
  }

  return approvedTier;
}

export function declineUpgradeSubmission(submissionId: string): void {
  const submissions = getUpgradeSubmissions();
  const updated = submissions.map((item) =>
    item.id === submissionId ? { ...item, status: 'declined' as const } : item
  );
  saveUpgradeSubmissions(updated);
}

export function getRegisteredUserAmounts(): {
  totalUsers: number;
  totalBalance: number;
  users: RegisteredUserAmount[];
} {
  try {
    const rawUsers = localStorage.getItem(USERS_KEY);
    const parsedUsers: Array<{ name?: string; email?: string; balance?: number }> =
      rawUsers ? JSON.parse(rawUsers) : [];

    const users: RegisteredUserAmount[] = parsedUsers.map((u, index) => {
      const email = (u.email || '').toLowerCase();
      let liveBalance = typeof u.balance === 'number' ? u.balance : 0;

      if (email) {
        try {
          const rawState = localStorage.getItem(`evermore_state_${email}`);
          if (rawState) {
            const stateParsed = JSON.parse(rawState);
            if (typeof stateParsed.balance === 'number') {
              liveBalance = stateParsed.balance;
            }
          }
        } catch {
          // ignore
        }
      }

      return {
        id: `user-${index + 1}`,
        name: u.name || `Member #${index + 1}`,
        balance: liveBalance,
      };
    });

    const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
    return {
      totalUsers: users.length,
      totalBalance,
      users,
    };
  } catch {
    return { totalUsers: 0, totalBalance: 0, users: [] };
  }
}
