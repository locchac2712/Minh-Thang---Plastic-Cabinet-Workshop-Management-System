import api from "./api";

const BASE = "/quotations";

// QuotationRequest: { customerId, staffId, validUntil, note, items:[{productId, quantity, unitPrice, discountPercent}] }
// QuotationListResponse: { id, quotationNumber, customerName, staffName, totalAmount, status, createdDate, validUntil }
// QuotationDetailResponse: { id, quotationNumber, customer{}, staff{}, totalAmount, status, note, createdDate, validUntil, details[] }

const STATUS_LABEL = {
    DRAFT:    { text: "Nh??p (Draft)",      cls: "sq-badge--draft"    },
    SENT:     { text: "???? g???i (Sent)",     cls: "sq-badge--sent"     },
    ACCEPTED: { text: "???? ch???t (Accepted)",cls: "sq-badge--accepted" },
    REJECTED: { text: "???? h???y (Rejected)", cls: "sq-badge--rejected" },
    EXPIRED:  { text: "H???t h???n (Expired)", cls: "sq-badge--expired"  },
};

export const getQuoteStatus = (status) =>
    STATUS_LABEL[status] || { text: status, cls: "" };

const quotationService = {
    // GET /quotations?keyword=&status=&page=0&size=10&sortBy=createdDate&sortDir=desc
    // Trả về { content, totalPages, totalElements, number, size }
    getAll: (params = {}) =>
        api.get(BASE, { params }).then((res) => {
            const pageData = res.data.data;
            // Nếu BE trả về Page object (có content), giữ nguyên; nếu là mảng thì wrap lại
            if (pageData && Array.isArray(pageData.content)) {
                return pageData; // { content, totalPages, totalElements, number, size, ... }
            }
            // fallback: trả về dạng Page giả lập
            const items = Array.isArray(pageData) ? pageData : [];
            return { content: items, totalPages: 1, totalElements: items.length, number: 0, size: items.length };
        }),

    // GET /quotations/{id}
    getById: (id) =>
        api.get(`${BASE}/${id}`).then((res) => res.data.data || res.data),

    // POST /quotations/create
    create: (payload) =>
        api.post(`${BASE}/create`, payload).then((res) => res.data.data || res.data),

    // PUT /quotations/{id}/update
    update: (id, payload) =>
        api.put(`${BASE}/${id}/update`, payload).then((res) => res.data.data || res.data),

    // POST /quotations/{id}/status?status=SENT
    updateStatus: (id, status) =>
        api.post(`${BASE}/${id}/status`, null, { params: { status } }).then((res) => res.data.data || res.data),

    getStatus: getQuoteStatus,
};

export default quotationService;