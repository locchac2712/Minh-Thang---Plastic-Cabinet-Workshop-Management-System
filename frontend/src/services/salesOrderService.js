import api from './api';

const BASE = '/sales-orders';

export const ORDER_STATUS_MAP = {
  PENDING:   { text: "Chờ xử lý",    cls: "so-badge--pending" },
  CONFIRMED: { text: "Đã xác nhận",   cls: "so-badge--confirmed" },
  PRODUCING: { text: "Đang sản xuất",  cls: "so-badge--producing" },
  READY:     { text: "Sẵn sàng giao", cls: "so-badge--ready" },
  DELIVERED: { text: "Đã giao hàng",   cls: "so-badge--delivered" },
  CANCELLED: { text: "Đã hủy",        cls: "so-badge--cancelled" },
};

export const PAYMENT_STATUS_MAP = {
  UNPAID:  { text: "Chưa thanh toán",     cls: "so-badge--cancelled" },
  PARTIAL: { text: "Thanh toán một phần", cls: "so-badge--pending" },
  PAID:    { text: "Đã thanh toán",       cls: "so-badge--delivered" },
};

const salesOrderService = {
  getAll: (params) => api.get(BASE, { params }).then(res => res.data?.data ?? res.data),
  getById: (id) => api.get(`${BASE}/${id}`).then(res => res.data?.data ?? res.data),
  create: (payload) => api.post(BASE, payload).then(res => res.data?.data ?? res.data),
  update: (id, payload) => api.put(`${BASE}/${id}`, payload).then(res => res.data?.data ?? res.data),
  changeStatus: (id, status) => api.put(`${BASE}/${id}/status`, { status }).then(res => res.data?.data ?? res.data),
  getPayments: (id) => api.get(`${BASE}/${id}/payments`).then(res => res.data?.data ?? res.data),
  addPayment: (id, payload) => api.post(`${BASE}/${id}/payments`, payload).then(res => res.data?.data ?? res.data),
};

export default salesOrderService;
