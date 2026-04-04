import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * useApi - Nâng cấp sử dụng React Query để lấy dữ liệu tức thì và quản lý Cache chuyên nghiệp.
 * 
 * @param {Object} service - Đối tượng service chứa các phương thức getAll, create, update, delete.
 * @param {Object} options - Các tùy chọn (initialParams, cacheKey, v.v.).
 */
export const useApi = (service, options = {}) => {
    const queryClient = useQueryClient();
    const { 
        initialParams = {}, 
        onFetchSuccess, 
        autoFetch = true,
        cacheKey = null 
    } = options;

    // 1. Fetch dữ liệu với useQuery
    // QueryKey bao gồm cả cacheKey và params để đảm bảo dữ liệu đúng context
    const query = useQuery({
        queryKey: cacheKey ? [cacheKey, initialParams] : null,
        queryFn: async () => {
            const res = await service.getAll(initialParams);
            // Chuẩn hóa dữ liệu tương tự logic cũ
            return res?.content 
                ? res 
                : { 
                    content: Array.isArray(res) ? res : [], 
                    totalElements: res?.totalElements ?? (Array.isArray(res) ? res.length : 0), 
                    totalPages: res?.totalPages ?? 1 
                  };
        },
        enabled: autoFetch && !!cacheKey && !!localStorage.getItem("token"),
        onSuccess: (data) => onFetchSuccess?.(data),
    });

    // 2. Các Mutation cho CRUD
    const createMutation = useMutation({
        mutationFn: (payload) => service.create(payload),
        onSuccess: () => {
            if (cacheKey) queryClient.invalidateQueries({ queryKey: [cacheKey] });
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }) => service.update(id, payload),
        onSuccess: () => {
            if (cacheKey) queryClient.invalidateQueries({ queryKey: [cacheKey] });
        }
    });

    const removeMutation = useMutation({
        mutationFn: (id) => {
            const deleteFn = service.delete || service.remove;
            return deleteFn(id);
        },
        onSuccess: () => {
            if (cacheKey) queryClient.invalidateQueries({ queryKey: [cacheKey] });
        }
    });

    // 3. Mapping dữ liệu trả về để tương thích với các component cũ
    const data = useMemo(() => query.data || { content: [], totalElements: 0, totalPages: 0 }, [query.data]);

    return { 
        data, 
        items: data.content, 
        loading: query.isLoading || query.isFetching, 
        error: query.error ? (query.error.response?.data?.message || "Lỗi tải dữ liệu") : null,
        setError: () => {}, // Giữ cho tương thích interface cũ
        setData: (newData) => {
            if (cacheKey) queryClient.setQueryData([cacheKey, initialParams], newData);
        },
        refetch: query.refetch, 
        create: createMutation.mutateAsync, 
        update: (id, payload) => updateMutation.mutateAsync({ id, payload }), 
        remove: removeMutation.mutateAsync 
    };
};
