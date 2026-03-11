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
  changeStatus: (id, status) => api.patch(`/products/${id}/status`, null, { params: { status } }), // Changed from toggleActive
  // Categories API does not exist in backend currently, kept for frontend structural integrity but will 404
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
  delete: (id) => api.delete(`/suppliers/${id}`), // Removed toggleActive since BE doesn't support it
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
  delete: (id) => api.delete(`/materials/${id}`), // Added delete to match BE Controller
  updateMinStock: (id, minLevel) => api.patch(`/materials/${id}/min-stock`, null, { params: { minLevel } }) // Added this specifically from BE
};

export const bomApi = {
  getAll: () => api.get('/boms'),
  getById: (id) => api.get(`/boms/${id}`),
  create: (d) => api.post('/boms', d),
  update: (id, d) => api.put(`/boms/${id}`, d),
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
  getTransactions: (params) => api.get('/warehouse/exports', { params }), // Changed from /warehouse/transactions to /warehouse/exports based on backend WarehouseTransactionController
  stockIn: (d) => api.post('/warehouse/import', d),
  stockOut: (d) => api.post('/warehouse/export', d),
  adjust: (d) => api.post('/warehouse/adjustment', d), // Note: might not exist in backend?
  getInventory: (params) => api.get('/stock/inventory', { params }), // Note: check if this exists in backend
  getInventoryById: (id) => api.get(`/stock/inventory/${id}`),
};

export const stockCountApi = {
  getAll: () => api.get('/stock-counts'),
  getById: (id) => api.get(`/stock-counts/${id}`),
  create: (d) => api.post('/stock-counts', d),
  update: (id, d) => api.put(`/stock-counts/${id}`, d),
  complete: (id) => api.post(`/stock-counts/${id}/complete`), // Changed to POST matching BE
};

export const userApi = {
  getAll: (params) => api.get('/user', { params }), // Changed from /users to /user
  getById: (id) => api.get(`/user/${id}`),
  create: (d) => api.post('/user', d),
  update: (id, d) => api.put(`/user/${id}`, d),
  toggleActive: (id) => api.put(`/user/${id}/toggle`), // Note: Backend does not have /toggle for user yet, maybe it should be manual?
  resetPassword: (id) => api.put(`/user/${id}/reset-password`),
};

export const profileApi = {
  get: () => api.get('/user/profile'), // Changed from /profile to /user/profile
  update: (d) => api.put('/user/profile', d),
  changePassword: (d) => api.put('/user/profile/password', d), // Note: backend doesn't have a specific password endpoint, maybe handled by PUT /user/profile
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
