import { useApi } from "./useApi";
import customerService from "../services/customerService";

/**
 * useCustomers - Quản lý dữ liệu khách hàng.
 */
export const useCustomers = (params = {}) => {
    const api = useApi(customerService, { 
        initialParams: params,
        cacheKey: "CUSTOMERS" 
    });

    // Thêm các logic đặc thù nếu cần
    const changeStatus = async (id, status) => {
        try {
            const updated = await customerService.changeStatus(id, status);
            api.setData(prev => ({
                ...prev,
                content: prev.content.map(x => (x.id === id ? updated : x))
            }));
            return updated;
        } catch (err) {
            api.setError(err.response?.data?.message || "Không thể đổi trạng thái");
            throw err;
        }
    };

    return { 
        customers: api.items, 
        loading: api.loading, 
        error: api.error, 
        refetch: api.refetch, 
        create: api.create, 
        update: api.update,
        changeStatus 
    };
};
