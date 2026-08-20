const GAS_URL = 'https://script.google.com/macros/s/AKfycbxr_6Ia0kAzR5B0eFr4DB0VUJxU3gP18mqdkgyQ7APdJsEY6AcA_eGm0tPRa8sKES5L/exec';

// GET request
export const apiGet = async (action, params = {}) => {
  const query = new URLSearchParams({ action, ...params }).toString();
  const res = await fetch(`${GAS_URL}?${query}`);
  return res.json();
};

// POST request
export const apiPost = async (action, user_id, data = {}) => {
  const res = await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action, user_id, data }),
  });
  return res.json();
};
