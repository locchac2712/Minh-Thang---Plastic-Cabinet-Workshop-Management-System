/**
 * Cảnh báo tồn thấp — góc nhìn mua hàng / kế toán (đồng bộ tồn kho xưởng, mock).
 * API sau: GET /accountant/purchasing/low-stock-alerts
 */
import {
  PRODUCTION_STOCK_ROWS,
  type ProductionStockRow,
} from '../../production/data/productionStockMock'

export type AccountantLowStockSeverity = 'low' | 'critical'

export type AccountantLowStockAlert = {
  id: string
  sku: string
  name: string
  uom: string
  severity: AccountantLowStockSeverity
  zone: string
  qtyOnHand: number
  qtyReserved: number
  qtyAvailable: number
  minStock: number
  /** Thiếu so với định mức (min − khả dụng, ≥ 0) */
  gapQty: number
  /** Đề xuất đặt mua (mock: làm tròn gói) */
  suggestedPoQty: number
  supplierCode: string
  supplierName: string
  leadTimeDays: number
  unitCostVnd: number
  /** Giá trị dòng đề xuất PO */
  lineValueVnd: number
  lastPoAt: string | null
}

function severityFromStock(s: ProductionStockRow['status']): AccountantLowStockSeverity {
  return s === 'critical' ? 'critical' : 'low'
}

function suggestedQty(r: ProductionStockRow, gap: number): number {
  const buffer = Math.max(3, Math.ceil(r.minStock * 0.25))
  const raw = gap + buffer
  if (r.uom === 'tấm') return Math.max(gap, Math.ceil(raw / 2) * 2)
  if (r.uom === 'bộ' || r.uom === 'hộp') return Math.max(gap, Math.ceil(raw))
  return Math.max(gap, Math.ceil(raw))
}

const SUPPLIERS: { code: string; name: string; lead: number }[] = [
  { code: 'NCC-VL-01', name: 'TNHH Ván An Phát', lead: 5 },
  { code: 'NCC-PK-02', name: 'Blum Việt Nam (Đại lý)', lead: 14 },
  { code: 'NCC-HC-03', name: 'Hóa chất Tín Phát', lead: 3 },
]

function pickSupplier(i: number) {
  return SUPPLIERS[i % SUPPLIERS.length]!
}

function build(): AccountantLowStockAlert[] {
  return PRODUCTION_STOCK_ROWS.filter((r) => r.status !== 'ok').map((r, i) => {
    const gapQty = Math.max(0, r.minStock - r.qtyAvailable)
    const sug = suggestedQty(r, gapQty)
    const sup = pickSupplier(i)
    const lineValueVnd = sug * r.unitCostVnd
    return {
      id: `acc-ls-${r.id}`,
      sku: r.sku,
      name: r.name,
      uom: r.uom,
      severity: severityFromStock(r.status),
      zone: r.zone,
      qtyOnHand: r.qtyOnHand,
      qtyReserved: r.qtyReserved,
      qtyAvailable: r.qtyAvailable,
      minStock: r.minStock,
      gapQty,
      suggestedPoQty: sug,
      supplierCode: sup.code,
      supplierName: sup.name,
      leadTimeDays: sup.lead,
      unitCostVnd: r.unitCostVnd,
      lineValueVnd,
      lastPoAt: i % 2 === 0 ? '2026-03-28' : '2026-04-02',
    }
  })
}

export const ACCOUNTANT_LOW_STOCK_ALERTS: AccountantLowStockAlert[] = build()

export function alertSeverityLabel(s: AccountantLowStockSeverity): string {
  return s === 'critical' ? 'Khẩn — nguy cơ hụt' : 'Dưới định mức'
}
