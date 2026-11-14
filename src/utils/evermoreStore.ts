import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Unsubscribe,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export interface TransactionEntry {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
}

export interface UserWalletData {
  uid: string;
  name: string;
  email: string;
  balance: number;
  invitesCount: number;
  checkInCount: number;
  earnedTotal: number;
  purchasedCodes: string[];
  unseenApprovedCodes: string[];
  lastClaimDate: string | null;
  transactions: TransactionEntry[];
  watchedVideoIds: string[];
  accountTier: 'Starter' | 'Silver' | 'Gold VIP';
  createdAt: string;
}

export interface CompanyBankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  updatedAt?: string;
}

export interface CommunityLinks {
  telegramUrl: string;
  whatsappUrl: string;
  updatedAt?: string;
}

export interface EcoinSubmission {
  id: string;
  userId: string;
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
  userId: string;
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

export const DEFAULT_COMPANY_BANK: CompanyBankDetails = {
  bankName: 'Moniepoint MFB',
  accountNumber: '8104927361',
  accountName: 'EverMore Technologies Ltd',
};

export const DEFAULT_COMMUNITY_LINKS: CommunityLinks = {
  telegramUrl: '',
  whatsappUrl: '',
};

export function deriveFirebaseAuthPassword(pin: string): string {
  return `EM#${pin.trim()}`;
}

export async function compressReceiptFile(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) return undefined;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        resolve(undefined);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxWidth = 720;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.65);
        resolve(compressed.length < 600_000 ? compressed : undefined);
      };
      img.onerror = () => resolve(undefined);
      img.src = reader.result;
    };
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

// ==================== USER WALLET & PROFILE ====================

