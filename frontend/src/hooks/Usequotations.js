import { useState, useEffect, useCallback } from "react";
import quotationService from "../services/quotationService.js";

export const useQuotations = (params = {}) => {
    const [data,    setData]    = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    // Tách params: server chỉ nhận keyword, status, page, size, sortBy, sortDir
    // startDate, endDate, minAmount, maxAmount phải filter phía client
    const {
        keyword, status,
        startDate, endDate, minAmount, maxAmount,
        page = 0, size = 10, sortBy, sortDir,
    } = params;

    const hasClientFilter = !!(startDate || endDate || minAmount !== undefined || maxAmount !== undefined);

    const fetchAll = useCallback(async () => {
        if (!localStorage.getItem("token")) return;
        setLoading(true); setError(null);
        try {
            // Params gửi lên server (chỉ những gì backend hỗ trợ)
            const serverParams = {};
            if (keyword) serverParams.keyword = keyword;
            if (status) serverParams.status = status;
            if (sortBy) serverParams.sortBy = sortBy;
            if (sortDir) serverParams.sortDir = sortDir;

            if (hasClientFilter) {
                // Khi có filter client-side, load nhiều data hơn để lọc
                serverParams.page = 0;
                serverParams.size = 1000;
            } else {
                serverParams.page = page;
                serverParams.size = size;
            }

            const res = await quotationService.getAll(serverParams);
            let items = res?.content ?? (Array.isArray(res) ? res : []);

            // Áp dụng filter phía client
            if (hasClientFilter) {
                items = items.filter(q => {
                    // Lọc theo ngày (validUntil)
                    if (startDate) {
                        const qDate = q.validUntil ? q.validUntil.split("T")[0] : null;
                        if (!qDate || qDate < startDate) return false;
                    }
                    if (endDate) {
                        const qDate = q.validUntil ? q.validUntil.split("T")[0] : null;
                        if (!qDate || qDate > endDate) return false;
                    }
                    // Lọc theo giá trị
                    const amt = Number(q.totalAmount) || 0;
                    if (minAmount !== undefined && amt < minAmount) return false;
                    if (maxAmount !== undefined && amt > maxAmount) return false;
                    return true;
                });

                // Phân trang phía client
                const totalElements = items.length;
                const totalPages = Math.max(1, Math.ceil(totalElements / size));
                const start = page * size;
                const paginatedItems = items.slice(start, start + size);

                setData({ content: paginatedItems, totalElements, totalPages });
            } else {
                if (res?.content) setData(res);
                else setData({ content: items, totalElements: 0, totalPages: 0 });
            }
        } catch (e) {
            setError(e.response?.data?.message || "Không thể tải dữ liệu");
        } finally { setLoading(false); }
    }, [JSON.stringify(params)]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return { data, loading, error, refetch: fetchAll };
};