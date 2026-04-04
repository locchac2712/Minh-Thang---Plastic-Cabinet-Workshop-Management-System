import { useApi } from "./useApi";
import salesOrderService from "../services/salesOrderService.js";

/**
 * useSalesOrders - Quản lý danh sách đơn hàng.
 */
export const useSalesOrders = (params = {}) => {
    const api = useApi(salesOrderService, { 
        initialParams: params,
        cacheKey: "SALES_ORDERS" 
    });

    return { 
        data: api.data,
        loading: api.loading, 
        error: api.error, 
        refetch: api.refetch, 
        create: api.create, 
        update: api.update,
        remove: api.remove
    };
};