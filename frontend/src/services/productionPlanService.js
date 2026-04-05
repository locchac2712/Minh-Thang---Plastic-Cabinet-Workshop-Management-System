import api from "./api";

const BASE = "/production-plans";

const productionPlanService = {
    getAll: () =>
        api.get(BASE).then((res) => {
            const body = res.data;
            if (Array.isArray(body)) return body;
            if (Array.isArray(body?.data)) return body.data;
            return [];
        }),

    getById: (id) =>
        api.get(`${BASE}/${id}`).then((res) => res.data?.data ?? res.data),

    // Generate plans from sales order
    generate: (salesOrderId, payload) =>
        api.post(`${BASE}/generate`, payload, { params: { salesOrderId } }).then((res) => res.data?.data ?? res.data),

    // Update status of a work order within a plan
    updateWorkOrderStatus: (moId, status) =>
        api.patch(`${BASE}/work-orders/${moId}/status`, null, { params: { status } }).then((res) => res.data),
};

export default productionPlanService;
