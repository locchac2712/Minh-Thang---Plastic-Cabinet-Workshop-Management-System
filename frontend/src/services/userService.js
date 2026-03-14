import api from './api';

const BASE = '/user';

const userService = {
  getAll: (params) => api.get(BASE, { params }).then(res => {
    const data = res.data?.data ?? res.data;
    return Array.isArray(data) ? data : [];
  }),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  toggleActive: (id) => api.put(`${BASE}/${id}/toggle`).then(res => res.data?.data ?? res.data),
  lock: (id) => api.put(`${BASE}/${id}/lock`).then(res => res.data?.data ?? res.data),
  unlock: (id) => api.put(`${BASE}/${id}/unlock`).then(res => res.data?.data ?? res.data),
  resetPassword: (id) => api.put(`${BASE}/reset-password-for-user/${id}`).then(res => res.data?.data ?? res.data),
};

export default userService;
