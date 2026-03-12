import api from './api';

const BASE = '/stock-counts';

const stockCountService = {
  getAll: () => api.get(BASE).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  complete: (id) => api.post(`${BASE}/${id}/complete`).then(res => res.data?.data ?? res.data),
};

export default stockCountService;
