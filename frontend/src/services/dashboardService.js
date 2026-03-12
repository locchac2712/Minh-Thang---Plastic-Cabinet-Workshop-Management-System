import api from './api';

const BASE = '/dashboard';

const dashboardService = {
  getStats: () => api.get(`${BASE}/stats`).then(res => res.data?.data ?? res.data),
  getMonitoring: () => api.get(`${BASE}/monitoring`).then(res => res.data?.data ?? res.data),
  getSalesStaff: () => api.get(`${BASE}/sales-staff`).then(res => res.data?.data ?? res.data),
  getSalesManager: () => api.get(`${BASE}/sales-manager`).then(res => res.data?.data ?? res.data),
  getProduction: () => api.get(`${BASE}/production`).then(res => res.data?.data ?? res.data),
  getWarehouse: () => api.get(`${BASE}/warehouse`).then(res => res.data?.data ?? res.data),
};

export default dashboardService;
