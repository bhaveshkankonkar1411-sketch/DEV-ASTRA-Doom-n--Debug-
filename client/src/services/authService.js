import apiClient from './api';

export const authService = {
  login: async (credentials) => apiClient('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: async (userData) => apiClient('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getCurrentUser: async () => apiClient('/auth/me', { method: 'GET' }),
};

export default authService;

