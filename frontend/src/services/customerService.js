import api from "./api";

const customerService = {
    getAll: () =>
        api.get("/customers").then((res) => {
            const body = res.data;
            if (Array.isArray(body))       return body;
            if (Array.isArray(body?.data)) return body.data;
            // paginated
            if (body?.data?.content)       return body.data.content;
            return [];
        }),
};

export default customerService;