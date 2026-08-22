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

/**
 * Translates raw technical/developer error messages into clear, friendly Indonesian user-facing messages.
 * Prevents technical strings like 'Failed to fetch', 'Unexpected token < in JSON', '500 Internal Server Error' from showing to users.
 */
export function getFriendlyErrorMessage(err, defaultMessage = 'Terjadi kendala pada sistem. Silakan coba beberapa saat lagi.') {
  if (!err) return defaultMessage;

  const rawMsg = (typeof err === 'string' ? err : err?.message || '').toString().trim();
  const lower = rawMsg.toLowerCase();

  if (!rawMsg || rawMsg === '[object Object]') {
    return defaultMessage;
  }

  // Network & Connectivity errors
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('offline') ||
    lower.includes('load failed')
  ) {
    return 'Gagal terhubung ke server. Periksa koneksi internet Anda dan coba beberapa saat lagi.';
  }

  // JSON parsing / HTML response error (e.g. GAS returning 500 error page or HTML)
  if (
    lower.includes('unexpected token') ||
    lower.includes('json') ||
    lower.includes('syntaxerror') ||
    lower.includes('is not valid json')
  ) {
    return 'Respon dari server tidak valid. Silakan coba beberapa saat lagi.';
  }

  // HTTP Errors / Server Errors
  if (lower.includes('500') || lower.includes('internal server error')) {
    return 'Terjadi gangguan pada server. Silakan coba beberapa saat lagi.';
  }

  if (lower.includes('404') || lower.includes('not found')) {
    return 'Layanan server tidak ditemukan.';
  }

  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
  }

  // Script or GAS specific error strings that might leak developer terminology
  if (
    lower.includes('script error') ||
    lower.includes('execution failed') ||
    lower.includes('google apps script') ||
    lower.includes('typeerror') ||
    lower.includes('referenceerror')
  ) {
    return 'Gagal memproses data pada server. Silakan coba beberapa saat lagi.';
  }

  // If error message is clean human-readable text
  return rawMsg;
}


