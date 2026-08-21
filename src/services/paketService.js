import { apiGet, apiPost } from './api';

/**
 * Service khusus Manajemen Paket Kunjungan.
 */
export const paketService = {
  /** Ambil semua paket milik user (sudah ter-join dengan nama pasien). */
  getPaketList: async (userId) => {
    const res = await apiGet('getPaket', { user_id: userId });
    if (!res.success) throw new Error(res.message || 'Gagal mengambil data paket');
    return res.data || [];
  },

  /** Ambil paket aktif berdasarkan pasien_id (filter client-side). */
  getPaketActiveByPasienId: async (userId, pasienId) => {
    const list = await paketService.getPaketList(userId);
    return list.filter(
      (p) => p.pasien_id === pasienId && p.status_paket === 'aktif' && p.sisa_kunjungan > 0
    );
  },

  /** Buat paket kunjungan baru. */
  createPaket: async (userId, data) => {
    const res = await apiPost('createPaket', userId, {
      pasien_id: data.pasien_id,
      total_kunjungan: data.total_kunjungan,
      harga_paket: data.harga_paket,
      tanggal_beli: data.tanggal_beli,
    });
    if (!res.success) throw new Error(res.message || 'Gagal membuat paket');
    return res.data; // { paket_id, ... }
  },
};
