const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyZ-ECSuasdFEFpuCHtZY0kVhrQzSEgoFSTklG_SwUXf7wjD8IHFjutE6aM8T5KBGs/exec';

export const getGasUrl = () => {
  try {
    return localStorage.getItem('app_gas_url') || DEFAULT_GAS_URL;
  } catch {
    return DEFAULT_GAS_URL;
  }
};

export const setGasUrl = (url) => {
  try {
    localStorage.setItem('app_gas_url', url || DEFAULT_GAS_URL);
  } catch {
    // ignore
  }
};

export const GAS_URL = getGasUrl();

// GET request
export const apiGet = async (action, params = {}) => {
  const url = getGasUrl();
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${url}?${query}`, { redirect: 'follow' });
  return res.json();
};

// POST request
// extra: object tambahan yang di-merge ke root body (e.g. { kunjungan_id } untuk deleteKunjungan)
export const apiPost = async (action, user_id, data = {}, extra = {}) => {
  const url = getGasUrl();
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action, user_id, data, ...extra }),
  });
  return res.json();
};
