import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8080/api/v1",
    headers: { "Content-Type": "application/json" },
});

// Tự động gắn Bearer token nếu có
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// KHÔNG auto-reload khi 401 — để component tự xử lý
api.interceptors.response.use(
    (res) => res,
    (error) => Promise.reject(error)
);

export default api;