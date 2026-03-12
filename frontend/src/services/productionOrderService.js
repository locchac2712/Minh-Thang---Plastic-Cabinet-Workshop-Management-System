import api from './api';

const BASE = '/production-orders';

const productionOrderService = {
  getAll: (params) => api.get(BASE, { params }).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  changeStatus: (id, status) => api.put(`${BASE}/${id}/status`, { status }).then(res => res.data?.data ?? res.data),
  updateProgress: (id, payload) => api.put(`${BASE}/${id}/progress`, payload).then(res => res.data?.data ?? res.data),
};

export default productionOrderService;
