import api from './api';

const authService = {
  login: (payload) => api.post('/auth/login', payload).then(res => res.data?.data ?? res.data),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload).then(res => res.data?.data ?? res.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then(res => res.data?.data ?? res.data),
  validateToken: (token) => api.get(`/auth/validate-token?token=${token}`).then(res => res.data?.data ?? res.data),
};

export default authService;
