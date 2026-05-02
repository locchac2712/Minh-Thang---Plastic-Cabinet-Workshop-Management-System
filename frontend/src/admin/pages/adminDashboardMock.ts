/**
 * Dữ liệu minh họa dashboard admin — thay bằng API tổng hợp (aggregates) sau.
 * Nguồn khái niệm: documents/ui/admin_sidebar.md §1, master data + tồn kho + đối tác.
 */

export type StaffByRoleRow = { role: string; count: number }

export type StockBandRow = {
  key: 'ok' | 'warn' | 'crit'
  label: string
  count: number
}

export type TrendPoint = { label: string; alertCount: number }

export type ProductByCategoryRow = { category: string; count: number }

export type DonutSlice = { key: string; label: string; value: number; color: string }

export type RadarAxisRow = { label: string; score: number }

export type GroupedQuarterRow = { period: string; agencies: number; suppliers: number }

export type AdminDashboardSnapshot = {
  kpi: {
    staffActive: number
    staffLocked: number
    categories: number
    productsActive: number
    productsDraft: number
    materialsAlert: number
    agenciesActive: number
    suppliersActive: number
    suppliersDeactivated: number
    bomCoveragePct: number
  }
  staffByRole: StaffByRoleRow[]
  materialStockBands: StockBandRow[]
  materialAlertTrend: TrendPoint[]
  productsByCategory: ProductByCategoryRow[]
  /** Trạng thái định mức theo mẫu tủ (mock) */
  bomStatusDonut: DonutSlice[]
  /** Chỉ số “sức khỏe” cấu hình 0–100 */
  configHealthRadar: RadarAxisRow[]
  /** Cảnh báo tồn theo loại vật tư × ngày trong tuần (mock) */
  materialHeatmap: { rowLabels: string[]; values: number[][] }
  /** So sánh bổ sung đối tác theo quý */
  partnerQuarterly: GroupedQuarterRow[]
}

/** Mock ổn định để UI không “nhảy” mỗi lần load */
export const ADMIN_DASHBOARD_MOCK: AdminDashboardSnapshot = {
  kpi: {
    staffActive: 28,
    staffLocked: 4,
    categories: 6,
    productsActive: 42,
    productsDraft: 3,
    materialsAlert: 7,
    agenciesActive: 15,
    suppliersActive: 12,
    suppliersDeactivated: 1,
    bomCoveragePct: 78,
  },
  staffByRole: [
    { role: 'Sale', count: 8 },
    { role: 'Sản xuất', count: 11 },
    { role: 'Kế toán', count: 4 },
    { role: 'Giám đốc', count: 2 },
    { role: 'Quản trị', count: 3 },
    { role: 'Tổ trưởng SX', count: 4 },
  ],
  materialStockBands: [
    { key: 'ok', label: 'Trên ngưỡng an toàn', count: 124 },
    { key: 'warn', label: 'Gần min (cần theo dõi)', count: 18 },
    { key: 'crit', label: '≤ min / cảnh báo', count: 7 },
  ],
  materialAlertTrend: [
    { label: 'T2', alertCount: 5 },
    { label: 'T3', alertCount: 6 },
    { label: 'T4', alertCount: 8 },
    { label: 'T5', alertCount: 7 },
    { label: 'T6', alertCount: 9 },
    { label: 'T7', alertCount: 7 },
    { label: 'CN', alertCount: 7 },
  ],
  productsByCategory: [
    { category: 'Tủ bếp', count: 14 },
    { category: 'Tủ quần áo', count: 11 },
    { category: 'Kệ / kho', count: 8 },
    { category: 'Bàn trang điểm', count: 5 },
    { category: 'Khác', count: 4 },
  ],
  bomStatusDonut: [
    { key: 'full', label: 'Đủ định mức', value: 33, color: '#22c55e' },
    { key: 'partial', label: 'Thiếu NVL trong BOM', value: 9, color: '#f59e0b' },
    { key: 'none', label: 'Chưa cấu hình BOM', value: 9, color: '#94a3b8' },
  ],
  configHealthRadar: [
    { label: 'Đồng bộ master', score: 84 },
    { label: 'Tồn kho & min', score: 71 },
    { label: 'Phủ BOM', score: 78 },
    { label: 'Đối tác sạch', score: 88 },
    { label: 'Nhân sự & quyền', score: 92 },
  ],
  materialHeatmap: {
    rowLabels: ['Nhựa / tấm', 'Phụ kiện', 'Ray / bản lề', 'Ốc / ke', 'Khác'],
    values: [
      [1, 0, 2, 1, 2, 1, 1],
      [0, 1, 1, 2, 1, 0, 1],
      [1, 1, 0, 1, 1, 2, 1],
      [0, 0, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 0, 1, 1],
    ],
  },
  partnerQuarterly: [
    { period: 'Q1', agencies: 3, suppliers: 2 },
    { period: 'Q2', agencies: 4, suppliers: 3 },
    { period: 'Q3', agencies: 5, suppliers: 2 },
    { period: 'Q4', agencies: 3, suppliers: 5 },
  ],
}
