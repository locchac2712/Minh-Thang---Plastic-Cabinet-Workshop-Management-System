import { useState, useEffect, useCallback } from "react";
import materialService from "../services/materialService";

export const useMaterials = (autoFetch = true) => {
    const [materials, setMaterials] = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await materialService.getAll();
            // data có thể là array hoặc null nếu chưa có bản ghi nào
            setMaterials(Array.isArray(data) ? data : []);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) {
                setError("Bạn cần đăng nhập để xem dữ liệu");
            } else if (status === 403) {
                setError("Bạn không có quyền truy cập");
            } else {
                setError(err.response?.data?.message || err.message || "Không thể tải dữ liệu");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const create = async (payload) => {
        const newItem = await materialService.create(payload);
        setMaterials((prev) => [...prev, newItem]);
        return newItem;
    };

    const update = async (id, payload) => {
        const updated = await materialService.update(id, payload);
        setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
        return updated;
    };

    const remove = async (id) => {
        await materialService.remove(id);
        setMaterials((prev) => prev.filter((m) => m.id !== id));
    };

    useEffect(() => {
        if (autoFetch) fetchAll();
    }, [fetchAll, autoFetch]);

    return { materials, loading, error, refetch: fetchAll, create, update, remove };
};