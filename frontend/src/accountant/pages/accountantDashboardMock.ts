export type AccountantDonutSlice = { key: string; label: string; value: number; color: string }
export type AccountantTrendPoint = { label: string; alertCount: number }
export type AccountantStaffRoleRow = { role: string; count: number }
export type AccountantStockBandRow = { key: 'ok' | 'warn' | 'crit'; label: string; count: number }
export type AccountantProductByCategoryRow = { category: string; count: number }
export type AccountantRadarAxisRow = { label: string; score: number }
export type AccountantGroupedQuarterRow = { period: string; agencies: number; suppliers: number }

export const ACCOUNTANT_DASHBOARD_MOCK = {
  kpi: {
    cashInMonthVnd: 3_920_000_000,
    cashOutMonthVnd: 2_780_000_000,
    pendingDeposits: 14,
    overdueReceivablesVnd: 960_000_000,
    lowStockItems: 22,
    pendingInvoices: 9,
  },
  paymentStatusDonut: [
    { key: 'pending', label: 'Chờ duyệt', value: 28, color: '#f59e0b' },
    { key: 'completed', label: 'Hoàn tất', value: 57, color: '#22c55e' },
    { key: 'failed', label: 'Thất bại', value: 6, color: '#ef4444' },
    { key: 'review', label: 'Cần soát', value: 10, color: '#0ea5e9' },
  ] satisfies AccountantDonutSlice[],
  receivableTrend: [
    { label: 'T2', alertCount: 31 },
    { label: 'T3', alertCount: 29 },
    { label: 'T4', alertCount: 33 },
    { label: 'T5', alertCount: 35 },
    { label: 'T6', alertCount: 34 },
    { label: 'T7', alertCount: 30 },
    { label: 'T8', alertCount: 28 },
  ] satisfies AccountantTrendPoint[],
  financeHealthRadar: [
    { label: 'Thu nợ', score: 71 },
    { label: 'Duyệt CK', score: 78 },
    { label: 'VAT', score: 75 },
    { label: 'PO', score: 68 },
    { label: 'Kiểm soát tồn', score: 73 },
  ] satisfies AccountantRadarAxisRow[],
  processByBucket: [
    { role: 'Nạp tiền chờ', count: 14 },
    { role: 'Hóa đơn nháp', count: 9 },
    { role: 'PO chờ nhận', count: 12 },
    { role: 'NCC công nợ', count: 7 },
  ] satisfies AccountantStaffRoleRow[],
  stockBands: [
    { key: 'ok', label: 'Tồn an toàn', count: 84 },
    { key: 'warn', label: 'Sát ngưỡng', count: 25 },
    { key: 'crit', label: 'Thiếu tồn', count: 22 },
  ] satisfies AccountantStockBandRow[],
  productsByCategory: [
    { category: 'Đơn phải thu', count: 35 },
    { category: 'Đơn đã thu', count: 47 },
    { category: 'PO chưa trả', count: 18 },
    { category: 'PO đã trả', count: 21 },
    { category: 'Khác', count: 11 },
  ] satisfies AccountantProductByCategoryRow[],
  partnerQuarterly: [
    { period: 'Q1', agencies: 11, suppliers: 9 },
    { period: 'Q2', agencies: 14, suppliers: 12 },
    { period: 'Q3', agencies: 10, suppliers: 13 },
    { period: 'Q4', agencies: 16, suppliers: 15 },
  ] satisfies AccountantGroupedQuarterRow[],
}

