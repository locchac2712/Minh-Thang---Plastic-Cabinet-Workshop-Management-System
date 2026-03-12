import api from './api';

const BASE = '/approvals';

const approvalService = {
  getAll: (status) => api.get(BASE + (status ? `?status=${status}` : '')).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  approve: (id, payload) => api.put(`${BASE}/${id}/approve`, payload).then(res => res.data?.data ?? res.data),
  reject: (id, payload) => api.put(`${BASE}/${id}/reject`, payload).then(res => res.data?.data ?? res.data),
};

export default approvalService;
