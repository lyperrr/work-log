import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './components/layout/MainLayout';

import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { KunjunganFormPage } from './pages/KunjunganFormPage';
import { PaketPage } from './pages/PaketPage';
import { RiwayatPage } from './pages/RiwayatPage';
import { SettingsPage } from './pages/SettingsPage';

function AppContent() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

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
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </PrivacyProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}
