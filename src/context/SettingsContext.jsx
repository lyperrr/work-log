import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

const defaultKopSurat = {
  namaKlinik: 'KLINIK TERAPI & FISIOTERAPI SEHAT',
  subKlinik: 'Layanan Kesehatan & Fisioterapi Profesional',
  alamatKlinik: 'Jl. Raya utama No. 123, Jakarta',
  kontakKlinik: 'Telp/WA: 0812-3456-7890 | Email: info@kliniksehat.com',
  kotaPenerbit: 'Jakarta',
  penanggungJawab: 'dr. Willy Permana',
};

export function SettingsProvider({ children }) {
  const [dataScope, setDataScopeState] = useState(() => {
    try {
      return localStorage.getItem('app_data_scope') || 'current_month';
    } catch {
      return 'current_month';
    }
  });

  const [kopSurat, setKopSuratState] = useState(() => {
    try {
      const saved = localStorage.getItem('app_kop_surat');
      return saved ? { ...defaultKopSurat, ...JSON.parse(saved) } : defaultKopSurat;
    } catch {
      return defaultKopSurat;
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

  const setKopSurat = (newKop) => {
    setKopSuratState((prev) => {
      const updated = typeof newKop === 'function' ? newKop(prev) : { ...prev, ...newKop };
      try {
        localStorage.setItem('app_kop_surat', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ dataScope, setDataScope, kopSurat, setKopSurat }}>
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
