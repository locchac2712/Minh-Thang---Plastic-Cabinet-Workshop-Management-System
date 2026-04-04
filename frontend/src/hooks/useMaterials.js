import { useApi } from "./useApi";
import materialService from "../services/materialService";

/**
 * useMaterials - Quản lý nguyên vật liệu.
 */
export const useMaterials = (autoFetch = true) => {
    const api = useApi(materialService, { 
        autoFetch,
        cacheKey: "MATERIALS" 
    });

    return { 
        materials: api.items, 
        loading: api.loading, 
        error: api.error, 
        refetch: api.refetch, 
        create: api.create, 
        update: api.update,
        remove: api.remove 
    };
};