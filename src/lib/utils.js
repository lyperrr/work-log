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
 * Translates technical error terms (like 'server', 'fetch', '500', 'JSON', 'script')
 * into simple, friendly Indonesian messages that any everyday user can easily understand.
 */
export function getFriendlyErrorMessage(err, defaultMessage = 'Maaf, terjadi kendala saat memproses data. Silakan coba lagi.') {
  if (!err) return defaultMessage;

  const rawMsg = (typeof err === 'string' ? err : err?.message || '').toString().trim();
  const lower = rawMsg.toLowerCase();

  if (!rawMsg || rawMsg === '[object Object]') {
    return defaultMessage;
  }

  // Internet connection lost / network error
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network error') ||
    lower.includes('offline') ||
    lower.includes('load failed') ||
    lower.includes('internet')
  ) {
    return 'Koneksi terputus. Mohon periksa jaringan internet Anda lalu coba lagi.';
  }

  // Invalid JSON or backend error page
  if (
    lower.includes('unexpected token') ||
    lower.includes('json') ||
    lower.includes('syntaxerror') ||
    lower.includes('is not valid json')
  ) {
    return 'Data belum dapat dimuat saat ini. Silakan coba beberapa saat lagi.';
  }

  // 500 / Internal Server Error / Script Error
  if (
    lower.includes('500') ||
    lower.includes('internal server error') ||
    lower.includes('script error') ||
    lower.includes('execution failed') ||
    lower.includes('google apps script') ||
    lower.includes('typeerror') ||
    lower.includes('referenceerror')
  ) {
    return 'Sistem sedang sibuk. Silakan coba lagi dalam beberapa saat.';
  }

  // 404 / Page or resource Not Found
  if (lower.includes('404') || lower.includes('not found')) {
    return 'Data yang Anda cari tidak ditemukan.';
  }

  // 401 / Session Expired
  if (lower.includes('401') || lower.includes('unauthorized') || lower.includes('forbidden')) {
    return 'Waktu masuk Anda telah habis. Silakan masuk (login) kembali.';
  }

  // Technical backend validation messages (e.g. Field `paket_id` diperlukan)
  if (
    lower.includes('field') ||
    lower.includes('diperlukan') ||
    lower.includes('wajib diisi') ||
    rawMsg.includes('`')
  ) {
    if (lower.includes('paket_id') || lower.includes('paket')) {
      return 'ID Paket tidak ditemukan. Mohon pilih kembali paket yang ingin dihapus.';
    }
    if (lower.includes('pasien')) {
      return 'Data pasien belum lengkap. Mohon periksa kembali informasi pasien.';
    }
    if (lower.includes('kunjungan')) {
      return 'Data kunjungan belum lengkap. Mohon periksa kembali formulir Anda.';
    }
    return 'Informasi yang dikirimkan belum lengkap. Mohon periksa kembali input Anda.';
  }

  // Replace any technical terms in raw message if present
  let friendly = rawMsg
    .replace(/server/gi, 'sistem')
    .replace(/database/gi, 'penyimpanan data')
    .replace(/fetch/gi, 'pengambilan data')
    .replace(/API/g, 'layanan')
    .replace(/endpoint/gi, 'alamat data');

  return friendly;
}


