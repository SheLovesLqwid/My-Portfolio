import api from './api';

export const riskService = {
  async getRisks(params = {}) {
    const response = await api.get('/risks', { params });
    return response.data;
  },

  async getRisk(id) {
    const response = await api.get(`/risks/${id}`);
    return response.data;
  },

  async createRisk(riskData) {
    const response = await api.post('/risks', riskData);
    return response.data;
  },

  async updateRisk(id, riskData) {
    const response = await api.put(`/risks/${id}`, riskData);
    return response.data;
  },

  async deleteRisk(id) {
    const response = await api.delete(`/risks/${id}`);
    return response.data;
  },

  async getRiskStats() {
    const response = await api.get('/risks/stats/summary');
    return response.data;
  }
};
