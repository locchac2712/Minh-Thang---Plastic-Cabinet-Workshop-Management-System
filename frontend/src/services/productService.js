import api from './api';

const BASE = '/products';

const productService = {
  getAll: (query) => api.get(BASE + (query ? `?q=${query}` : '')).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  changeStatus: (id, status) => api.patch(`${BASE}/${id}/status`, null, { params: { status } }).then(res => res.data?.data ?? res.data),
  
  // Categories API
  getCategories: () => api.get(`${BASE}/categories`).then(res => res.data?.data ?? res.data),
  createCategory: (payload) => api.post(`${BASE}/categories`, payload).then(res => res.data?.data ?? res.data),
  updateCategory: (id, payload) => api.put(`${BASE}/categories/${id}`, payload).then(res => res.data?.data ?? res.data),
  deleteCategory: (id) => api.delete(`${BASE}/categories/${id}`).then(res => res.data?.data ?? res.data),
};

export default productService;
