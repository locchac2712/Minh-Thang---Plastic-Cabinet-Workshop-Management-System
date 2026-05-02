/**
 * Endpoint tham chiếu tài liệu — documents/api/director.md (base `/api/director`).
 * Trường DB: documents/database_dictionary.md, documents/erd.md (AGENCIES, ORDERS, …).
 */
const B = '/api/director'

export const directorApiDoc = {
  base: B,

  approvals: {
    /** Đơn Pending / Custom chờ GD — bảng ORDERS */
    orders: `${B}/approvals/orders`,
    orderApprove: (orderId: string) => `${B}/approvals/orders/${orderId}/approve`,
    orderReject: (orderId: string) => `${B}/approvals/orders/${orderId}/reject`,
    orderRequestRevision: (orderId: string) => `${B}/approvals/orders/${orderId}/request-revision`,
    /** Body: { maxDebtLimit } — AGENCIES.max_debt_limit (DIR-A03) */
    agencyOverrideDebt: (agencyId: string) => `${B}/approvals/agencies/${agencyId}/override-debt`,
  },

  reports: {
    /** Dư nợ phải thu — AGENCIES.total_debt (DIR-F03) */
    debts: `${B}/reports/debts`,
    revenue: `${B}/reports/revenue`,
    grossMargin: `${B}/reports/gross-margin`,
    discountAllocations: `${B}/reports/discount-allocations`,
    /** Hao phí — inventory_logs WASTE (legacy; ưu tiên `waste.*` theo director.md) */
    productionWastage: `${B}/reports/production-wastage`,
  },

  /** Hao phí WASTE — theo `director.md` (kỳ from_date, to_date) */
  waste: {
    summary: `${B}/waste/summary`,
    teams: `${B}/waste/teams`,
    teamDetails: (teamUserId: string) => `${B}/waste/teams/${encodeURIComponent(teamUserId)}/details`,
    teamRemark: (teamUserId: string) => `${B}/waste/teams/${encodeURIComponent(teamUserId)}/remark`,
  },

  internalTasks: {
    /** Make-to-Stock — PRODUCTION_TASKS.order_id nullable */
    mts: `${B}/internal-tasks`,
  },
} as const
