import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui/spinner';
import { User, Phone, CheckCircle2, UserPlus, Search } from 'lucide-react';

export function PatientAutocomplete({
  value,
  onChange,
  onSelectPatient,
  phoneValue,
  onPhoneChange,
}) {
  const { api } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  const latestSearchRef = useRef('');

  // Debounced search (450ms): panggil API jika value >= 2 karakter
  useEffect(() => {
    const query = value.trim();
    latestSearchRef.current = query;

    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsNewPatient(false);
      setLoadingSearch(false);
      return;
    }

    setLoadingSearch(true);

    const timer = setTimeout(async () => {
      if (latestSearchRef.current !== query) return;

      try {
        const matches = await api.searchPasien(query);
        if (latestSearchRef.current !== query) return;

        const results = matches || [];
        setSuggestions(results);
        setIsOpen(true);
        const exactMatch = results.some(
          (p) => p.nama_pasien.toLowerCase().trim() === query.toLowerCase()
        );
        setIsNewPatient(!exactMatch);
      } catch {
        if (latestSearchRef.current === query) {
          setSuggestions([]);
        }
      } finally {
        if (latestSearchRef.current === query) {
          setLoadingSearch(false);
        }
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [value, api]);

  const handleInputChange = (e) => {
    const newVal = e.target.value;
    onChange(newVal);

    if (newVal.trim().length >= 2) {
      // Hapus data lama seketika agar tidak muncul saat pengguna mengetik huruf baru
      setSuggestions([]);
      setLoadingSearch(true);
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsNewPatient(false);
      setLoadingSearch(false);
    }
  };

  const handleInputFocusOrClick = () => {
    if (value.trim().length >= 2) {
      setIsOpen(true);
    }
  };

  const handleSelect = (patient) => {
    onChange(patient.nama_pasien);
    // Normalize to string — Sheets may return phone as a Number type
    onPhoneChange(String(patient.no_telp || ''));
    onSelectPatient(patient);
    setIsOpen(false);
    setIsNewPatient(false);
  };

  return (
    <div className="space-y-4 relative" ref={containerRef}>
      <div className="relative">
        <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
          <User className="size-5 text-primary shrink-0" />
          Nama Pasien <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={handleInputFocusOrClick}
            onClick={handleInputFocusOrClick}
            placeholder="Ketik nama pasien (cth: Budi)"
            className="w-full h-13 px-4 text-base md:text-lg border-2 border-input rounded-xl bg-background text-foreground font-bold focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground shadow-xs touch-input"
            required
          />
          {loadingSearch ? (
            <Spinner className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-primary pointer-events-none" />
          ) : (
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
          )}
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 bg-card border-2 border-primary/30 rounded-xl shadow-2xl overflow-hidden max-h-48 sm:max-h-60 overflow-y-auto animate-in fade-in-50 zoom-in-95">
            {loadingSearch ? (
              <div className="p-4 text-center text-muted-foreground font-bold flex items-center justify-center gap-2 text-sm">
                <Spinner className="size-4 text-primary" />
                <span>Mencari data pasien...</span>
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="divide-y divide-border pb-4">
                {suggestions.map((p) => {
                  const rawPhone = (p.no_telp || '').toString();
                  const isPhoneErr = rawPhone.startsWith('#ERROR') || rawPhone.startsWith('#REF!') || rawPhone.startsWith('#VALUE!');
                  const cleanPhone = isPhoneErr ? '' : rawPhone;

                  return (
                    <li key={p.pasien_id}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelect({ ...p, no_telp: cleanPhone })}
                        className="w-full text-left px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-primary/10 focus:bg-primary/10 transition-colors flex items-center justify-between group touch-btn"
                      >
                        <div>
                          <div className="font-bold text-base md:text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                            <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                            {p.nama_pasien}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5 pl-7">
                            <Phone className="size-4" />
                            {cleanPhone || 'Tanpa no. telepon'}
                          </div>
                        </div>
                        <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full border border-primary/20 shrink-0">
                          Pasien Lama
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {!loadingSearch && isNewPatient && value.trim().length >= 2 && (
              <div className="p-4 bg-secondary/50 text-secondary-foreground text-sm font-semibold flex items-center gap-3">
                <UserPlus className="size-5 text-primary shrink-0" />
                <span>
                  Pasien baru <strong>"{value.trim()}"</strong> akan otomatis dibuat saat disimpan.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* No Telp Input */}
      <div>
        <label className="flex items-center gap-2 text-base font-bold text-foreground mb-1.5">
          <Phone className="size-5 text-primary shrink-0" />
          Nomor Telepon / WhatsApp <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={phoneValue}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Contoh: +62 812-3456-7890 / (021) 555-1234"
          className="w-full h-13 px-4 text-base md:text-lg border-2 border-input rounded-xl bg-background text-foreground font-bold focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground shadow-xs touch-input"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {phoneValue
            ? 'Bebas menggunakan simbol (+, -, spasi, kurung). Terisi otomatis dari data pasien.'
            : 'Mendukung format simbol seperti +62, strip (-), spasi, dan tanda kurung.'}
        </p>
      </div>
    </div>
  );
}
