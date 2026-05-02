/** Đường dẫn Kế toán — khớp documents/ui/accountant_sidebar.md */

/** Tạm ẩn menu & route «Sổ nợ trả NCC» — đặt `true` khi bật lại. */
export const ACCOUNTANT_PAYABLES_BILLS_ENABLED = false

/** Tạm ẩn «Hóa đơn VAT» và «Lịch sử xuất hóa đơn» — đặt `true` khi bật lại. */
export const ACCOUNTANT_RECEIVABLES_VAT_PAGES_ENABLED = false

export const accountantPaths = {
  root: '/accountant',
  dashboard: '/accountant',
  receivables: {
    root: '/accountant/receivables',
    deposits: '/accountant/receivables/deposits',
    invoices: '/accountant/receivables/invoices',
    invoiceHistory: '/accountant/receivables/invoice-history',
  },
  purchasing: {
    root: '/accountant/purchasing',
    alerts: '/accountant/purchasing/alerts',
    /** Đơn mua (PO) */
    orders: '/accountant/purchasing/orders',
    orderDetail: (purchaseId: string) => `/accountant/purchasing/orders/${purchaseId}`,
  },
  payables: {
    bills: '/accountant/payables/bills',
  },
  masters: {
    suppliers: '/accountant/masters/suppliers',
    materials: '/accountant/masters/materials',
  },
} as const
