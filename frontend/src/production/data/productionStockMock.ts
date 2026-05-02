/**
 * Tồn kho vật tư phục vụ xưởng — đọc (mock) từ sổ tồn / đồng bộ kế toán.
 * Dùng trước khi cắt BOM; cảnh báo khi dưới định mức an toàn.
 */

export type ProductionStockCategory = 'panel' | 'hardware' | 'edge' | 'adhesive' | 'other'

export type ProductionStockStatus = 'ok' | 'low' | 'critical'

export type ProductionStockRow = {
  id: string
  sku: string
  name: string
  uom: string
  category: ProductionStockCategory
  /** Khu / vị trí kho (mock) */
  zone: string
  /** Tồn thực tế */
  qtyOnHand: number
  /** Đã giữ cho lệnh / BOM */
  qtyReserved: number
  /** Tồn khả dụng = onHand - reserved (tính sẵn để hiển thị) */
  qtyAvailable: number
  /** Định mức tối thiểu (an toàn) */
  minStock: number
  /** Giá vốn ước / đơn vị (rolling) — minh họa */
  unitCostVnd: number
  status: ProductionStockStatus
  /** Lần kiểm đếm / sync gần nhất */
  lastSyncAt: string
}

const ROWS: ProductionStockRow[] = [
  {
    id: 'stk-1',
    sku: 'VL-MDF-18',
    name: 'MDF phủ melamine trắng 18mm',
    uom: 'tấm',
    category: 'panel',
    zone: 'Kho A — kệ R1',
    qtyOnHand: 186,
    qtyReserved: 42,
    qtyAvailable: 144,
    minStock: 80,
    unitCostVnd: 420_000,
    status: 'ok',
    lastSyncAt: '2026-04-11T07:30:00',
  },
  {
    id: 'stk-2',
    sku: 'VL-HDF-16',
    name: 'HDF chống ẩm 16mm xám',
    uom: 'tấm',
    category: 'panel',
    zone: 'Kho A — kệ R2',
    qtyOnHand: 52,
    qtyReserved: 28,
    qtyAvailable: 24,
    minStock: 40,
    unitCostVnd: 385_000,
    status: 'low',
    lastSyncAt: '2026-04-11T07:30:00',
  },
  {
    id: 'stk-3',
    sku: 'AC-ACR-W',
    name: 'Acrylic trắng 8mm (cánh)',
    uom: 'tấm',
    category: 'panel',
    zone: 'Kho B — acrylic',
    qtyOnHand: 18,
    qtyReserved: 14,
    qtyAvailable: 4,
    minStock: 15,
    unitCostVnd: 1_850_000,
    status: 'critical',
    lastSyncAt: '2026-04-10T16:00:00',
  },
  {
    id: 'stk-4',
    sku: 'PK-BLUM-TAND',
    name: 'Ray tủ Blum Tandem đồng bộ',
    uom: 'bộ',
    category: 'hardware',
    zone: 'Kho PK — lối 2',
    qtyOnHand: 64,
    qtyReserved: 38,
    qtyAvailable: 26,
    minStock: 24,
    unitCostVnd: 920_000,
    status: 'ok',
    lastSyncAt: '2026-04-11T07:30:00',
  },
  {
    id: 'stk-5',
    sku: 'PK-RAY-STD',
    name: 'Ray kéo tiêu chuẩn 350mm',
    uom: 'bộ',
    category: 'hardware',
    zone: 'Kho PK — lối 2',
    qtyOnHand: 22,
    qtyReserved: 12,
    qtyAvailable: 10,
    minStock: 20,
    unitCostVnd: 185_000,
    status: 'low',
    lastSyncAt: '2026-04-11T07:30:00',
  },
  {
    id: 'stk-6',
    sku: 'PVC-2-SOI',
    name: 'Cuộn PVC 2mm vân sồi',
    uom: 'cuộn',
    category: 'edge',
    zone: 'Kho C — dán cạnh',
    qtyOnHand: 31,
    qtyReserved: 9,
    qtyAvailable: 22,
    minStock: 12,
    unitCostVnd: 2_100_000,
    status: 'ok',
    lastSyncAt: '2026-04-11T06:00:00',
  },
  {
    id: 'stk-7',
    sku: 'ABS-EDGE-23',
    name: 'Cạnh ABS 23mm trắng',
    uom: 'cuộn',
    category: 'edge',
    zone: 'Kho C — dán cạnh',
    qtyOnHand: 9,
    qtyReserved: 4,
    qtyAvailable: 5,
    minStock: 8,
    unitCostVnd: 1_450_000,
    status: 'low',
    lastSyncAt: '2026-04-10T14:20:00',
  },
  {
    id: 'stk-8',
    sku: 'AC-KEO-PU',
    name: 'Keo dán cạnh PU (thùng)',
    uom: 'kg',
    category: 'adhesive',
    zone: 'Kho phụ — hóa chất',
    qtyOnHand: 48,
    qtyReserved: 11,
    qtyAvailable: 37,
    minStock: 15,
    unitCostVnd: 125_000,
    status: 'ok',
    lastSyncAt: '2026-04-11T07:30:00',
  },
  {
    id: 'stk-9',
    sku: 'VIT-INOX-40',
    name: 'Vít bắn tủ inox 4.0×16 (hộp)',
    uom: 'hộp',
    category: 'hardware',
    zone: 'Kho PK — lối 1',
    qtyOnHand: 120,
    qtyReserved: 22,
    qtyAvailable: 98,
    minStock: 30,
    unitCostVnd: 85_000,
    status: 'ok',
    lastSyncAt: '2026-04-11T07:30:00',
  },
  {
    id: 'stk-10',
    sku: 'BAN-LE-BLUM',
    name: 'Bản lề Blum clip top',
    uom: 'cái',
    category: 'hardware',
    zone: 'Kho PK — lối 3',
    qtyOnHand: 380,
    qtyReserved: 210,
    qtyAvailable: 170,
    minStock: 100,
    unitCostVnd: 42_000,
    status: 'ok',
    lastSyncAt: '2026-04-11T07:30:00',
  },
  {
    id: 'stk-11',
    sku: 'CHAN-CHIU-PL',
    name: 'Chân chịu lực tủ bếp điều chỉnh',
    uom: 'bộ',
    category: 'hardware',
    zone: 'Kho PK — lối 3',
    qtyOnHand: 8,
    qtyReserved: 6,
    qtyAvailable: 2,
    minStock: 10,
    unitCostVnd: 95_000,
    status: 'critical',
    lastSyncAt: '2026-04-09T09:10:00',
  },
  {
    id: 'stk-12',
    sku: 'NHAN-LOGO-TH',
    name: 'Nhãn logo TUNHUA (tờ)',
    uom: 'tờ',
    category: 'other',
    zone: 'Kho phụ — văn phòng SX',
    qtyOnHand: 2400,
    qtyReserved: 0,
    qtyAvailable: 2400,
    minStock: 500,
    unitCostVnd: 800,
    status: 'ok',
    lastSyncAt: '2026-04-08T11:00:00',
  },
]

export const PRODUCTION_STOCK_ROWS: ProductionStockRow[] = ROWS

export function stockCategoryLabel(c: ProductionStockCategory): string {
  const m: Record<ProductionStockCategory, string> = {
    panel: 'Ván / tấm',
    hardware: 'Phụ kiện',
    edge: 'Dán cạnh',
    adhesive: 'Keo / hóa chất',
    other: 'Khác',
  }
  return m[c]
}

export function stockStatusLabel(s: ProductionStockStatus): string {
  const m: Record<ProductionStockStatus, string> = {
    ok: 'Đủ',
    low: 'Dưới định mức',
    critical: 'Nguy cơ hụt',
  }
  return m[s]
}
