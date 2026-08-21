import { apiGet, apiPost } from './api';

/**
 * Service khusus Transaksi Kunjungan Pasien.
 */
export const kunjunganService = {
  /**
   * Ambil semua kunjungan milik user (sudah di-enrich dengan nama pasien & info paket).
   * Field info_paket dinormalisasi agar kompatibel dengan UI.
   */
  getKunjunganList: async (userId, filters = {}) => {
    const params = { user_id: userId, ...filters };
    const res = await apiGet('getKunjungan', params);
    if (!res.success) throw new Error(res.message || 'Gagal mengambil data kunjungan');
    return (res.data || []).map((k) => ({
      ...k,
      info_paket: k.paket_info
        ? `Paket (${k.paket_info.terpakai}/${k.paket_info.total_kunjungan})`
        : null,
    }));
  },

  /** Catat kunjungan baru. Jika paket_id diisi, GAS otomatis deduct sisa. */
  createKunjungan: async (userId, data) => {
    const res = await apiPost('createKunjungan', userId, {
      ...data,
      pasien_id: data.pasien_id || '',
      nama_pasien: data.nama_pasien || '',
      no_telp: data.no_telp || '',
      paket_id: data.paket_id || '',
      metode_pembayaran: (data.metode_pembayaran || 'cash').toLowerCase(),
      tanggal_kunjungan: data.tanggal_kunjungan,
      biaya: Number(data.biaya ?? 0),
      status: (data.status || 'menunggu').toLowerCase(),
    });
    if (!res.success) throw new Error(res.message || 'Gagal mencatat kunjungan');
    return res.data?.kunjungan || res.data || {};
  },

  /** Update detail kunjungan (metode, tanggal, biaya, status). */
  updateKunjungan: async (userId, kunjunganId, updateData) => {
    const res = await apiPost('updateKunjungan', userId, {
      kunjungan_id: kunjunganId,
      ...updateData,
    });
    if (!res.success) throw new Error(res.message || 'Gagal memperbarui kunjungan');
    return res.data;
  },

  /** Update hanya status pembayaran kunjungan. */
  updateKunjunganStatus: async (userId, kunjunganId, status) => {
    const res = await apiPost('updateKunjunganStatus', userId, {
      kunjungan_id: kunjunganId,
      status,
    });
    if (!res.success) throw new Error(res.message || 'Gagal memperbarui status');
    return res.data;
  },

  /**
   * Hapus kunjungan. Jika terkait paket, GAS akan auto-restore sisa paket.
   */
  deleteKunjungan: async (userId, kunjunganId) => {
    const res = await apiPost('deleteKunjungan', userId, {}, { kunjungan_id: kunjunganId });
    if (!res.success) throw new Error(res.message || 'Gagal menghapus kunjungan');
    return res.data;
  },
};
