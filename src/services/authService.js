import { apiPost } from './api';

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
};
