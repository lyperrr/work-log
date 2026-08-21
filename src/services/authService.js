import { apiGet, apiPost } from './api';

/**
 * Service khusus Otentikasi (Login & Register).
 */
export const authService = {
  loginUser: async (email, password) => {
    const res = await apiPost('loginUser', null, { email, password });
    if (!res.success) throw new Error(res.message || 'Login gagal');
    return res.data; // { user_id, username, email, session_token }
  },

  registerUser: async (username, email, password) => {
    const res = await apiPost('registerUser', null, { username, email, password });
    if (!res.success) throw new Error(res.message || 'Registrasi gagal');
    return res.data; // { user_id, username, email }
  },

  /**
   * Validasi apakah user_id yang tersimpan di localStorage masih ada di database.
   * Dipanggil saat app pertama kali dimuat. Melempar error jika akun sudah dihapus.
   */
  validateSession: async (userId) => {
    const res = await apiGet('validateSession', { user_id: userId });
    if (!res.success) throw new Error(res.message || 'Sesi tidak valid');
    return res.data; // { user_id, username, email }
  },
};

