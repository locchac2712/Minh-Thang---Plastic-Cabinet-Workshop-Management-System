import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token'); localStorage.removeItem('user');
      sessionStorage.removeItem('token'); sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (d) => api.post('/auth/login', d),
  forgotPassword: (d) => api.post('/auth/forgot-password', d),
  resetPassword: (d) => api.post('/auth/reset-password', d),
  validateToken: (t) => api.get(`/auth/validate-token?token=${t}`),
};

export const productApi = {
  getAll: (q) => api.get('/products' + (q ? `?q=${q}` : '')),
  getById: (id) => api.get(`/products/${id}`),
  create: (d) => api.post('/products', d),
  update: (id, d) => api.put(`/products/${id}`, d),
  toggleActive: (id) => api.put(`/products/${id}/toggle`),
  getCategories: () => api.get('/products/categories'),
  createCategory: (d) => api.post('/products/categories', d),
  updateCategory: (id, d) => api.put(`/products/categories/${id}`, d),
  deleteCategory: (id) => api.delete(`/products/categories/${id}`),
};

export const supplierApi = {
  getAll: (q) => api.get('/suppliers' + (q ? `?q=${q}` : '')),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (d) => api.post('/suppliers', d),
  update: (id, d) => api.put(`/suppliers/${id}`, d),
  toggleActive: (id) => api.put(`/suppliers/${id}/toggle`),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

export const warehouseApi = {
  getAll: (q) => api.get('/warehouses' + (q ? `?q=${q}` : '')),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (d) => api.post('/warehouses', d),
  update: (id, d) => api.put(`/warehouses/${id}`, d),
  toggleActive: (id) => api.put(`/warehouses/${id}/toggle`),
};

export const materialApi = {
  getAll: (q) => api.get('/materials' + (q ? `?q=${q}` : '')),
  getById: (id) => api.get(`/materials/${id}`),
  create: (d) => api.post('/materials', d),
  update: (id, d) => api.put(`/materials/${id}`, d),
  toggleActive: (id) => api.put(`/materials/${id}/toggle`),
};

export const bomApi = {
  getAll: () => api.get('/boms'),
  getById: (id) => api.get(`/boms/${id}`),
  create: (d) => api.post('/boms', d),
  update: (id, d) => api.put(`/boms/${id}`, d),
  changeStatus: (id, status) => api.put(`/boms/${id}/status`, { status }),
  addItem: (id, d) => api.post(`/boms/${id}/items`, d),
  removeItem: (itemId) => api.delete(`/boms/items/${itemId}`),
};

export const approvalApi = {
  getAll: (status) => api.get('/approvals' + (status ? `?status=${status}` : '')),
  getById: (id) => api.get(`/approvals/${id}`),
  create: (d) => api.post('/approvals', d),
  approve: (id, d) => api.put(`/approvals/${id}/approve`, d),
  reject: (id, d) => api.put(`/approvals/${id}/reject`, d),
};

export const roleApi = {
  getAll: () => api.get('/roles'),
  getUsersByRole: (role) => api.get(`/roles/${role}/users`),
};

export const customerApi = {
  getAll: (q) => api.get('/customers' + (q ? `?q=${q}` : '')),
  getById: (id) => api.get(`/customers/${id}`),
  create: (d) => api.post('/customers', d),
  update: (id, d) => api.put(`/customers/${id}`, d),
  toggleActive: (id) => api.put(`/customers/${id}/toggle`),
};

export const quotationApi = {
  getAll: (params) => api.get('/quotations', { params }),
  getById: (id) => api.get(`/quotations/${id}`),
  create: (d) => api.post('/quotations', d),
  update: (id, d) => api.put(`/quotations/${id}`, d),
  changeStatus: (id, status) => api.put(`/quotations/${id}/status`, { status }),
  getHistory: (customerId) => api.get(`/quotations/history/${customerId}`),
};

export const salesOrderApi = {
  getAll: (params) => api.get('/sales-orders', { params }),
  getById: (id) => api.get(`/sales-orders/${id}`),
  create: (d) => api.post('/sales-orders', d),
  update: (id, d) => api.put(`/sales-orders/${id}`, d),
  changeStatus: (id, status) => api.put(`/sales-orders/${id}/status`, { status }),
  getPayments: (id) => api.get(`/sales-orders/${id}/payments`),
  addPayment: (id, d) => api.post(`/sales-orders/${id}/payments`, d),
};

export const productionOrderApi = {
  getAll: (params) => api.get('/production-orders', { params }),
  getById: (id) => api.get(`/production-orders/${id}`),
  create: (d) => api.post('/production-orders', d),
  update: (id, d) => api.put(`/production-orders/${id}`, d),
  changeStatus: (id, status) => api.put(`/production-orders/${id}/status`, { status }),
  updateProgress: (id, d) => api.put(`/production-orders/${id}/progress`, d),
};

export const workOrderApi = {
  getAll: (params) => api.get('/work-orders', { params }),
  getById: (id) => api.get(`/work-orders/${id}`),
  create: (d) => api.post('/work-orders', d),
  update: (id, d) => api.put(`/work-orders/${id}`, d),
  changeStatus: (id, status) => api.put(`/work-orders/${id}/status`, { status }),
  updateProgress: (id, d) => api.put(`/work-orders/${id}/progress`, d),
};

export const stockApi = {
  getTransactions: (params) => api.get('/warehouse/transactions', { params }),
  stockIn: (d) => api.post('/warehouse/import', d),
  stockOut: (d) => api.post('/warehouse/export', d),
  adjust: (d) => api.post('/warehouse/adjustment', d),
  getInventory: (params) => api.get('/stock/inventory', { params }),
  getInventoryById: (id) => api.get(`/stock/inventory/${id}`),
};

export const stockCountApi = {
  getAll: () => api.get('/stock-counts'),
  getById: (id) => api.get(`/stock-counts/${id}`),
  create: (d) => api.post('/stock-counts', d),
  update: (id, d) => api.put(`/stock-counts/${id}`, d),
  complete: (id) => api.put(`/stock-counts/${id}/complete`),
};

export const userApi = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (d) => api.post('/users', d),
  update: (id, d) => api.put(`/users/${id}`, d),
  toggleActive: (id) => api.put(`/users/${id}/toggle`),
  resetPassword: (id) => api.put(`/users/${id}/reset-password`),
};

export const profileApi = {
  get: () => api.get('/profile'),
  update: (d) => api.put('/profile', d),
  changePassword: (d) => api.put('/profile/password', d),
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getMonitoring: () => api.get('/dashboard/monitoring'),
  getSalesStaff: () => api.get('/dashboard/sales-staff'),
  getSalesManager: () => api.get('/dashboard/sales-manager'),
  getProduction: () => api.get('/dashboard/production'),
  getWarehouse: () => api.get('/dashboard/warehouse'),
};

export default api;
