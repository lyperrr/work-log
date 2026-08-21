import { apiGet, apiPost } from './api';

/**
 * Service khusus Master Data Pasien.
 */
export const pasienService = {
  /** Ambil semua pasien milik user (dengan opsional search query). */
  getPasienList: async (userId, searchQuery = '') => {
    const params = { user_id: userId };
    if (searchQuery) params.search_query = searchQuery;
    const res = await apiGet('getPasien', params);
    if (!res.success) throw new Error(res.message || 'Gagal mengambil data pasien');
    return res.data || [];
  },

  /** Search pasien berdasarkan nama. */
  searchPasien: async (userId, query) => {
    return pasienService.getPasienList(userId, query);
  },

  /** Cari pasien by nama, atau buat baru jika belum ada (upsert). */
  saveOrGetPasienByName: async (userId, nama, noTelp) => {
    const res = await apiPost('createOrGetPasien', userId, {
      nama_pasien: nama,
      no_telp: noTelp || '',
    });
    if (!res.success) throw new Error(res.message || 'Gagal menyimpan pasien');
    return res.data.pasien; // { pasien_id, nama_pasien, no_telp, ... }
  },
};
