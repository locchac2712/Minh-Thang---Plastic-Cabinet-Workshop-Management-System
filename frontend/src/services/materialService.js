import api from "./api";

const BASE = "/materials";

// Backend entity field: name  ↔  Frontend display field: materialName
// Cũng map thêm: price, active
const toFrontend = (item) => {
    if (!item) return item;
    // Backend có thể trả về: name, materialName, hoặc cả hai
    const resolvedName = item.name ?? item.materialName ?? null;
    return {
        ...item,
        materialName: resolvedName,
        name: resolvedName,
    };
};

const toBackend = (form) => {
    const resolvedName = form.materialName ?? form.name ?? null;
    const { materialName, ...rest } = form;
    return {
        ...rest,
        name: resolvedName,
    };
};

const materialService = {
    getAll: () =>
        api.get(BASE).then((res) => {
            const body = res.data;
            let arr = [];
            if (Array.isArray(body))       arr = body;
            else if (Array.isArray(body?.data)) arr = body.data;
            return arr.map(toFrontend);
        }),

    getById: (id) =>
        api.get(`${BASE}/${id}`).then((res) => toFrontend(res.data?.data ?? res.data)),

    create: (payload) =>
        api.post(BASE, toBackend(payload)).then((res) => toFrontend(res.data?.data ?? res.data)),

    update: (id, payload) =>
        api.put(`${BASE}/${id}`, toBackend(payload)).then((res) => toFrontend(res.data?.data ?? res.data)),

    remove: (id) =>
        api.delete(`${BASE}/${id}`).then((res) => res.data),
};

export default materialService;