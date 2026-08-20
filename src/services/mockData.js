export const initialUsers = [
  {
    user_id: 'USR-0001',
    username: 'admin',
    email: 'admin@freelance.com',
    password_hash: 'admin123',
    created_at: '2026-08-01T08:00:00.000Z',
  },
];

export const initialPasien = [
  {
    pasien_id: 'PSN-0001',
    nama_pasien: 'Budi Santoso',
    no_telp: '081234567890',
    created_at: '2026-08-02T09:00:00.000Z',
    updated_at: '2026-08-02T09:00:00.000Z',
  },
  {
    pasien_id: 'PSN-0002',
    nama_pasien: 'Siti Rahma',
    no_telp: '081987654321',
    created_at: '2026-08-05T10:00:00.000Z',
    updated_at: '2026-08-05T10:00:00.000Z',
  },
  {
    pasien_id: 'PSN-0003',
    nama_pasien: 'Hendra Wijaya',
    no_telp: '085711223344',
    created_at: '2026-08-10T11:00:00.000Z',
    updated_at: '2026-08-10T11:00:00.000Z',
  },
];

export const initialPaket = [
  {
    paket_id: 'PKT-0001',
    pasien_id: 'PSN-0002',
    total_kunjungan: 5,
    terpakai: 5,
    sisa_kunjungan: 0,
    harga_paket: 1350000,
    tanggal_beli: '2026-08-05',
    status_paket: 'aktif',
    dibuat_oleh: 'USR-0001',
  },
  {
    paket_id: 'PKT-0002',
    pasien_id: 'PSN-0003',
    total_kunjungan: 3,
    terpakai: 3,
    sisa_kunjungan: 0,
    harga_paket: 850000,
    tanggal_beli: '2026-08-01',
    status_paket: 'selesai',
    dibuat_oleh: 'USR-0001',
  },
];

export const initialKunjungan = [
  {
    kunjungan_id: 'TRX-0001',
    pasien_id: 'PSN-0001',
    paket_id: null,
    metode_pembayaran: 'cash',
    tanggal_kunjungan: '2026-08-18',
    biaya: 300000,
    status: 'lunas',
    dibuat_oleh: 'USR-0001',
    created_at: '2026-08-18T09:00:00.000Z',
    updated_at: '2026-08-18T09:00:00.000Z',
  },
  {
    kunjungan_id: 'TRX-0002',
    pasien_id: 'PSN-0002',
    paket_id: 'PKT-0001',
    metode_pembayaran: 'transfer',
    tanggal_kunjungan: '2026-08-19',
    biaya: 0,
    status: 'lunas',
    dibuat_oleh: 'USR-0001',
    created_at: '2026-08-19T10:00:00.000Z',
    updated_at: '2026-08-19T10:00:00.000Z',
  },
  {
    kunjungan_id: 'TRX-0003',
    pasien_id: 'PSN-0001',
    paket_id: null,
    metode_pembayaran: 'cash',
    tanggal_kunjungan: '2026-08-19',
    biaya: 300000,
    status: 'menunggu',
    dibuat_oleh: 'USR-0001',
    created_at: '2026-08-19T14:30:00.000Z',
    updated_at: '2026-08-19T14:30:00.000Z',
  },
  {
    kunjungan_id: 'TRX-0004',
    pasien_id: 'PSN-0003',
    paket_id: null,
    metode_pembayaran: 'transfer',
    tanggal_kunjungan: '2026-08-15',
    biaya: 300000,
    status: 'belum bayar',
    dibuat_oleh: 'USR-0001',
    created_at: '2026-08-15T11:00:00.000Z',
    updated_at: '2026-08-15T11:00:00.000Z',
  },
];
