import { useApi } from "./useApi";
import bomService from "../services/bomService";

/**
 * useBoms - Quản lý Định mức vật tư (BOM).
 */
export const useBoms = (params = {}) => {
    const api = useApi(bomService, { 
        initialParams: params,
        cacheKey: "BOMS" 
    });

    return { 
        items: api.items,
        boms: api.items, 
        loading: api.loading, 
        error: api.error, 
        refetch: api.refetch, 
        create: api.create,
        update: api.update,
        remove: api.remove
    };
};