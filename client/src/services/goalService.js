import apiClient from './api';

export const goalService = {
  createGoal: async (goalData) => apiClient('/goals', { method: 'POST', body: JSON.stringify(goalData) }),
  getGoals: async () => apiClient('/goals', { method: 'GET' }),
  getGoalById: async (id) => apiClient(`/goals/${id}`, { method: 'GET' }),
  getGoalProgress: async (id) => apiClient(`/goals/${id}/progress`, { method: 'GET' }),
  getRecoveryAdvice: async (id, payload) => apiClient(`/goals/${id}/recovery-chat`, { method: 'POST', body: JSON.stringify(payload) }),
};

export default goalService;

