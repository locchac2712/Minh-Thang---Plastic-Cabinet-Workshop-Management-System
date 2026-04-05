import { useState, useEffect, useCallback, useMemo, useRef } from "react";

/**
 * useApi - Hook dùng chung để quản lý việc gọi API, trạng thái loading, lỗi và dữ liệu.
 */
export const useApi = (service, options = {}) => {
    const { 
        initialParams = {}, 
        onFetchSuccess, 
        autoFetch = true 
    } = options;

    const [data, setData]       = useState({ content: [], totalElements: 0, totalPages: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);

    // Dùng Ref để giữ reference ổn định của service (tránh vòng lặp nểu service ko được memoize)
    const serviceRef = useRef(service);
    useEffect(() => {
        serviceRef.current = service;
    }, [service]);

    // Chuỗi hóa params để so sánh giá trị thay vì so sánh tham chiếu (tránh vòng lặp)
    const paramsString = useMemo(() => JSON.stringify(initialParams), [initialParams]);

    // Hàm lấy dữ liệu chính
    const fetchData = useCallback(async (paramsOverride) => {
        if (!localStorage.getItem("token")) return;
        
        setLoading(true);
        setError(null);
        try {
            const fetchParams = paramsOverride || JSON.parse(paramsString);
            const res = await serviceRef.current.getAll(fetchParams);
            
            const normalized = res?.content 
                ? res 
                : { 
                    content: Array.isArray(res) ? res : [], 
                    totalElements: res?.totalElements ?? (Array.isArray(res) ? res.length : 0), 
                    totalPages: res?.totalPages ?? 1 
                  };
            
            setData(normalized);
            onFetchSuccess?.(normalized);
            return normalized;
        } catch (err) {
            console.error("API Fetch Error:", err);
            const msg = err.response?.data?.message || err.message || "Lỗi tải dữ liệu";
            setError(msg);
            return null;
        } finally {
            setLoading(false);
        }
    }, [paramsString, onFetchSuccess]);

    useEffect(() => {
        if (autoFetch) {
            fetchData();
        }
    }, [autoFetch, fetchData]);

    // Các hàm CRUD tự động refetch
    const create = async (payload) => {
        setLoading(true);
        try {
            const res = await service.create(payload);
            await fetchData();
            return res;
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi tạo mới");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const update = async (id, payload) => {
        setLoading(true);
        try {
            const res = await service.update(id, payload);
            await fetchData();
            return res;
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi cập nhật");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const remove = async (id) => {
        setLoading(true);
        try {
            const deleteFn = service.delete || service.remove;
            const res = await deleteFn(id);
            await fetchData();
            return res;
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi xóa");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        data,
        items: data?.content || [],
        loading,
        error,
        fetchData,
        refetch: fetchData,
        create,
        update,
        remove,
        setData,
        setError
    };
};
