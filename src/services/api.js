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
    let message = text || `Request failed with status ${response.status}`;
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (typeof parsed?.detail === 'string' && parsed.detail.trim()) {
          message = parsed.detail.trim();
        }
      } catch (_err) {
        // non-JSON response body, keep raw text
      }
    }
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

export const apiPatch = async (path, body = {}) => {
  const token = getAuthToken();
  const response = await fetch(buildUrl(path), {
    method: 'PATCH',
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

export const fetchAlerts = async (params = {}) => apiGet('/api/alerts/', params);
export const fetchAlertCount = async (params = {}) => apiGet('/api/alerts/count', params);
export const fetchAlertAnalytics = async () => apiGet('/api/alerts/analytics');
export const fetchLogs = async (params = {}) => apiGet('/api/logs/', params);
export const fetchLogCount = async (params = {}) => apiGet('/api/logs/count', params);

export const fetchMe = async () => apiGet('/api/auth/me');
export const updateNotificationPreferences = async (payload) =>
  apiPatch('/api/auth/me/notification-preferences', payload);

export const confirmKnownAttack = async (alertId, payload) =>
  apiPost(`/api/alerts/${alertId}/confirm-known`, payload);
export const markFalsePositive = async (alertId, payload = {}) =>
  apiPost(`/api/alerts/${alertId}/mark-false-positive`, payload);

export const createRetrainJob = async (payload) => apiPost('/api/ml/models/retrain', payload);
export const createBackfillJob = async (payload) => apiPost('/api/ml/backfill', payload);
export const previewBootstrapDataset = async (payload) => apiPost('/api/ml/bootstrap/preview', payload);
export const importBootstrapReviews = async (payload) => apiPost('/api/ml/bootstrap/reviews/import', payload);
export const listRetrainJobs = async (params = {}) => apiGet('/api/ml/models/retrain-jobs', params);
export const fetchRetrainJob = async (jobId) => apiGet(`/api/ml/models/retrain-jobs/${jobId}`);
export const listBackfillJobs = async (params = {}) => apiGet('/api/ml/backfill-jobs', params);
export const fetchBackfillJob = async (jobId) => apiGet(`/api/ml/backfill-jobs/${jobId}`);
export const listModelVersions = async () => apiGet('/api/ml/models/versions');
export const rollbackModelVersion = async (targetVersion) =>
  apiPost('/api/ml/models/rollback', { target_version: targetVersion });
export const listSuppressions = async (params = {}) => apiGet('/api/ml/suppressions', params);
export const deactivateSuppression = async (fingerprint) =>
  apiPost(`/api/ml/suppressions/${fingerprint}/deactivate`);
export const activateSuppression = async (fingerprint) =>
  apiPost(`/api/ml/suppressions/${fingerprint}/activate`);
