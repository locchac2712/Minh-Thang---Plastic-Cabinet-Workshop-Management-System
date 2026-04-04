import { useState, useEffect, useCallback } from "react";

// ── BỘ NHỚ ĐỆM TRONG RAM ───────────────────────────────────────
// Lưu trữ dữ liệu theo cacheKey để hiển thị tức thì khi quay lại trang.
const apiCache = {};

// Lắng nghe sự kiện đăng xuất để xóa bộ nhớ đệm (bảo mật)
window.addEventListener("auth-change", () => {
    if (!localStorage.getItem("token")) {
        Object.keys(apiCache).forEach(key => delete apiCache[key]);
    }
});

/**
 * useApi - Một hook dùng chung để xử lý logic CRUD (Lấy, Thêm, Sửa, Xóa) cho các tài nguyên.
 * 
 * @param {Object} service - Đối tượng service chứa các phương thức getAll, create, update, delete (tùy chọn).
 * @param {Object} options - Các tùy chọn bổ sung (initialParams, onFetchSuccess, v.v.).
 */
export const useApi = (service, options = {}) => {
    const { 
        initialParams = {}, 
        onFetchSuccess, 
        autoFetch = true,
        cacheKey = null // Khóa định danh cho bộ nhớ đệm (VD: 'CUSTOMERS')
    } = options;

    const [data,    setData]    = useState(() => {
        // Khởi tạo từ cache nếu có để hiện ngay lập tức
        if (cacheKey && apiCache[cacheKey]) return apiCache[cacheKey];
        return { content: [], totalElements: 0, totalPages: 0 };
    });

    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    // 1. Fetch dữ liệu
    const fetchItems = useCallback(async (params) => {
        const token = localStorage.getItem("token");
        if (!token) { 
            setLoading(false);
            return; 
        }

        // CHỈ set loading = true nếu chưa có dữ liệu trong cache để tránh hiện Spinner chặn trang
        if (!cacheKey || !apiCache[cacheKey]) {
            setLoading(true); 
        }
        
        setError(null);
        try {
            const fetchParams = params !== undefined ? params : initialParams;
            const res = await service.getAll(fetchParams);
            
            // Chuẩn hóa dữ liệu: hỗ trợ cả phân trang {content, ...} và mảng đơn []
            const normalizedData = res?.content 
                ? res 
                : { 
                    content: Array.isArray(res) ? res : [], 
                    totalElements: res?.totalElements ?? (Array.isArray(res) ? res.length : 0), 
                    totalPages: res?.totalPages ?? 1 
                  };
            
            // Cập nhật vào cache
            if (cacheKey) apiCache[cacheKey] = normalizedData;
            
            setData(normalizedData);
            onFetchSuccess?.(normalizedData);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) setError("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
            else if (status === 403) setError("Bạn không có quyền thực hiện thao tác này.");
            else setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally { 
            setLoading(false); 
        }
    }, [service, JSON.stringify(initialParams), cacheKey]);

    // Tự động fetch lần đầu và khi auth thay đổi
    useEffect(() => {
        if (autoFetch) {
            fetchItems();
        }
        const handler = () => { 
            if (autoFetch && localStorage.getItem("token")) fetchItems(); 
        };
        window.addEventListener("auth-change", handler);
        return () => window.removeEventListener("auth-change", handler);
    }, [fetchItems, autoFetch]);

    // 2. Tạo mới
    const create = async (payload) => {
        setLoading(true);
        try {
            const newItem = await service.create(payload);
            setData(prev => ({ 
                ...prev, 
                content: [newItem, ...prev.content],
                totalElements: (prev.totalElements || 0) + 1
            }));
            return newItem;
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi tạo mới");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 3. Cập nhật
    const update = async (id, payload) => {
        setLoading(true);
        try {
            const updatedItem = await service.update(id, payload);
            setData(prev => ({
                ...prev,
                content: prev.content.map(item => (item.id === id ? updatedItem : item))
            }));
            return updatedItem;
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi cập nhật");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // 4. Xóa
    const remove = async (id) => {
        const deleteFn = service.delete || service.remove;
        if (!deleteFn) {
            console.warn("Service không hỗ trợ phương thức delete hoặc remove");
            return;
        }
        setLoading(true);
        try {
            await deleteFn(id);
            setData(prev => ({
                ...prev,
                content: prev.content.filter(item => item.id !== id),
                totalElements: Math.max(0, (prev.totalElements || 0) - 1)
            }));
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi xóa");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return { 
        data, 
        items: data.content, 
        loading, 
        error, 
        setError,
        setData, // Export để component có thể can thiệp thủ công nếu cần
        refetch: fetchItems, 
        create, 
        update, 
        remove 
    };
};
