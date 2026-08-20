import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/apiService';
import { User, Phone, CheckCircle2, UserPlus, Search } from 'lucide-react';

export function PatientAutocomplete({
  value,
  onChange,
  onSelectPatient,
  phoneValue,
  onPhoneChange,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);

    if (val.trim().length >= 1) {
      const matches = apiService.searchPasien(val);
      setSuggestions(matches);
      setIsOpen(true);

      const exactMatch = matches.find(
        (p) => p.nama_pasien.toLowerCase().trim() === val.toLowerCase().trim()
      );
      setIsNewPatient(!exactMatch);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsNewPatient(false);
    }
  };

  const handleSelect = (patient) => {
    onChange(patient.nama_pasien);
    onPhoneChange(patient.no_telp);
    onSelectPatient(patient);
    setIsOpen(false);
    setIsNewPatient(false);
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      <div className="relative">
        <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
          <User className="size-5 text-primary shrink-0" />
          Nama Pasien <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            onFocus={() => value.trim().length >= 1 && setIsOpen(true)}
            placeholder="Ketik nama pasien (cth: Budi)"
            className="w-full px-4 py-3.5 text-base md:text-lg border-2 border-input rounded-xl bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground shadow-sm touch-input"
            required
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 mt-2 bg-card border-2 border-primary/30 rounded-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in-50 zoom-in-95">
            {suggestions.length > 0 ? (
              <ul className="divide-y divide-border">
                {suggestions.map((p) => (
                  <li key={p.pasien_id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(p)}
                      className="w-full text-left px-5 py-4 hover:bg-primary/10 focus:bg-primary/10 transition-colors flex items-center justify-between group touch-btn"
                    >
                      <div>
                        <div className="font-bold text-base md:text-lg text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                          {p.nama_pasien}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5 pl-7">
                          <Phone className="size-4" />
                          {p.no_telp || 'Tanpa no. telepon'}
                        </div>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1 rounded-full border border-primary/20">
                        Pasien Lama
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {isNewPatient && value.trim().length >= 2 && (
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
        <label className="block text-base font-bold text-foreground mb-1.5 flex items-center gap-2">
          <Phone className="size-5 text-primary shrink-0" />
          Nomor Telepon / WhatsApp <span className="text-destructive">*</span>
        </label>
        <input
          type="tel"
          value={phoneValue}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="Contoh: 081234567890"
          className="w-full px-4 py-3.5 text-base md:text-lg border-2 border-input rounded-xl bg-background text-foreground focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground shadow-sm touch-input"
          required
        />
        <p className="text-xs text-muted-foreground mt-1">
          {phoneValue ? 'Terisi otomatis dari data pasien.' : 'Diisi untuk kontak & identifikasi pasien.'}
        </p>
      </div>
    </div>
  );
}
