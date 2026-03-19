import axios from "axios";

// Dùng cùng axios instance đã có JWT interceptor của project
// Nếu chưa có thì import axiosInstance từ file config của bạn
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
});

// Gắn JWT token tự động
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token"); // hoặc lấy từ context tuỳ project
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const paymentService = {
    /**
     * Tạo link thanh toán PayOS
     * @param {{ orderId, orderNumber, amount, paymentType, buyerName }} payload
     * @returns {{ checkoutUrl, qrCode, paymentLinkId, orderCode }}
     */
    createPayOSLink: async (payload) => {
        const res = await api.post("/api/payments/payos/create", payload);
        return res.data;
    },

    /**
     * Polling trạng thái thanh toán
     * @param {string} paymentLinkId
     * @returns {{ status: 'PENDING'|'PAID'|'CANCELLED'|'EXPIRED', amount, paidAt }}
     */
    checkPayOSStatus: async (paymentLinkId) => {
        const res = await api.get(`/api/payments/payos/status/${paymentLinkId}`);
        return res.data;
    },

    /**
     * Huỷ link thanh toán
     * @param {string} paymentLinkId
     */
    cancelPayOSLink: async (paymentLinkId) => {
        await api.post(`/api/payments/payos/cancel/${paymentLinkId}`);
    },
};

export default paymentService;