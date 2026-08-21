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

// ─────────────────────────────────────────────────────────────
// In-memory cache for GET requests
// Eliminates redundant network calls when navigating between
// pages or re-rendering components that read the same data.
// TTL: 60 seconds. All entries are cleared after any mutation
// (POST) so data is always fresh after a create/update/delete.
// ─────────────────────────────────────────────────────────────
const _cache = new Map(); // key → { data, exp }
const CACHE_TTL_MS = 60_000; // 60 seconds

function _cacheGet(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    _cache.delete(key);
    return null;
  }
  return entry.data;
}

function _cacheSet(key, data) {
  _cache.set(key, { data, exp: Date.now() + CACHE_TTL_MS });
}

/** Manually bust the entire cache (e.g. after changing the GAS URL). */
export const clearApiCache = () => _cache.clear();

// GET request — served from cache when available
export const apiGet = async (action, params = {}) => {
  const cacheKey = `${action}::${JSON.stringify(params)}`;
  const hit = _cacheGet(cacheKey);
  if (hit) return hit;

  const url = getGasUrl();
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${url}?${query}`, { redirect: 'follow' });
  const data = await res.json();

  // Only cache successful responses
  if (data?.success) _cacheSet(cacheKey, data);
  return data;
};

// POST request — clears all cached GET data after a successful mutation
// so the next read always reflects the latest server state.
export const apiPost = async (action, user_id, data = {}, extra = {}) => {
  const url = getGasUrl();
  const res = await fetch(url, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action, user_id, data, ...extra }),
  });
  const result = await res.json();

  // Bust cache after any successful write so next GET is fresh
  if (result?.success) _cache.clear();

  return result;
};

