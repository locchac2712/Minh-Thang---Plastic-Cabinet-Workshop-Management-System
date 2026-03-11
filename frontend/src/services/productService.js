import api from "./api";

const BASE = "/products";

// Product entity fields: name, sku, sellingPrice, currentStock, unit, description, status
// ProductStatus enum: DRAFT, ACTIVE, INACTIVE, DEACTIVATED

const productService = {
    getAll: () =>
        api.get(BASE).then((res) => {
            const body = res.data;
            if (Array.isArray(body))            return body;
            if (Array.isArray(body?.data))      return body.data;
            return [];
        }),

    getById: (id) =>
        api.get(`${BASE}/${id}`).then((res) => res.data?.data ?? res.data),

    create: (payload) =>
        api.post(BASE, payload).then((res) => res.data?.data ?? res.data),

    update: (id, payload) =>
        api.put(`${BASE}/${id}`, payload).then((res) => res.data?.data ?? res.data),

    changeStatus: (id, status) =>
        api.patch(`${BASE}/${id}/status`, null, { params: { status } }).then((res) => res.data),
};

export default productService;