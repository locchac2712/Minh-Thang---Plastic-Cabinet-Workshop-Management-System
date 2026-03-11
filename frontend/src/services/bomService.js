import api from "./api";

const BASE = "/boms";

// Status logic từ isApproved + isActive:
// isActive=false                  → Ngừng dùng
// isActive=true, isApproved=false → Chờ duyệt
// isActive=true, isApproved=true  → Đang dùng

export const getStatusInfo = (bom) => {
    if (!bom?.isActive)  return { text: "Ngừng dùng", cls: "bom-status--inactive" };
    if (bom?.isApproved) return { text: "Đang dùng",  cls: "bom-status--active"   };
    return                      { text: "Chờ duyệt",  cls: "bom-status--pending"  };
};

const bomService = {
    getAll: () =>
        api.get(BASE).then((res) => {
            const body = res.data;
            if (Array.isArray(body))       return body;
            if (Array.isArray(body?.data)) return body.data;
            return [];
        }),

    // Returns BomDetailViewResponse: { id, version, productId, productName, productSku, isApproved, isActive, details[] }
    getById: (id) =>
        api.get(`${BASE}/${id}`).then((res) => res.data?.data ?? res.data),

    // POST body: { productId, version, details: [{materialId, quantityRequired}] }
    create: (payload) =>
        api.post(BASE, payload).then((res) => res.data?.data ?? res.data),

    // PUT body: { version, isActive, details: [{materialId, quantityRequired}] }
    update: (id, payload) =>
        api.put(`${BASE}/${id}`, payload).then((res) => res.data?.data ?? res.data),
};

export default bomService;