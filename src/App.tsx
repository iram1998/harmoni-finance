/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider } from './store';
import { ThemeLanguageProvider } from './context/ThemeLanguageContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/views/Dashboard';
import { CashFlow } from './components/views/CashFlow';
import { Budgeting } from './components/views/Budgeting';
import { Goals } from './components/views/Goals';
import { Bills } from './components/views/Bills';
import { Reports } from './components/views/Reports';
import { ActivityLogView } from './components/views/ActivityLogView';
import { Help } from './components/views/Help';
import { Settings } from './components/views/Settings';
import { Profile } from './components/views/Profile';
import { Assets } from './components/views/Assets';
import { PrivacyPolicy } from './components/views/PrivacyPolicy';
import { TermsOfService } from './components/views/TermsOfService';
import { SecurityLockScreen } from './components/SecurityLockScreen';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <SecurityLockScreen>
      <Layout currentView={currentView} setCurrentView={setCurrentView}>
        {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} />}
        {currentView === 'cash-flow' && <CashFlow />}
        {currentView === 'budgeting' && <Budgeting />}
        {currentView === 'assets' && <Assets />}
        {currentView === 'bills' && <Bills />}
        {currentView === 'goals' && <Goals />}
        {currentView === 'reports' && <Reports />}
        {currentView === 'activity-logs' && <ActivityLogView />}
        {currentView === 'help' && <Help onNavigate={setCurrentView} />}
        {currentView === 'settings' && <Settings />}
        {currentView === 'profile' && <Profile />}
        {currentView === 'privacy-policy' && <PrivacyPolicy onBack={() => setCurrentView('dashboard')} />}
        {currentView === 'terms-of-service' && <TermsOfService onBack={() => setCurrentView('dashboard')} />}
      </Layout>
    </SecurityLockScreen>
  );
}

export default function App() {
  return (
    <ThemeLanguageProvider>
      <ToastProvider>
        <FinanceProvider>
          <AppContent />
        </FinanceProvider>
      </ToastProvider>
    </ThemeLanguageProvider>
  );
}

