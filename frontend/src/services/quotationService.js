import api from './api';

const BASE = '/quotations';

const quotationService = {
  getAll: (params) => api.get(BASE, { params }).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(`${BASE}/create`, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  changeStatus: (id, status) => api.put(`${BASE}/${id}/status`, { status }).then(res => res.data?.data ?? res.data),
  getHistory: (customerId) => api.get(`${BASE}/history/${customerId}`).then(res => res.data?.data ?? res.data),
};

export default quotationService;
