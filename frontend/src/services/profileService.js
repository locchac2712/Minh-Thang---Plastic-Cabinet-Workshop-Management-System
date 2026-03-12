import api from './api';

const BASE = '/user/profile';

const profileService = {
  get: () => api.get(BASE).then(res => res.data?.data ?? res.data),
  update: (payload) => api.put(BASE, payload).then(res => res.data?.data ?? res.data),
  changePassword: (payload) => api.put(`${BASE}/password`, payload).then(res => res.data?.data ?? res.data),
};

export default profileService;
