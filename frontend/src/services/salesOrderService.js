import api from "./api";

const BASE = "/sales-orders";

export const ORDER_STATUS_MAP = {
    // Trạng thái gốc
    PENDING:             { text: "Chờ xác nhận",       cls: "so-badge--pending"    },
    PROCESSING:          { text: "Đang xử lý",         cls: "so-badge--producing"  },
    DELIVERED:           { text: "Đã giao",             cls: "so-badge--delivered"  },
    CANCELLED:           { text: "Đã hủy",              cls: "so-badge--cancelled"  },

    // Trạng thái từ credit check
    PENDING_APPROVAL:    { text: "Chờ phê duyệt",      cls: "so-badge--approval"   },
    WAITING_FOR_DEPOSIT: { text: "Chờ đặt cọc",        cls: "so-badge--deposit"    },
};

export const PAYMENT_STATUS_MAP = {
    UNPAID:  { text: "Chưa thanh toán",     cls: "so-badge--pending"   },
    PARTIAL: { text: "Thanh toán một phần", cls: "so-badge--producing" },
    PAID:    { text: "Đã thanh toán",       cls: "so-badge--delivered" },
};

const salesOrderService = {
    getAll: (params = {}) =>
        api.get(BASE, { params })
            .then((res) => res.data?.data ?? res.data),

    getById: (id) =>
        api.get(`${BASE}/${id}`)
            .then((res) => res.data?.data ?? res.data),

    processApproval: (id, payload) =>
        api.put(`${BASE}/${id}/approval`, payload)
            .then((res) => res.data?.data ?? res.data),

    getPaymentHistory: (id) => {
        return api.get(`${BASE}/${id}/payments`)
            .then(res => res.data.data);
    },
    updatePriority: (id, data) => {

        return api.patch(`${BASE}/${id}/priority`, data)
            .then(res => res.data?.data ?? res.data);
    },
};

export default salesOrderService;