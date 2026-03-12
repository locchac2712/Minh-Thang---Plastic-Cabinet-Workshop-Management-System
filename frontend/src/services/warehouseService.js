import api from './api';

const BASE = '/warehouses';

const warehouseService = {
  getAll: (query) => api.get(BASE + (query ? `?q=${query}` : '')).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  toggleActive: (id) => api.put(`${BASE}/${id}/toggle`).then(res => res.data?.data ?? res.data),
};

export default warehouseService;
