import api from './api';

export const dashboardService = {
  async getStats() {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  async getRecentActivities() {
    const response = await api.get('/dashboard/recent-activities');
    return response.data;
  },

  async getAlerts() {
    const response = await api.get('/dashboard/alerts');
    return response.data;
  }
};
