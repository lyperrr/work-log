import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const FONT_SIZES = [
  { id: 'normal', label: 'Normal', scaleText: 'A' },
  { id: 'besar', label: 'Besar', scaleText: 'A+' },
  { id: 'sangat-besar', label: 'Sangat Besar', scaleText: 'A++' },
  { id: 'ekstra-besar', label: 'Ekstra Besar', scaleText: 'MAX' },
];

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSizeState] = useState(() => {
    return localStorage.getItem('app_font_size') || 'normal';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('app_font_size', fontSize);
  }, [fontSize]);

  const setFontSize = (sizeId) => {
    if (FONT_SIZES.some((f) => f.id === sizeId)) {
      setFontSizeState(sizeId);
    }
  };

  return (
    <AccessibilityContext.Provider value={{ fontSize, setFontSize, FONT_SIZES }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
