import api from "./api";

const BASE = "/quotations";

// QuotationRequest: { customerId, staffId, validUntil, note, items:[{productId, quantity, unitPrice, discountPercent}] }
// QuotationListResponse: { id, quotationNumber, customerName, staffName, totalAmount, status, createdDate, validUntil }
// QuotationDetailResponse: { id, quotationNumber, customer{}, staff{}, totalAmount, status, note, createdDate, validUntil, details[] }

const STATUS_LABEL = {
    DRAFT:    { text: "Nháp (Draft)",      cls: "sq-badge--draft"    },
    SENT:     { text: "Đã gửi (Sent)",     cls: "sq-badge--sent"     },
    ACCEPTED: { text: "Đã chốt (Accepted)",cls: "sq-badge--accepted" },
    REJECTED: { text: "Đã hủy (Rejected)", cls: "sq-badge--rejected" },
    EXPIRED:  { text: "Hết hạn (Expired)", cls: "sq-badge--expired"  },
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

    // POST /quotations/{id}/status?status=SENT
    updateStatus: (id, status) =>
        api.post(`${BASE}/${id}/status`, null, { params: { status } }).then((res) => res.data?.data ?? res.data),
};

export default quotationService;