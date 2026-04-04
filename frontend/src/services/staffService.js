import api from "./api";

const staffService = {
    getAll: () => api.get("/staff").then(res => res.data?.data || [])
};

export default staffService;
