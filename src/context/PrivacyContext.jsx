import { createContext, useContext, useState } from 'react';

const PrivacyContext = createContext();

export function PrivacyProvider({ children }) {
  const [hideIncome, setHideIncomeState] = useState(() => {
    try {
      return localStorage.getItem('app_hide_income') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHideIncome = () => {
    setHideIncomeState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('app_hide_income', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const setHideIncome = (value) => {
    const boolVal = Boolean(value);
    setHideIncomeState(boolVal);
    try {
      localStorage.setItem('app_hide_income', String(boolVal));
    } catch {
      // ignore
    }
  };

  const formatAmount = (amount, mask = 'Rp ••••••') => {
    if (hideIncome) {
      return mask;
    }
    if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
      return '-';
    }
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <PrivacyContext.Provider
      value={{
        hideIncome,
        toggleHideIncome,
        setHideIncome,
        formatAmount,
      }}
    >
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within PrivacyProvider');
  }
  return context;
}
