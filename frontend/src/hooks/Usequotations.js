import { useState, useEffect, useCallback } from "react";
import quotationService from "../services/quotationService.js";

export const useQuotations = (params = {}) => {
    const [data,    setData]    = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    const fetchAll = useCallback(async () => {
        if (!localStorage.getItem("token")) return;
        setLoading(true); setError(null);
        try {
            const res = await quotationService.getAll(params);
            // Response là Page object: { content, totalElements, totalPages, ... }
            if (res?.content) setData(res);
            else setData({ content: Array.isArray(res) ? res : [], totalElements: 0, totalPages: 0 });
        } catch (e) {
            setError(e.response?.data?.message || "Không thể tải dữ liệu");
        } finally { setLoading(false); }
    }, [JSON.stringify(params)]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    return { data, loading, error, refetch: fetchAll };
};