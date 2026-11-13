// Centralized API client with token handling.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'API request failed');
    error.status = response.status;
    error.code = data.error?.code;
    error.details = data.error?.details || [];
    throw error;
  }

  return data;
};

export default apiClient;

