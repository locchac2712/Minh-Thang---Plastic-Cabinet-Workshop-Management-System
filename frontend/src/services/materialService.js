import api from './api';

const BASE = '/materials';

const materialService = {
  getAll: (query) => api.get(BASE + (query ? `?q=${query}` : '')).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  delete: (id) => api.delete(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  updateMinStock: (id, minLevel) => api.patch(`${BASE}/${id}/min-stock`, null, { params: { minLevel } }).then(res => res.data?.data ?? res.data),
};

export default materialService;
