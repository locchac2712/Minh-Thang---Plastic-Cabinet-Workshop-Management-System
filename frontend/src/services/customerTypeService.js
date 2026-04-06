import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/customer-types';

const customerTypeService = {
    getAll: async () => {
        const res = await axios.get(API_URL);
        return res.data;
    },
    create: async (data, token) => {
        const res = await axios.post(API_URL, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },
    update: async (id, data, token) => {
        const res = await axios.put(`${API_URL}/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },
    delete: async (id, token) => {
        await axios.delete(`${API_URL}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
};

export default customerTypeService;
