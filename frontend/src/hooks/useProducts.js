import { useState, useEffect, useCallback } from "react";
import productService from "../services/productService";

export const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState(null);

    const fetchAll = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) { setError("Bạn cần đăng nhập để xem dữ liệu"); return; }

        setLoading(true); setError(null);
        try {
            const data = await productService.getAll();
            setProducts(Array.isArray(data) ? data : []);
        } catch (err) {
            const status = err.response?.status;
            if (status === 401) setError("Bạn cần đăng nhập để xem dữ liệu");
            else if (status === 403) setError("Bạn không có quyền truy cập");
            else setError(err.response?.data?.message || "Không thể tải dữ liệu");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        fetchAll();
        const handler = () => { if (localStorage.getItem("token")) fetchAll(); };
        window.addEventListener("auth-change", handler);
        return () => window.removeEventListener("auth-change", handler);
    }, [fetchAll]);

    const create = async (payload) => {
        const item = await productService.create(payload);
        setProducts((p) => [...p, item]);
        return item;
    };

    const update = async (id, payload) => {
        const item = await productService.update(id, payload);
        setProducts((p) => p.map((x) => (x.id === id ? item : x)));
        return item;
    };

    const changeStatus = async (id, status) => {
        await productService.changeStatus(id, status);
        setProducts((p) => p.map((x) => (x.id === id ? { ...x, status } : x)));
    };

    return { products, loading, error, refetch: fetchAll, create, update, changeStatus };
};