export async function ensureUserWallet(
  uid: string,
  name: string,
  email: string
): Promise<UserWalletData> {
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        name: typeof data.name === 'string' ? data.name : name,
        email: typeof data.email === 'string' ? data.email : email,
        balance: typeof data.balance === 'number' ? data.balance : 0,
        invitesCount: typeof data.invitesCount === 'number' ? data.invitesCount : 0,
        checkInCount: typeof data.checkInCount === 'number' ? data.checkInCount : 0,
        earnedTotal: typeof data.earnedTotal === 'number' ? data.earnedTotal : 0,
        purchasedCodes: Array.isArray(data.purchasedCodes) ? data.purchasedCodes : [],
        unseenApprovedCodes: Array.isArray(data.unseenApprovedCodes)
          ? data.unseenApprovedCodes
          : [],
        lastClaimDate: typeof data.lastClaimDate === 'string' ? data.lastClaimDate : null,
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        watchedVideoIds: Array.isArray(data.watchedVideoIds) ? data.watchedVideoIds : [],
        accountTier:
          data.accountTier === 'Silver' || data.accountTier === 'Gold VIP'
            ? data.accountTier
            : 'Starter',
        createdAt:
          typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
      };
    }

    const initialWallet: UserWalletData = {
      uid,
      name: name.trim() || email.split('@')[0] || 'User',
      email: email.trim().toLowerCase(),
      balance: 0,
      invitesCount: 0,
      checkInCount: 0,
      earnedTotal: 0,
      purchasedCodes: [],
      unseenApprovedCodes: [],
      lastClaimDate: null,
      transactions: [],
      watchedVideoIds: [],
      accountTier: 'Starter',
      createdAt: new Date().toISOString(),
    };

    await setDoc(userRef, initialWallet);
    return initialWallet;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeUserWallet(
  uid: string,
  onData: (wallet: UserWalletData) => void
): Unsubscribe {
  const userPath = `users/${uid}`;
  return onSnapshot(
    doc(db, 'users', uid),
    (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      onData({
        uid,
        name: typeof data.name === 'string' ? data.name : 'User',
        email: typeof data.email === 'string' ? data.email : '',
        balance: typeof data.balance === 'number' ? data.balance : 0,
        invitesCount: typeof data.invitesCount === 'number' ? data.invitesCount : 0,
        checkInCount: typeof data.checkInCount === 'number' ? data.checkInCount : 0,
        earnedTotal: typeof data.earnedTotal === 'number' ? data.earnedTotal : 0,
        purchasedCodes: Array.isArray(data.purchasedCodes) ? data.purchasedCodes : [],
        unseenApprovedCodes: Array.isArray(data.unseenApprovedCodes)
          ? data.unseenApprovedCodes
          : [],
        lastClaimDate: typeof data.lastClaimDate === 'string' ? data.lastClaimDate : null,
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        watchedVideoIds: Array.isArray(data.watchedVideoIds) ? data.watchedVideoIds : [],
        accountTier:
          data.accountTier === 'Silver' || data.accountTier === 'Gold VIP'
            ? data.accountTier
            : 'Starter',
        createdAt:
          typeof data.createdAt === 'string' ? data.createdAt : new Date().toISOString(),
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, userPath);
    }
  );
}

export async function updateUserWallet(
  uid: string,
  updates: Partial<Omit<UserWalletData, 'uid' | 'createdAt'>>
): Promise<void> {
  const userPath = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

// ==================== COMPANY BANK DETAILS ====================

export async function getCompanyBankDetails(): Promise<CompanyBankDetails> {
  const path = 'appConfig/companyBank';
  try {
    const snap = await getDoc(doc(db, 'appConfig', 'companyBank'));
    if (!snap.exists()) return DEFAULT_COMPANY_BANK;
    const data = snap.data();
    return {
      bankName: data.bankName || DEFAULT_COMPANY_BANK.bankName,
      accountNumber: data.accountNumber || DEFAULT_COMPANY_BANK.accountNumber,
      accountName: data.accountName || DEFAULT_COMPANY_BANK.accountName,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.warn('Using default company bank details:', error);
    return DEFAULT_COMPANY_BANK;
  }
}

export function subscribeCompanyBankDetails(
  onData: (details: CompanyBankDetails) => void
): Unsubscribe {
  const path = 'appConfig/companyBank';
  return onSnapshot(
    doc(db, 'appConfig', 'companyBank'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_COMPANY_BANK);
        return;
      }
      const data = snap.data();
      onData({
        bankName: data.bankName || DEFAULT_COMPANY_BANK.bankName,
        accountNumber: data.accountNumber || DEFAULT_COMPANY_BANK.accountNumber,
        accountName: data.accountName || DEFAULT_COMPANY_BANK.accountName,
        updatedAt: data.updatedAt,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveCompanyBankDetails(
  details: CompanyBankDetails
): Promise<void> {
  const path = 'appConfig/companyBank';
  try {
    await setDoc(doc(db, 'appConfig', 'companyBank'), {
      bankName: details.bankName.trim(),
      accountNumber: details.accountNumber.trim(),
      accountName: details.accountName.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== COMMUNITY CHANNEL LINKS ====================

export async function getCommunityLinks(): Promise<CommunityLinks> {
  try {
    const snap = await getDoc(doc(db, 'appConfig', 'communityLinks'));
    if (!snap.exists()) return DEFAULT_COMMUNITY_LINKS;
    const data = snap.data();
    return {
      telegramUrl: typeof data.telegramUrl === 'string' ? data.telegramUrl : '',
      whatsappUrl: typeof data.whatsappUrl === 'string' ? data.whatsappUrl : '',
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    };
  } catch (error) {
    console.warn('Using default community links:', error);
    return DEFAULT_COMMUNITY_LINKS;
  }
}

export function subscribeCommunityLinks(
  onData: (links: CommunityLinks) => void
): Unsubscribe {
  const path = 'appConfig/communityLinks';
  return onSnapshot(
    doc(db, 'appConfig', 'communityLinks'),
    (snap) => {
      if (!snap.exists()) {
        onData(DEFAULT_COMMUNITY_LINKS);
        return;
      }
      const data = snap.data();
      onData({
        telegramUrl: typeof data.telegramUrl === 'string' ? data.telegramUrl : '',
        whatsappUrl: typeof data.whatsappUrl === 'string' ? data.whatsappUrl : '',
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveCommunityLinks(links: CommunityLinks): Promise<void> {
  const path = 'appConfig/communityLinks';
  try {
    await setDoc(doc(db, 'appConfig', 'communityLinks'), {
      telegramUrl: links.telegramUrl.trim(),
      whatsappUrl: links.whatsappUrl.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ==================== ECOIN SUBMISSIONS ====================

export async function addEcoinSubmission(submission: EcoinSubmission): Promise<void> {
  const path = `ecoinSubmissions/${submission.id}`;
  const payload: Record<string, unknown> = {
    id: submission.id,
    userId: submission.userId,
    userName: submission.userName,
    userEmail: submission.userEmail,
    plan: submission.plan,
    amount: submission.amount,
    receiptName: submission.receiptName,
    status: submission.status,
    createdAt: submission.createdAt,
  };
  if (submission.receiptPreviewUrl) {
    payload.receiptPreviewUrl = submission.receiptPreviewUrl;
  }

  try {
    await setDoc(doc(db, 'ecoinSubmissions', submission.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getEcoinSubmissionById(
  submissionId: string
): Promise<EcoinSubmission | null> {
  const path = `ecoinSubmissions/${submissionId}`;
  try {
    const snap = await getDoc(doc(db, 'ecoinSubmissions', submissionId));
    return snap.exists() ? (snap.data() as EcoinSubmission) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeEcoinSubmissions(
  onData: (items: EcoinSubmission[]) => void
): Unsubscribe {
  const path = 'ecoinSubmissions';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as EcoinSubmission));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function approveEcoinSubmission(
  submission: EcoinSubmission
): Promise<string> {
  const path = `ecoinSubmissions/${submission.id}`;
  const code = `EC-${Math.floor(100000 + Math.random() * 900000)}`;
  try {
    await updateDoc(doc(db, 'ecoinSubmissions', submission.id), {
      status: 'approved',
      ecoinCode: code,
    });
    if (submission.userId) {
      await updateDoc(doc(db, 'users', submission.userId), {
        purchasedCodes: arrayUnion(code),
        unseenApprovedCodes: arrayUnion(code),
      });
    }
    return code;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function declineEcoinSubmission(submissionId: string): Promise<void> {
  const path = `ecoinSubmissions/${submissionId}`;
  try {
    await updateDoc(doc(db, 'ecoinSubmissions', submissionId), {
      status: 'declined',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==================== ACCOUNT UPGRADE SUBMISSIONS ====================

export async function addUpgradeSubmission(
  submission: UpgradeSubmission
): Promise<void> {
  const path = `upgradeSubmissions/${submission.id}`;
  const payload: Record<string, unknown> = {
    id: submission.id,
    userId: submission.userId,
    userName: submission.userName,
    userEmail: submission.userEmail,
    tier: submission.tier,
    amount: submission.amount,
    receiptName: submission.receiptName,
    status: submission.status,
    createdAt: submission.createdAt,
  };
  if (submission.receiptPreviewUrl) {
    payload.receiptPreviewUrl = submission.receiptPreviewUrl;
  }

  try {
    await setDoc(doc(db, 'upgradeSubmissions', submission.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function getUpgradeSubmissionById(
  submissionId: string
): Promise<UpgradeSubmission | null> {
  const path = `upgradeSubmissions/${submissionId}`;
  try {
    const snap = await getDoc(doc(db, 'upgradeSubmissions', submissionId));
    return snap.exists() ? (snap.data() as UpgradeSubmission) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeUpgradeSubmissions(
  onData: (items: UpgradeSubmission[]) => void
): Unsubscribe {
  const path = 'upgradeSubmissions';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(snapshot.docs.map((d) => d.data() as UpgradeSubmission));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function approveUpgradeSubmission(
  submission: UpgradeSubmission
): Promise<'Silver' | 'Gold VIP'> {
  const path = `upgradeSubmissions/${submission.id}`;
  try {
    await updateDoc(doc(db, 'upgradeSubmissions', submission.id), {
      status: 'approved',
    });
    if (submission.userId) {
      await updateDoc(doc(db, 'users', submission.userId), {
        accountTier: submission.tier,
      });
    }
    return submission.tier;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function declineUpgradeSubmission(submissionId: string): Promise<void> {
  const path = `upgradeSubmissions/${submissionId}`;
  try {
    await updateDoc(doc(db, 'upgradeSubmissions', submissionId), {
      status: 'declined',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

// ==================== REGISTERED USER AMOUNTS (AMOUNTS ONLY, NO PII) ====================

export async function getRegisteredUserAmounts(): Promise<{
  totalUsers: number;
  totalBalance: number;
  users: RegisteredUserAmount[];
}> {
  const path = 'users';
  try {
    const snap = await getDocs(collection(db, path));
    const users: RegisteredUserAmount[] = snap.docs.map((d, index) => {
      const data = d.data();
      return {
        id: d.id,
        name: typeof data.name === 'string' ? data.name : `Member #${index + 1}`,
        balance: typeof data.balance === 'number' ? data.balance : 0,
      };
    });
    const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
    return {
      totalUsers: users.length,
      totalBalance,
      users,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeRegisteredUserAmounts(
  onData: (summary: {
    totalUsers: number;
    totalBalance: number;
    users: RegisteredUserAmount[];
  }) => void
): Unsubscribe {
  const path = 'users';
  return onSnapshot(
    collection(db, path),
    (snapshot) => {
      const users: RegisteredUserAmount[] = snapshot.docs.map((d, index) => {
        const data = d.data();
        return {
          id: d.id,
          name: typeof data.name === 'string' ? data.name : `Member #${index + 1}`,
          balance: typeof data.balance === 'number' ? data.balance : 0,
        };
      });
      const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
      onData({
        totalUsers: users.length,
        totalBalance,
        users,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
