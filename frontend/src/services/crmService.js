import api from "./api";

const BASE_CRM = "/crm";

const crmService = {
    // Thống kê Dashboard
    getDashboardStats: (month, year) => 
        api.get(`${BASE_CRM}/dashboard/stats`, { params: { month, year } })
           .then(res => res.data?.data),

    // Danh sách tương tác theo khách hàng
    getInteractions: (customerId) =>
        api.get(`${BASE_CRM}/interactions/customer/${customerId}`)
           .then(res => res.data?.data || []),

    // Thêm tương tác/nhắc hẹn mới
    addInteraction: (payload) =>
        api.post(`${BASE_CRM}/interactions`, payload)
           .then(res => res.data?.data),

    // Lấy nhắc hẹn đang chờ
    getPendingReminders: () =>
        api.get(`${BASE_CRM}/interactions/reminders/my-pending`)
           .then(res => res.data?.data || []),

    // Đánh dấu đã xử lý nhắc hẹn
    resolveReminder: (id) =>
        api.patch(`${BASE_CRM}/interactions/${id}/resolve`)
           .then(res => res.data),

    // Lấy các ghi chú tương tác gần đây (Tất cả ghi chú Timeline)
    getRecentNotes: () =>
        api.get(`${BASE_CRM}/interactions/notes/recent`)
           .then(res => res.data?.data || []),

    // Lấy lịch sử giao dịch (Payment)
    getTransactions: (customerId) =>
        api.get(`/customers/${customerId}/payments`)
           .then(res => res.data?.data || [])
};

export default crmService;
