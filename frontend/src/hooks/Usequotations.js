import { useState, useMemo } from "react";
import { useApi } from "./useApi";
import quotationService from "../services/quotationService.js";

/**
 * useQuotations - Quản lý báo giá bản mở rộng với lọc phía Client (cho các trường Server chưa hỗ trợ).
 */
export const useQuotations = (params = {}) => {
    // Tạo một wrapper service để tích hợp logic lọc phía Client vào luồng chuẩn của useApi
    const filteredService = useMemo(() => ({
        ...quotationService,
        getAll: async (p) => {
            const {
                keyword, status, customerId,
                startDate, endDate, minAmount, maxAmount,
                page = 0, size = 10, 
                sortBy = 'createdDate', sortDir = 'desc',
            } = p;

            const hasClientPriceFilter = !!(minAmount !== undefined || maxAmount !== undefined);

            // Params gửi lên server
            const serverParams = { 
                keyword, status, customerId, 
                startDate, endDate, 
                sortBy, sortDir 
            };

            if (hasClientPriceFilter) {
                // Chỉ lọc giá ở client vì server chưa hỗ trợ (có thể nâng cấp sau)
                serverParams.page = 0;
                serverParams.size = 200;
            } else {
                serverParams.page = page;
                serverParams.size = size;
            }

            const res = await quotationService.getAll(serverParams);
            let items = res?.content ?? (Array.isArray(res) ? res : []);

            if (hasClientPriceFilter) {
                // Áp dụng filter giá phía client
                items = items.filter(q => {
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
    }), []);

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