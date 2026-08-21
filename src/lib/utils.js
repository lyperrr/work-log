import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format Date object / date string ke 'YYYY-MM-DD' secara lokal (tanpa pergeseran timezone UTC).
 */
export function formatDateLocal(dateInput) {
  if (!dateInput) return '';

  const str = String(dateInput).trim();

  // Jika sudah berupa string polos 'YYYY-MM-DD', langsung kembalikan
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Jika berupa ISO String (contoh: "2026-05-28T17:00:00.000Z"), konversi jam UTC ke waktu lokal user
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return str.substring(0, 10);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Mengembalikan string tanggal hari ini dalam format 'YYYY-MM-DD' lokal.
 */
export function getTodayDateString() {
  return formatDateLocal(new Date());
}

