import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './components/layout/MainLayout';

import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { KunjunganFormPage } from './pages/KunjunganFormPage';
import { PaketPage } from './pages/PaketPage';
import { RiwayatPage } from './pages/RiwayatPage';
import { SettingsPage } from './pages/SettingsPage';


const TAB_PATHS = {
  dashboard: '/',
  catat: '/catat',
  paket: '/paket',
  riwayat: '/riwayat',
  settings: '/settings',
};

const getTabFromPath = (path, hash) => {
  const cleanPath = (path || '').toLowerCase().replace(/\/$/, '') || '/';
  const cleanHash = (hash || '').toLowerCase().replace(/^#/, '');

  if (cleanHash === 'catat' || cleanPath === '/catat') return 'catat';
  if (cleanHash === 'paket' || cleanPath === '/paket') return 'paket';
  if (cleanHash === 'riwayat' || cleanPath === '/riwayat') return 'riwayat';
  if (cleanHash === 'settings' || cleanHash === 'pengaturan' || cleanPath === '/settings' || cleanPath === '/pengaturan') return 'settings';
  return 'dashboard';
};

function AppContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTabState] = useState(() =>
    getTabFromPath(window.location.pathname, window.location.hash)
  );

  // Sync state & update browser URL history
  const setActiveTab = (tab, replace = false) => {
    setActiveTabState(tab);
    const targetPath = TAB_PATHS[tab] || '/';
    if (window.location.pathname !== targetPath) {
      if (replace) {
        window.history.replaceState({ tab }, '', targetPath);
      } else {
        window.history.pushState({ tab }, '', targetPath);
      }
    }
  };

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname, window.location.hash);
      setActiveTabState(tab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (!currentUser) {
    return <AuthPage />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'catat':
        return <KunjunganFormPage onSaved={() => setActiveTab('riwayat')} />;
      case 'paket':
        return <PaketPage />;
      case 'riwayat':
        return <RiwayatPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActiveView()}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <PrivacyProvider>
          <SettingsProvider>
            <ToastProvider>
              <AppContent />
            </ToastProvider>
          </SettingsProvider>
        </PrivacyProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
