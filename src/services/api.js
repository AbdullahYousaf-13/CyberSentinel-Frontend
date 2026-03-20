const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const getAuthToken = () => localStorage.getItem('token');

const buildUrl = (path, params = {}) => {
  const url = new URL(path, API_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });
  return url.toString();
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const text = await response.text();
    const message = text || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
};

export const apiGet = async (path, params = {}) => {
  const token = getAuthToken();
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  return handleResponse(response);
};

export const apiPost = async (path, body = {}) => {
  const token = getAuthToken();
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  return handleResponse(response);
};

export const login = async (email, password, totpCode = null) => {
  return apiPost('/api/auth/login', {
    email,
    password,
    totp_code: totpCode || undefined
  });
};

export const register = async (email, password, firstName, lastName) => {
  return apiPost('/api/auth/register', {
    email,
    password,
    first_name: firstName,
    last_name: lastName
  });
};

export const setupTotp = async () => {
  return apiPost('/api/auth/2fa/setup');
};

export const verifyTotp = async (totpCode) => {
  return apiPost('/api/auth/2fa/verify', { totp_code: totpCode });
};

export const disableTotp = async (totpCode) => {
  return apiPost('/api/auth/2fa/disable', { totp_code: totpCode });
};

export const verifyEmail = async (token) => {
  return apiGet('/api/auth/verify-email', { token });
};

export const requestPasswordReset = async (email) => {
  return apiPost('/api/auth/password/forgot', { email });
};

export const verifyPasswordResetCode = async (email, code) => {
  return apiPost('/api/auth/password/verify', { email, code });
};

export const resetPassword = async (email, code, newPassword) => {
  return apiPost('/api/auth/password/reset', { email, code, new_password: newPassword });
};

export const fetchAlerts = async (params = {}) => apiGet('/api/alerts', params);
export const fetchLogs = async (params = {}) => apiGet('/api/logs', params);
export const fetchLogCount = async (params = {}) => apiGet('/api/logs/count', params);

export const fetchMe = async () => apiGet('/api/auth/me');
