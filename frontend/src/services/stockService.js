import api from './api';

const stockService = {
  getTransactions: (params) => api.get('/warehouse/exports', { params }).then(res => res.data?.data ?? res.data),
  stockIn: (payload) => api.post('/warehouse/import', payload).then(res => res.data?.data ?? res.data),
  stockOut: (payload) => api.post('/warehouse/export', payload).then(res => res.data?.data ?? res.data),
  adjust: (payload) => api.post('/warehouse/adjustment', payload).then(res => res.data?.data ?? res.data),
  getInventory: (params) => api.get('/stock/inventory', { params }).then(res => res.data?.data ?? res.data),
  getInventoryById: (id) => api.get(`/stock/inventory/${id}`).then(res => res.data?.data ?? res.data),
};

export default stockService;
