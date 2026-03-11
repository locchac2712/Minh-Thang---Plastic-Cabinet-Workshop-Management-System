import { useState, useEffect, useCallback } from "react";
import bomService from "../services/bomService";

export const useBoms = () => {
    const [boms,    setBoms]    = useState([]);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);

    const fetchAll = useCallback(async () => {
        if (!localStorage.getItem("token")) {
            setError("Bạn cần đăng nhập để xem dữ liệu");
            return;
        }
        setLoading(true); setError(null);
        try {
            const data = await bomService.getAll();
            setBoms(Array.isArray(data) ? data : []);
        } catch (err) {
            const s = err.response?.status;
            if (s === 401) setError("Bạn cần đăng nhập để xem dữ liệu");
            else if (s === 403) setError("Bạn không có quyền truy cập");
            else setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchAll();
        const h = () => { if (localStorage.getItem("token")) fetchAll(); };
        window.addEventListener("auth-change", h);
        return () => window.removeEventListener("auth-change", h);
    }, [fetchAll]);

    const create = async (payload) => {
        const item = await bomService.create(payload);
        setBoms((p) => [...p, item]);
        return item;
    };

    return { boms, loading, error, refetch: fetchAll, create };
};