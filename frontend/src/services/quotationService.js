import api from "./api";

const BASE = "/quotations";

// QuotationRequest: { customerId, staffId, validUntil, note, items:[{productId, quantity, unitPrice, discountPercent}] }
// QuotationListResponse: { id, quotationNumber, customerName, staffName, totalAmount, status, createdDate, validUntil }
// QuotationDetailResponse: { id, quotationNumber, customer{}, staff{}, totalAmount, status, note, createdDate, validUntil, details[] }

const STATUS_LABEL = {
    DRAFT:    { text: "Bản nháp", color: "#64748b" },
    WAITING_APPROVAL: { text: "Chờ duyệt", color: "#f59e0b" },
    APPROVED: { text: "Đã duyệt", color: "#10b981" },
    REJECTED: { text: "Từ chối duyệt", color: "#ef4444" },
    ACCEPTED: { text: "Chấp thuận", color: "#8b5cf6" },
    CANCELLED: { text: "Hủy", color: "#94a3b8" },
    EXPIRED:  { text: "Hết hạn", color: "#4b5563" },
};

export const getQuoteStatus = (status) =>
    STATUS_LABEL[status] || { text: status, cls: "" };

const quotationService = {
    // GET /quotations?keyword=&status=&page=0&size=10&sortBy=createdDate&sortDir=desc
    getAll: (params = {}) =>
        api.get(BASE, { params }).then((res) => res.data?.data ?? res.data),

    // GET /quotations/{id}
    getById: (id) =>
        api.get(`${BASE}/${id}`).then((res) => res.data?.data ?? res.data),

    // POST /quotations/create
    create: (payload) =>
        api.post(`${BASE}/create`, payload).then((res) => res.data?.data ?? res.data),

    // PUT /quotations/{id}/update
    update: (id, payload) =>
        api.put(`${BASE}/${id}/update`, payload).then((res) => res.data?.data ?? res.data),

    // PUT /quotations/{id}/status?status=SENT&reason=...
    updateStatus: (id, status, reason) =>
        api.put(`${BASE}/${id}/status`, null, { params: { status, reason } }).then((res) => res.data?.data ?? res.data),
};

export default quotationService;