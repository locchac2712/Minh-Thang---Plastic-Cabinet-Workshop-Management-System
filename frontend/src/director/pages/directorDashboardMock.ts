export type DirectorDonutSlice = { key: string; label: string; value: number; color: string }
export type DirectorTrendPoint = { label: string; alertCount: number }
export type DirectorStaffRoleRow = { role: string; count: number }
export type DirectorStockBandRow = { key: 'ok' | 'warn' | 'crit'; label: string; count: number }
export type DirectorProductByCategoryRow = { category: string; count: number }
export type DirectorRadarAxisRow = { label: string; score: number }
export type DirectorGroupedQuarterRow = { period: string; agencies: number; suppliers: number }

export const DIRECTOR_DASHBOARD_MOCK = {
  kpi: {
    revenueMonthVnd: 6_420_000_000,
    grossMarginPct: 23.6,
    debtOverdueVnd: 780_000_000,
    rejectedDiscount: 12,
    mtsAgingUnits: 164,
    wastagePct: 3.4,
  },
  orderStatusDonut: [
    { key: 'approved', label: 'Đã duyệt', value: 62, color: '#0ea5e9' },
    { key: 'producing', label: 'Đang sản xuất', value: 28, color: '#6366f1' },
    { key: 'done', label: 'Hoàn tất', value: 41, color: '#22c55e' },
    { key: 'blocked', label: 'Chậm/treo', value: 9, color: '#ef4444' },
  ] satisfies DirectorDonutSlice[],
  revenueTrend: [
    { label: 'T2', alertCount: 86 },
    { label: 'T3', alertCount: 91 },
    { label: 'T4', alertCount: 95 },
    { label: 'T5', alertCount: 89 },
    { label: 'T6', alertCount: 102 },
    { label: 'T7', alertCount: 107 },
    { label: 'T8', alertCount: 112 },
  ] satisfies DirectorTrendPoint[],
  financeHealthRadar: [
    { label: 'Doanh thu', score: 84 },
    { label: 'Margin', score: 73 },
    { label: 'Thu hồi nợ', score: 61 },
    { label: 'Đơn đúng hạn', score: 78 },
    { label: 'Hao hụt', score: 66 },
  ] satisfies DirectorRadarAxisRow[],
  pipelineByRole: [
    { role: 'Sale', count: 21 },
    { role: 'Kế toán', count: 8 },
    { role: 'Xưởng', count: 34 },
    { role: 'Mua hàng', count: 7 },
  ] satisfies DirectorStaffRoleRow[],
  stockBands: [
    { key: 'ok', label: 'An toàn', count: 88 },
    { key: 'warn', label: 'Sát ngưỡng', count: 29 },
    { key: 'crit', label: 'Thiếu nghiêm trọng', count: 14 },
  ] satisfies DirectorStockBandRow[],
  productsByCategory: [
    { category: 'Tủ bếp', count: 42 },
    { category: 'Tủ áo', count: 31 },
    { category: 'Kệ TV', count: 19 },
    { category: 'Bàn ghế', count: 23 },
    { category: 'Khác', count: 12 },
  ] satisfies DirectorProductByCategoryRow[],
  partnerQuarterly: [
    { period: 'Q1', agencies: 6, suppliers: 3 },
    { period: 'Q2', agencies: 8, suppliers: 5 },
    { period: 'Q3', agencies: 5, suppliers: 4 },
    { period: 'Q4', agencies: 7, suppliers: 6 },
  ] satisfies DirectorGroupedQuarterRow[],
}

