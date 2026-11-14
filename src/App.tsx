/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage, UserAccount } from './components/AuthPage';
import { DashboardPage } from './components/DashboardPage';

type ViewState = 'landing' | 'register' | 'login' | 'dashboard';

const ACTIVE_USER_KEY = 'evermore_active_user_v1';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<ViewState>('landing');
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const handleAuthSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    } catch {
      // ignore storage errors
    }
    setDarkMode(false);
    setView('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(ACTIVE_USER_KEY);
    } catch {
      // ignore storage errors
    }
    setDarkMode(false);
    setView('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (view === 'register' || view === 'login') {
    return (
      <AuthPage
        initialMode={view}
        darkMode={darkMode}
        onBack={() => setView('landing')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (view === 'dashboard' && currentUser) {
    return (
      <DashboardPage
        user={currentUser}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        onLogout={handleLogout}
      />
    );
  }

  return (
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
  );
}
