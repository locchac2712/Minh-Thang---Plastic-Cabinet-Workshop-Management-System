import api from "./api";

const BASE = "/sales-orders";

// SalesOrderListResponse fields: id, orderNumber, customerName, totalAmount, status, paymentStatus, createdDate
// SalesOrderDetailResponse fields: id, orderNumber, quotationId, quotationNumber, customer{}, totalAmount, status, paymentStatus, createdDate, details[]

export const ORDER_STATUS_MAP = {
    PENDING:    { text: "Chờ xác nhận",  cls: "so-badge--pending"    },
    PROCESSING: { text: "Đang xử lý",    cls: "so-badge--producing"  },
    DELIVERED:  { text: "Đã giao",       cls: "so-badge--delivered"  },
    CANCELLED:  { text: "Đã hủy",        cls: "so-badge--cancelled"  },
};

export const PAYMENT_STATUS_MAP = {
    UNPAID:  { text: "Chưa thanh toán",      cls: "so-badge--pending"   },
    PARTIAL: { text: "Thanh toán một phần",  cls: "so-badge--producing" },
    PAID:    { text: "Đã thanh toán",        cls: "so-badge--delivered" },
};

const salesOrderService = {
    // GET /sales-orders?keyword=&status=&paymentStatus=&page=0&size=10
    getAll: (params = {}) =>
        api.get(BASE, { params }).then((res) => res.data?.data ?? res.data),

    // GET /sales-orders/{id}
    getById: (id) =>
        api.get(`${BASE}/${id}`).then((res) => res.data?.data ?? res.data),

    processApproval: (id, payload) =>
        api.put(`${BASE}/${id}/approval`, payload).then((res) => res.data?.data ?? res.data),
};

export default salesOrderService;