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
  if (typeof dateInput === 'string') return dateInput.split('T')[0];
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
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

