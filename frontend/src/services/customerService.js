import api from "./api";

const BASE = "/customers";

const customerService = {
    getAll: (active) =>
        api.get(BASE, { params: { active } }).then((res) => {
            const body = res.data;
            if (Array.isArray(body))       return body;
            if (Array.isArray(body?.data)) return body.data;
            // paginated
            if (body?.data?.content)       return body.data.content;
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

export default customerService;