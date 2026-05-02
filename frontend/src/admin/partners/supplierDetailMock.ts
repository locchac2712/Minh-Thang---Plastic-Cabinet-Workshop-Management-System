/**
 * Mock PO / chứng từ theo NCC — thay API mua hàng sau.
 */
import type { Material } from '../manufacturing/materialModel'
import type { Supplier } from './supplierModel'
import { formatVND } from './supplierModel'

/** Vật tư có NCC chính trùng tên (master) — dùng `name` từ API hoặc tên mock */
export function materialsSuppliedBySupplierName(
  supplierDisplayName: string,
  all: Material[],
): Material[] {
  const n = supplierDisplayName.trim().toLowerCase()
  return all.filter((m) => m.primarySupplier.trim().toLowerCase() === n)
}

/** Vật tư có NCC chính trùng tên ngắn (master) */
export function materialsSuppliedBySupplier(s: Supplier, all: Material[]): Material[] {
  return materialsSuppliedBySupplierName(s.shortName, all)
}

export type SupplierPoRow = {
  id: string
  poNumber: string
  orderDate: string
  expectedDate: string
  amountVnd: number
  statusLabel: string
}

function seedFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

export function mockPurchaseOrdersForSupplier(s: Supplier | { id: string }): SupplierPoRow[] {
  const k = seedFromId(s.id)
  const base = 45_000_000 + (k % 120) * 1_000_000
  return [
    {
      id: `${s.id}-po1`,
      poNumber: `PO-2026-${String(2100 + (k % 700)).padStart(4, '0')}`,
      orderDate: '08/04/2026',
      expectedDate: '20/04/2026',
      amountVnd: base,
      statusLabel: 'NCC xác nhận — chờ giao',
    },
    {
      id: `${s.id}-po2`,
      poNumber: `PO-2026-${String(1800 + (k % 500)).padStart(4, '0')}`,
      orderDate: '28/03/2026',
      expectedDate: '05/04/2026',
      amountVnd: Math.floor(base * 0.42),
      statusLabel: 'Giao một phần',
    },
  ]
}

export function formatPoAmount(n: number): string {
  return formatVND(n)
}
