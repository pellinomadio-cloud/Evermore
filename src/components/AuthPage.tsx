import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase';
import { deriveFirebaseAuthPassword, ensureUserWallet } from '../utils/evermoreStore';
import { GpayLogo } from './GpayLogo';

export interface UserAccount {
  uid: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
}

interface AuthPageProps {
  initialMode: 'register' | 'login';
  darkMode: boolean;
  onBack: () => void;
  onSuccess: (user: UserAccount) => void;
}

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please login instead.';
  }
  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found'
  ) {
    return 'Invalid email or 4-digit password. Please check and try again.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password sign-in is not enabled yet in your Firebase Console (Authentication → Sign-in method).';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection.';
  }
  if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
    return 'Firestore permissions are not configured yet. Please publish firestore.rules in your Firebase Console.';
  }
  return err instanceof Error ? err.message : 'Authentication failed. Please try again.';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode,
  darkMode,
  onBack,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(digitsOnly);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (mode === 'register') {
      if (!trimmedName) {
        setError('Please enter your full name.');
        return;
      }
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError('Please enter a valid email address.');
        return;
      }
      if (pin.length !== 4) {
        setError('Please enter a 4-digit password.');
        return;
      }

      setIsSubmitting(true);
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          trimmedEmail,
          deriveFirebaseAuthPassword(pin)
        );
        await updateProfile(cred.user, { displayName: trimmedName });
        const wallet = await ensureUserWallet(cred.user.uid, trimmedName, trimmedEmail);
        onSuccess({
          uid: wallet.uid,
          name: wallet.name,
          email: wallet.email,
          balance: wallet.balance,
          createdAt: wallet.createdAt,
        });
      } catch (err) {
        setError(mapFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        setError('Please enter your email address.');
        return;
      }
      if (pin.length !== 4) {
        setError('Please enter your 4-digit password.');
        return;
      }

      setIsSubmitting(true);
      try {
        const cred = await signInWithEmailAndPassword(
          auth,
          trimmedEmail,
          deriveFirebaseAuthPassword(pin)
        );
        const wallet = await ensureUserWallet(
          cred.user.uid,
          cred.user.displayName || trimmedEmail.split('@')[0],
          trimmedEmail
        );
        onSuccess({
          uid: wallet.uid,
          name: wallet.name,
          email: wallet.email,
          balance: wallet.balance,
          createdAt: wallet.createdAt,
        });
      } catch (err) {
        setError(mapFirebaseAuthError(err));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7ff] dark:bg-[#0f051d] text-[#1e1b4b] dark:text-white px-4 py-6 transition-colors duration-200">
      {/* Top Back Bar */}
      <div className="max-w-sm w-full mx-auto flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-[#c4b5fd] hover:text-[#7c3aed] dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>
      </div>

      {/* Compact Classic Registration / Login Card */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-sm w-full bg-white dark:bg-[#17092e] border border-purple-200/80 dark:border-[#31175c] rounded-2xl p-5 sm:p-6 shadow-lg">
          <div className="flex flex-col items-center text-center mb-5">
            <GpayLogo size="sm" lightText={darkMode} />
            <h1 className="text-lg sm:text-xl font-bold text-[#1e1b4b] dark:text-white mt-3">
              {mode === 'register' ? 'Create an Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#c4b5fd] mt-0.5">
              {mode === 'register'
                ? 'Enter your name, email, and a 4-digit password.'
                : 'Sign in with your email and 4-digit password.'}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="evermore-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-purple-100/90 mb-1"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a855f7] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="evermore-name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-[#1e1b4b] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#7e64a3] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="evermore-email"
                className="block text-xs font-semibold text-slate-700 dark:text-purple-100/90 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a855f7] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="evermore-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-[#1e1b4b] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#7e64a3] text-xs sm:text-sm focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="evermore-pin"
                  className="block text-xs font-semibold text-slate-700 dark:text-purple-100/90"
                >
                  4-Digit Password
                </label>
                <span className="font-mono-num text-[11px] text-[#7c3aed] dark:text-[#c084fc]">
                  {pin.length}/4 digits
                </span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#7c3aed] dark:text-[#a855f7] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="evermore-pin"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  required
                  className="font-mono-num w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#faf7ff] dark:bg-[#110622] border border-purple-200 dark:border-[#331860] text-[#1e1b4b] dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#7e64a3] text-sm tracking-[0.3em] focus:outline-none focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((prev) => !prev)}
                  aria-label={showPin ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7c3aed] dark:text-[#a78bfa] dark:hover:text-white p-1 cursor-pointer"
                >
                  {showPin ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-5 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] active:scale-[0.99] disabled:opacity-70 text-white font-bold text-xs sm:text-sm shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all cursor-pointer mt-1 inline-flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {isSubmitting
                  ? mode === 'register'
                    ? 'Creating Account...'
                    : 'Logging In...'
                  : mode === 'register'
                  ? 'Create Account'
                  : 'Login'}
              </span>
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-purple-100 dark:border-[#2a134f] text-center text-xs text-slate-600 dark:text-[#c4b5fd]">
            {mode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-bold text-[#7c3aed] dark:text-[#c084fc] hover:underline cursor-pointer"
                >
                  Login
                </button>
              </p>
            ) : (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                  }}
                  className="font-bold text-[#7c3aed] dark:text-[#c084fc] hover:underline cursor-pointer"
                >
                  Get Started
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
