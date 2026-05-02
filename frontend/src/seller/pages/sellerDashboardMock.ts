export type SellerDonutSlice = { key: string; label: string; value: number; color: string }
export type SellerTrendPoint = { label: string; alertCount: number }
export type SellerStaffRoleRow = { role: string; count: number }
export type SellerStockBandRow = { key: 'ok' | 'warn' | 'crit'; label: string; count: number }
export type SellerProductByCategoryRow = { category: string; count: number }
export type SellerRadarAxisRow = { label: string; score: number }
export type SellerGroupedQuarterRow = { period: string; agencies: number; suppliers: number }

export const SELLER_DASHBOARD_MOCK = {
  kpi: {
    revenueMonthVnd: 2_860_000_000,
    ordersOpen: 37,
    ordersBlocked: 6,
    commissionForecastVnd: 122_000_000,
    receivableRiskVnd: 450_000_000,
    paymentPending: 11,
  },
  orderStatusDonut: [
    { key: 'draft', label: 'Nháp', value: 14, color: '#94a3b8' },
    { key: 'approved', label: 'Đã duyệt', value: 29, color: '#0ea5e9' },
    { key: 'producing', label: 'Đang SX', value: 22, color: '#6366f1' },
    { key: 'done', label: 'Hoàn tất', value: 35, color: '#22c55e' },
  ] satisfies SellerDonutSlice[],
  revenueTrend: [
    { label: 'T2', alertCount: 48 },
    { label: 'T3', alertCount: 51 },
    { label: 'T4', alertCount: 49 },
    { label: 'T5', alertCount: 53 },
    { label: 'T6', alertCount: 57 },
    { label: 'T7', alertCount: 55 },
    { label: 'T8', alertCount: 60 },
  ] satisfies SellerTrendPoint[],
  salesHealthRadar: [
    { label: 'Chốt đơn', score: 81 },
    { label: 'Tốc độ duyệt', score: 74 },
    { label: 'Thu tiền', score: 69 },
    { label: 'Đúng hẹn', score: 77 },
    { label: 'CSKH', score: 83 },
  ] satisfies SellerRadarAxisRow[],
  pipelineByRole: [
    { role: 'Đơn mới', count: 18 },
    { role: 'Duyệt giá', count: 7 },
    { role: 'Đang SX', count: 22 },
    { role: 'Chờ thanh toán', count: 11 },
  ] satisfies SellerStaffRoleRow[],
  stockBands: [
    { key: 'ok', label: 'Đơn an toàn vật tư', count: 26 },
    { key: 'warn', label: 'Có nguy cơ chậm', count: 9 },
    { key: 'crit', label: 'Nguy cơ cao', count: 4 },
  ] satisfies SellerStockBandRow[],
  productsByCategory: [
    { category: 'Tủ bếp', count: 27 },
    { category: 'Tủ áo', count: 19 },
    { category: 'Kệ TV', count: 12 },
    { category: 'Bàn', count: 14 },
    { category: 'Khác', count: 8 },
  ] satisfies SellerProductByCategoryRow[],
  partnerQuarterly: [
    { period: 'Q1', agencies: 4, suppliers: 0 },
    { period: 'Q2', agencies: 6, suppliers: 0 },
    { period: 'Q3', agencies: 5, suppliers: 0 },
    { period: 'Q4', agencies: 7, suppliers: 0 },
  ] satisfies SellerGroupedQuarterRow[],
}

