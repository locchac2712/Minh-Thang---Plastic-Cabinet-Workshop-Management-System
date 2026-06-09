/** Đường dẫn Production (xưởng) — khớp documents/ui/production_sidebar.md */
export const productionPaths = {
  root: '/production',
  account: '/production/account',
  /** Tổng quan — biểu đồ xưởng (GET /api/production/dashboard/charts/...) */
  dashboard: '/production/dashboard',
  /** Kanban 3 cột */
  board: '/production',
  /** Nhật ký tiến độ xưởng (theo ngày / task) */
  activity: '/production/activity',
  /**
   * Lệnh sản xuất — nguồn khác nhau (cùng PRODUCTION_TASKS):
   * - byOrder: gắn ORDERS (Make-to-Order)
   * - internal: order_id null — MTS / dự trữ (DIR-P04)
   */
  tasks: {
    root: '/production/tasks',
    byOrder: '/production/tasks/by-order',
    /** Chi tiết lệnh SX gắn đơn — `taskId` = UUID hoặc LSX (GET …/tasks/:idOrCode/details) */
    byOrderTask: (taskId: string) =>
      `/production/tasks/by-order/${encodeURIComponent(taskId)}`,
    internal: '/production/tasks/internal',
    /** Chi tiết lệnh MTS — `taskId` = UUID hoặc LSX */
    internalTask: (taskId: string) =>
      `/production/tasks/internal/${encodeURIComponent(taskId)}`,
  },
  inventory: {
    root: '/production/inventory',
    /** Hư hỏng / waste — yêu cầu xuất kho bổ sung sau BOM */
    wastage: '/production/inventory/wastage',
    /** Tồn kho vật tư (đọc) */
    stock: '/production/inventory/stock',
    /** Nhật ký biến động NVL (IMPORT / EXPORT / WASTE) */
    logs: '/production/inventory/logs',
  },
  /** Sản phẩm custom theo đại lý */
  customProducts: {
    root: '/production/custom-products',
    list: '/production/custom-products',
    create: '/production/custom-products/new',
    detail: (productId: string) =>
      `/production/custom-products/${encodeURIComponent(productId)}`,
  },
  /** @deprecated dùng customProducts.create */
  customProductCreate: '/production/custom-products/new',
} as const
