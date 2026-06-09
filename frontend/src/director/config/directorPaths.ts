/** Đường dẫn UI Director — documents/ui/director_sidebar.md; API: documents/api/director.md */
export const directorPaths = {
  root: '/director',
  dashboard: '/director',
  account: '/director/account',
  analytics: '/director',
  approvals: {
    root: '/director/approvals',
    pricing: '/director/approvals/pricing',
    /** Chi tiết phê duyệt theo mã đơn — trang riêng GD */
    pricingOrder: (orderCode: string) =>
      `/director/approvals/pricing/${encodeURIComponent(orderCode)}`,
    debt: '/director/approvals/debt',
  },
  risk: {
    root: '/director/risk',
    receivables: '/director/risk/receivables',
    wastage: '/director/risk/wastage',
  },
  operations: {
    root: '/director/operations',
    performance: '/director/operations/performance',
    orders: '/director/operations/orders',
    order: (id: string) => `/director/operations/orders/${encodeURIComponent(id)}`,
    tasks: '/director/operations/tasks',
    task: (id: string) => `/director/operations/tasks/${encodeURIComponent(id)}`,
  },
  /** Make-to-stock — lệnh xưởng độc lập */
  mts: '/director/mts',
  partners: {
    agencies: '/director/partners/agencies',
    agenciesNew: '/director/partners/agencies/new',
    agency: (id: string) =>
      `/director/partners/agencies/${encodeURIComponent(id)}`,
    suppliers: '/director/partners/suppliers',
    suppliersNew: '/director/partners/suppliers/new',
    supplier: (id: string) =>
      `/director/partners/suppliers/${encodeURIComponent(id)}`,
  },
} as const
