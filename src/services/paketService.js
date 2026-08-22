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

  /**
   * Catat penggunaan satu sesi kunjungan pada paket secara manual.
   * Menambah terpakai +1 dan mengurangi sisa_kunjungan -1 di spreadsheet.
   *
   * @param {string} userId
   * @param {string} paketId - ID paket yang akan diupdate
   * @returns {{ terpakai, sisa_kunjungan, total_kunjungan, status_paket }}
   */
  usePaketKunjungan: async (userId, paketId) => {
    const res = await apiPost('usePaketKunjungan', userId, { paket_id: paketId });
    if (!res.success) throw new Error(res.message || 'Gagal mencatat kunjungan paket');
    return res.data;
  },

  /** Update detail paket kunjungan. */
  updatePaket: async (userId, paketIdOrData, updateDataObj) => {
    const paketId = typeof paketIdOrData === 'string' ? paketIdOrData : paketIdOrData?.paket_id;
    const data = typeof paketIdOrData === 'object' ? paketIdOrData : updateDataObj || {};

    const res = await apiPost('updatePaket', userId, {
      paket_id: paketId,
      total_kunjungan: data.total_kunjungan,
      harga_paket: data.harga_paket,
      tanggal_beli: data.tanggal_beli,
      status_paket: data.status_paket,
      sisa_kunjungan: data.sisa_kunjungan,
      terpakai: data.terpakai,
    });
    if (!res.success) throw new Error(res.message || 'Gagal memperbarui paket');
    return res.data;
  },

  /** Hapus paket kunjungan berdasarkan ID. */
  deletePaket: async (userId, paketId) => {
    const res = await apiPost('deletePaket', userId, { paket_id: paketId });
    if (!res.success) throw new Error(res.message || 'Gagal menghapus paket');
    return res.data;
  },
};

