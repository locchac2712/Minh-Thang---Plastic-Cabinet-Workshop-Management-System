import { useApi } from "./useApi";
import productService from "../services/productService";

/**
 * useProducts - Quản lý danh mục thành phẩm.
 */
export const useProducts = (params = {}) => {
    const api = useApi(productService, { 
        initialParams: params,
        cacheKey: "PRODUCTS" 
    });

    const changeStatus = async (id, status) => {
        try {
            await productService.changeStatus(id, status);
            api.setData(prev => ({
                ...prev,
                content: prev.content.map(x => (x.id === id ? { ...x, status } : x))
            }));
        } catch (err) {
            api.setError(err.response?.data?.message || "Không thể cập nhật trạng thái");
            throw err;
        }
    };

    return { 
        items: api.items,
        products: api.items, 
        loading: api.loading, 
        error: api.error, 
        refetch: api.refetch, 
        create: api.create, 
        update: api.update,
        changeStatus 
    };
};