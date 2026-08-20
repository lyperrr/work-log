import { initialUsers, initialPasien, initialPaket, initialKunjungan } from './mockData';

const STORAGE_KEYS = {
  USERS: 'app_data_users',
  PASIEN: 'app_data_pasien',
  PAKET: 'app_data_paket',
  KUNJUNGAN: 'app_data_kunjungan',
  GAS_URL: 'gas_web_app_url',
};

function getStorage(key, defaultData) {
  try {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Storage error:', e);
    return defaultData;
  }
}

function setStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage set error:', e);
  }
}

function generateId(prefix, list, keyName) {
  if (!list || list.length === 0) return `${prefix}-0001`;
  const nums = list
    .map((item) => {
      const val = item[keyName] || '';
      const parts = val.split('-');
      return parts.length > 1 ? parseInt(parts[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const max = Math.max(0, ...nums);
  const next = max + 1;
  return `${prefix}-${String(next).padStart(4, '0')}`;
}

export const apiService = {
  // Reset Data to initial seeds
  resetData: () => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    localStorage.setItem(STORAGE_KEYS.PASIEN, JSON.stringify(initialPasien));
    localStorage.setItem(STORAGE_KEYS.PAKET, JSON.stringify(initialPaket));
    localStorage.setItem(STORAGE_KEYS.KUNJUNGAN, JSON.stringify(initialKunjungan));
  },

  // GAS URL Config
  getGasUrl: () => localStorage.getItem(STORAGE_KEYS.GAS_URL) || '',
  setGasUrl: (url) => localStorage.setItem(STORAGE_KEYS.GAS_URL, url),

  // Auth APIs
  loginUser: async (email, password) => {
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password_hash === password
    );
    if (!found) {
      throw new Error('Email atau password salah');
    }
    return { user_id: found.user_id, username: found.username, email: found.email };
  },

  registerUser: async (username, email, password) => {
    const users = getStorage(STORAGE_KEYS.USERS, initialUsers);
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase().trim())) {
      throw new Error('Email sudah terdaftar');
    }
    if (users.some((u) => u.username.toLowerCase() === username.toLowerCase().trim())) {
      throw new Error('Username sudah digunakan');
    }
    const newId = generateId('USR', users, 'user_id');
    const newUser = {
      user_id: newId,
      username: username.trim(),
      email: email.trim(),
      password_hash: password,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setStorage(STORAGE_KEYS.USERS, users);
    return { user_id: newUser.user_id, username: newUser.username, email: newUser.email };
  },

  // Pasien Master Data APIs
  getPasienList: () => {
    return getStorage(STORAGE_KEYS.PASIEN, initialPasien);
  },

  searchPasien: (query) => {
    const list = getStorage(STORAGE_KEYS.PASIEN, initialPasien);
    if (!query) return list;
    const cleanQ = query.toLowerCase().trim().replace(/\s+/g, ' ');
    return list.filter((p) =>
      p.nama_pasien.toLowerCase().replace(/\s+/g, ' ').includes(cleanQ)
    );
  },

  saveOrGetPasienByName: (nama, noTelp) => {
    const list = getStorage(STORAGE_KEYS.PASIEN, initialPasien);
    const cleanNama = nama.trim().replace(/\s+/g, ' ');
    
    // Find case-insensitive match
    const existing = list.find(
      (p) => p.nama_pasien.toLowerCase().replace(/\s+/g, ' ') === cleanNama.toLowerCase()
    );

    if (existing) {
      // If phone number changed, update phone
      if (noTelp && noTelp.trim() !== existing.no_telp) {
        existing.no_telp = noTelp.trim();
        existing.updated_at = new Date().toISOString();
        setStorage(STORAGE_KEYS.PASIEN, list);
      }
      return existing;
    }

    // Create new patient
    const newId = generateId('PSN', list, 'pasien_id');
    const newPasien = {
      pasien_id: newId,
      nama_pasien: cleanNama,
      no_telp: (noTelp || '').trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    list.push(newPasien);
    setStorage(STORAGE_KEYS.PASIEN, list);
    return newPasien;
  },

  updatePasienPhone: (pasien_id, newNoTelp) => {
    const list = getStorage(STORAGE_KEYS.PASIEN, initialPasien);
    const idx = list.findIndex((p) => p.pasien_id === pasien_id);
    if (idx !== -1) {
      list[idx].no_telp = newNoTelp.trim();
      list[idx].updated_at = new Date().toISOString();
      setStorage(STORAGE_KEYS.PASIEN, list);
    }
  },

  // Paket APIs
  getPaketList: () => {
    const paketList = getStorage(STORAGE_KEYS.PAKET, initialPaket);
    const pasienList = getStorage(STORAGE_KEYS.PASIEN, initialPasien);
    return paketList.map((pkt) => {
      const pasien = pasienList.find((p) => p.pasien_id === pkt.pasien_id);
      return {
        ...pkt,
        nama_pasien: pasien ? pasien.nama_pasien : 'Pasien Tidak Ditemukan',
        no_telp: pasien ? pasien.no_telp : '',
      };
    });
  },

  getPaketActiveByPasienId: (pasien_id) => {
    const list = getStorage(STORAGE_KEYS.PAKET, initialPaket);
    return list.filter((p) => p.pasien_id === pasien_id && p.status_paket === 'aktif' && p.sisa_kunjungan > 0);
  },

  createPaket: (data) => {
    const list = getStorage(STORAGE_KEYS.PAKET, initialPaket);
    const newId = generateId('PKT', list, 'paket_id');
    const total = Number(data.total_kunjungan) || 1;
    const newPaket = {
      paket_id: newId,
      pasien_id: data.pasien_id,
      total_kunjungan: total,
      terpakai: 0,
      sisa_kunjungan: total,
      harga_paket: Number(data.harga_paket) || 0,
      tanggal_beli: data.tanggal_beli || new Date().toISOString().split('T')[0],
      status_paket: 'aktif',
      dibuat_oleh: data.dibuat_oleh || 'USR-0001',
    };
    list.push(newPaket);
    setStorage(STORAGE_KEYS.PAKET, list);
    return newPaket;
  },

  // Kunjungan APIs
  getKunjunganList: () => {
    const kunjunganList = getStorage(STORAGE_KEYS.KUNJUNGAN, initialKunjungan);
    const pasienList = getStorage(STORAGE_KEYS.PASIEN, initialPasien);
    const paketList = getStorage(STORAGE_KEYS.PAKET, initialPaket);

    return kunjunganList.map((k) => {
      const pasien = pasienList.find((p) => p.pasien_id === k.pasien_id);
      const paket = k.paket_id ? paketList.find((p) => p.paket_id === k.paket_id) : null;
      return {
        ...k,
        nama_pasien: pasien ? pasien.nama_pasien : 'Pasien Tidak Ditemukan',
        no_telp: pasien ? pasien.no_telp : '',
        info_paket: paket ? `Paket (${paket.terpakai}/${paket.total_kunjungan})` : null,
      };
    });
  },

  createKunjungan: (data) => {
    const kunjunganList = getStorage(STORAGE_KEYS.KUNJUNGAN, initialKunjungan);
    const newId = generateId('TRX', kunjunganList, 'kunjungan_id');

    const newKunjungan = {
      kunjungan_id: newId,
      pasien_id: data.pasien_id,
      paket_id: data.paket_id || null,
      metode_pembayaran: data.metode_pembayaran || 'cash',
      tanggal_kunjungan: data.tanggal_kunjungan || new Date().toISOString().split('T')[0],
      biaya: data.paket_id ? 0 : Number(data.biaya ?? 300000),
      status: data.status || 'menunggu',
      dibuat_oleh: data.dibuat_oleh || 'USR-0001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    kunjunganList.unshift(newKunjungan);
    setStorage(STORAGE_KEYS.KUNJUNGAN, kunjunganList);

    // If part of a paket, deduct quota
    if (data.paket_id) {
      const paketList = getStorage(STORAGE_KEYS.PAKET, initialPaket);
      const pktIdx = paketList.findIndex((p) => p.paket_id === data.paket_id);
      if (pktIdx !== -1) {
        const pkt = paketList[pktIdx];
        pkt.terpakai = (pkt.terpakai || 0) + 1;
        pkt.sisa_kunjungan = Math.max(0, pkt.total_kunjungan - pkt.terpakai);
        if (pkt.sisa_kunjungan === 0) {
          pkt.status_paket = 'selesai';
        }
        paketList[pktIdx] = pkt;
        setStorage(STORAGE_KEYS.PAKET, paketList);
      }
    }

    return newKunjungan;
  },

  updateKunjungan: (kunjungan_id, updateData) => {
    const kunjunganList = getStorage(STORAGE_KEYS.KUNJUNGAN, initialKunjungan);
    const idx = kunjunganList.findIndex((k) => k.kunjungan_id === kunjungan_id);
    if (idx !== -1) {
      kunjunganList[idx] = {
        ...kunjunganList[idx],
        ...updateData,
        updated_at: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.KUNJUNGAN, kunjunganList);
      return kunjunganList[idx];
    }
    return null;
  },

  deleteKunjungan: (kunjungan_id) => {
    let kunjunganList = getStorage(STORAGE_KEYS.KUNJUNGAN, initialKunjungan);
    const target = kunjunganList.find((k) => k.kunjungan_id === kunjungan_id);

    // If it was linked to a package, restore quota
    if (target && target.paket_id) {
      const paketList = getStorage(STORAGE_KEYS.PAKET, initialPaket);
      const pktIdx = paketList.findIndex((p) => p.paket_id === target.paket_id);
      if (pktIdx !== -1) {
        const pkt = paketList[pktIdx];
        pkt.terpakai = Math.max(0, (pkt.terpakai || 1) - 1);
        pkt.sisa_kunjungan = Math.max(0, pkt.total_kunjungan - pkt.terpakai);
        if (pkt.sisa_kunjungan > 0) {
          pkt.status_paket = 'aktif';
        }
        paketList[pktIdx] = pkt;
        setStorage(STORAGE_KEYS.PAKET, paketList);
      }
    }

    kunjunganList = kunjunganList.filter((k) => k.kunjungan_id !== kunjungan_id);
    setStorage(STORAGE_KEYS.KUNJUNGAN, kunjunganList);
  },
};
