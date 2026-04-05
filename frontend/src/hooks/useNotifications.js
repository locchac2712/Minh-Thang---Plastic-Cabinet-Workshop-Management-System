import { useState, useEffect, useCallback, useRef } from "react";
import notificationService from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

/**
 * useNotifications - Hook tùy chỉnh để quản lý thông báo (notifications)
 * Thay thế cho TanStack Query để gỡ bỏ phụ thuộc vào thư viện bên ngoài.
 */
export const useNotifications = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        
        try {
            // setLoading(true); // Thường không set loading cho polling ngầm để tránh flash UI
            const res = await notificationService.getNotifications();
            
            // Cấu trúc response từ service: { data: { notifications: [], unreadCount: 0 } }
            // Hoặc tùy thuộc vào cách service trả về, ở đây MainLayout dùng:
            // const notifications = notifData?.data?.notifications || [];
            // const unreadCount = notifData?.data?.unreadCount || 0;
            
            if (res && res.data) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            } else if (res) {
                // Fallback nếu res là trực tiếp object chứa data
                setNotifications(res.notifications || []);
                setUnreadCount(res.unreadCount || 0);
            }
            setError(null);
        } catch (err) {
            console.error("Lỗi khi tải thông báo:", err);
            setError(err.message || "Không thể tải thông báo");
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Lấy dữ liệu lần đầu ngay khi mount hoặc khi user thay đổi
    useEffect(() => {
        if (user) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user, fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            await fetchNotifications();
        } catch (err) {
            console.error("Lỗi khi đánh dấu đã đọc:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            await fetchNotifications();
        } catch (err) {
            console.error("Lỗi khi đánh dấu đọc tất cả:", err);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refetch: fetchNotifications,
        markAsRead,
        markAllAsRead
    };
};
