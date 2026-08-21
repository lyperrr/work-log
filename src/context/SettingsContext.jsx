import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [dataScope, setDataScopeState] = useState(() => {
    try {
      return localStorage.getItem('app_data_scope') || 'current_month';
    } catch {
      return 'current_month';
    }
  });

  const setDataScope = (val) => {
    setDataScopeState(val);
    try {
      localStorage.setItem('app_data_scope', val);
    } catch {
      // ignore
    }
  };

  return (
    <SettingsContext.Provider value={{ dataScope, setDataScope }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}
