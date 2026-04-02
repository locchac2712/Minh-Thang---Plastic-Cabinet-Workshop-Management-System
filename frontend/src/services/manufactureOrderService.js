import api from "./api";

const BASE = "/manufacture-orders";

const manufactureOrderService = {
    getCalendar: () =>
        api.get(`${BASE}/calendar`).then((res) => {
            const body = res.data;
            if (Array.isArray(body)) return body;
            if (Array.isArray(body?.data)) return body.data;
            return [];
        }),

    create: (payload) =>
        api.post(`${BASE}/create`, payload).then((res) => res.data?.data ?? res.data),

    manualSchedule: (payload) =>
        api.post(`${BASE}/manual-schedule`, payload).then((res) => res.data?.data ?? res.data),
};

export default manufactureOrderService;
