import api from './api';

const BASE = '/roles';

const roleService = {
  getAll: () => api.get(BASE).then(res => res.data?.data ?? res.data),
  getUsersByRole: (role) => api.get(`${BASE}/${role}/users`).then(res => res.data?.data ?? res.data),
};

export default roleService;
