/** Đường dẫn khu vực Seller — khớp documents/ui/seller_sidebar.md */
export const sellerPaths = {
  root: '/seller',
  dashboard: '/seller',
  account: '/seller/account',
  agencies: '/seller/agencies',
  /** Form tạo khách hàng / đại lý mới */
  agencyNew: '/seller/agencies/new',
  /** Chi tiết đại lý (NVBH) */
  agency: (id: string) => `/seller/agencies/${encodeURIComponent(id)}`,
  /** Menu hàng hóa (Storefront grid) */
  store: '/seller/store',
  /** Đơn đặt hàng (tab trạng thái sau) */
  orders: '/seller/orders',
  /** Form tạo đơn NVBH — chọn khách + giỏ (catalog / custom) */
  orderNew: '/seller/orders/new',
  /** Chi tiết đơn (mã đơn URL-encoded) */
  order: (orderCode: string) => `/seller/orders/${encodeURIComponent(orderCode)}`,
  payments: '/seller/payments',
  /** Nhật ký / feed xưởng */
  tracking: '/seller/tracking',
  /** Báo giá — GET /api/seller/quotations */
  quotations: '/seller/quotations',
  quotationNew: '/seller/quotations/new',
  quotation: (id: string) => `/seller/quotations/${encodeURIComponent(id)}`,
} as const
