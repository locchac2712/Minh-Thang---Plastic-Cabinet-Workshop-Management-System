/**
 * Đường dẫn admin — dùng chung cho NavLink, redirect, và gắn API sau này.
 */
export const adminPaths = {
  root: '/admin',
  dashboard: '/admin',
  account: '/admin/account',
  users: '/admin/users',
  catalog: {
    root: '/admin/catalog',
    categories: '/admin/catalog/categories',
    products: '/admin/catalog/products',
    productsNew: '/admin/catalog/products/new',
    /** Chi tiết thành phẩm */
    product: (id: string) => `/admin/catalog/products/${encodeURIComponent(id)}`,
  },
  manufacturing: {
    materials: '/admin/manufacturing/materials',
    materialsNew: '/admin/manufacturing/materials/new',
    /** Chi tiết vật tư */
    material: (id: string) =>
      `/admin/manufacturing/materials/${encodeURIComponent(id)}`,
    bom: '/admin/manufacturing/bom',
  },
} as const
