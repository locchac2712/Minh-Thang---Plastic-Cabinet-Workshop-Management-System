import { useApi } from "./useApi";
import quotationService from "../services/quotationService.js";

/**
 * useQuotations - Quản lý báo giá bản mở rộng với lọc phía Client (cho các trường Server chưa hỗ trợ).
 */
export const useQuotations = (params = {}) => {
    // Tạo một wrapper service để tích hợp logic lọc phía Client vào luồng chuẩn của useApi
    const filteredService = {
        ...quotationService,
        getAll: async (p) => {
            const {
                keyword, status,
                startDate, endDate, minAmount, maxAmount,
                page = 0, size = 10, sortBy, sortDir,
            } = p;

            const hasClientFilter = !!(startDate || endDate || minAmount !== undefined || maxAmount !== undefined);

            // Params gửi lên server (chỉ những gì backend hỗ trợ)
            const serverParams = { keyword, status, sortBy, sortDir };

            if (hasClientFilter) {
                // Khi cần lọc phía client, tải lượng lớn dữ liệu để lọc chính xác
                serverParams.page = 0;
                serverParams.size = 1000;
            } else {
                serverParams.page = page;
                serverParams.size = size;
            }

            const res = await quotationService.getAll(serverParams);
            let items = res?.content ?? (Array.isArray(res) ? res : []);

            if (hasClientFilter) {
                // Áp dụng filter phía client
                items = items.filter(q => {
                    if (startDate) {
                        const qDate = q.validUntil ? q.validUntil.split("T")[0] : null;
                        if (!qDate || qDate < startDate) return false;
                    }
                    if (endDate) {
                        const qDate = q.validUntil ? q.validUntil.split("T")[0] : null;
                        if (!qDate || qDate > endDate) return false;
                    }
                    const amt = Number(q.totalAmount) || 0;
                    if (minAmount !== undefined && amt < minAmount) return false;
                    if (maxAmount !== undefined && amt > maxAmount) return false;
                    return true;
                });

                const totalElements = items.length;
                const totalPages = Math.max(1, Math.ceil(totalElements / size));
                const start = page * size;
                return { 
                    content: items.slice(start, start + size), 
                    totalElements, 
                    totalPages 
                };
            }

            return res;
        }
    };

    const api = useApi(filteredService, { 
        initialParams: params,
        cacheKey: "QUOTATIONS" 
    });

    return { 
        items: api.items,
        data: api.data, 
        loading: api.loading, 
        error: api.error, 
        refetch: api.refetch, 
        create: api.create, 
        update: api.update,
        remove: api.remove 
    };
};