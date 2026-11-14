/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, analyticsPromise } from './firebase';
import { ensureUserWallet } from './utils/evermoreStore';
import { LandingPage } from './components/LandingPage';
import { AuthPage, UserAccount } from './components/AuthPage';
import { DashboardPage } from './components/DashboardPage';
import { AdminDashboard } from './components/AdminDashboard';
import { OfflineIndicator } from './components/OfflineIndicator';

type ViewState = 'landing' | 'register' | 'login' | 'dashboard' | 'admin';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<ViewState>('landing');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void analyticsPromise;
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        try {
          const wallet = await ensureUserWallet(
            firebaseUser.uid,
            firebaseUser.displayName || firebaseUser.email.split('@')[0],
            firebaseUser.email
          );
          setCurrentUser({
            uid: wallet.uid,
            name: wallet.name,
            email: wallet.email,
            balance: wallet.balance,
            createdAt: wallet.createdAt,
          });
          setView((prev) => (prev === 'admin' ? 'admin' : 'dashboard'));
        } catch (err) {
          console.error('Failed to sync user wallet:', err);
        }
      } else {
        setCurrentUser(null);
        setView((prev) =>
          prev === 'dashboard' || prev === 'admin' ? 'landing' : prev
        );
      }
      setAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setDarkMode(false);
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore signOut errors
    }
    setCurrentUser(null);
    setDarkMode(false);
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[#faf7ff] dark:bg-[#0f051d] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-3 border-purple-200 border-t-[#7c3aed] animate-spin" />
      </div>
    );
  }

  if (view === 'admin') {
    return (
      <>
        <AdminDashboard
          darkMode={darkMode}
          onExit={() => {
            setView(currentUser ? 'dashboard' : 'landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  if (view === 'register' || view === 'login') {
    return (
      <>
        <AuthPage
          initialMode={view}
          darkMode={darkMode}
          onBack={() => setView('landing')}
          onSuccess={handleAuthSuccess}
        />
        <OfflineIndicator />
      </>
    );
  }

  if (view === 'dashboard' && currentUser) {
    return (
      <>
        <DashboardPage
          user={currentUser}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode((prev) => !prev)}
          onLogout={handleLogout}
          onOpenAdminDashboard={() => {
            setView('admin');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        <OfflineIndicator />
      </>
    );
  }

  return (
    <>
      <LandingPage
        onGetStarted={() => {
          setView('register');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onLogin={() => {
          setView('login');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
      />
      <OfflineIndicator />
    </>
  );
}
