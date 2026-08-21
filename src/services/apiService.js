import { authService } from './authService';
import { pasienService } from './pasienService';
import { paketService } from './paketService';
import { kunjunganService } from './kunjunganService';
import { getGasUrl, setGasUrl } from './api';

/**
 * Aggregator apiService yang menggabungkan semua domain service.
 * Menjaga backwards compatibility dengan AuthContext & komponen UI.
 */
export const apiService = {
  getGasUrl,
  setGasUrl,
  ...authService,
  ...pasienService,
  ...paketService,
  ...kunjunganService,
};

export { authService, pasienService, paketService, kunjunganService, getGasUrl, setGasUrl };
