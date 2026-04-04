import axios from "axios";

// Notification API lives at /api/notifications (NOT /api/v1/notifications)
const notifApi = axios.create({
    baseURL: "http://localhost:8080",
    headers: { "Content-Type": "application/json" },
});

notifApi.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const notificationService = {
    getNotifications: async () => {
        const response = await notifApi.get('/api/notifications');
        return response.data;
    },
    
    markAsRead: async (id) => {
        const response = await notifApi.put(`/api/notifications/${id}/read`);
        return response.data;
    },
    
    markAllAsRead: async () => {
        const response = await notifApi.put('/api/notifications/read-all');
        return response.data;
    }
};

export default notificationService;
