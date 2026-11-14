import apiClient from './api';

export const goalService = {
  getCurrent: async (options = {}) => apiClient('/profit-goals/current', options),
  getCsvSchema: async (options = {}) => apiClient('/profit-goals/csv/schema', options),
  previewCsv: async (file, options = {}) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient('/profit-goals/csv/preview', { ...options, method: 'POST', body });
  },
  importCsv: async (file, options = {}) => {
    const body = new FormData();
    body.append('file', file);
    return apiClient('/profit-goals/import-csv', { ...options, method: 'POST', body });
  },
  analyze: async (payload, options = {}) => apiClient('/profit-goals/analyze', { ...options, method: 'POST', body: JSON.stringify(payload) }),
  createGoal: async (goalData, options = {}) => apiClient('/goals', { ...options, method: 'POST', body: JSON.stringify(goalData) }),
  getGoals: async () => apiClient('/goals', { method: 'GET' }),
  getGoalById: async (id) => apiClient(`/goals/${id}`, { method: 'GET' }),
  getGoalProgress: async (id) => apiClient(`/goals/${id}/progress`, { method: 'GET' }),
  getRecoveryAdvice: async (id, payload) => apiClient(`/goals/${id}/recovery-chat`, { method: 'POST', body: JSON.stringify(payload) }),
};

export default goalService;

