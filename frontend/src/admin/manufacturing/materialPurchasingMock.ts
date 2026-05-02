/**
 * Mock đơn đặt mua & NCC theo vật tư — thay bằng API khi tích hợp mua hàng.
 */
import type { Material } from './materialModel'
import { formatQty } from './materialModel'

export type MaterialPoStatus =
  | 'awaiting_supplier'
  | 'confirmed'
  | 'partial'
  | 'draft_internal'

export type MaterialPurchaseOrderRow = {
  id: string
  poNumber: string
  supplierName: string
  orderDate: string
  expectedDate: string
  qtyOrdered: string
  qtyReceived: string
  status: MaterialPoStatus
  statusLabel: string
}

export type MaterialSupplierRow = {
  id: string
  name: string
  isPrimary: boolean
  roleLabel: string
  leadTimeDays: number
  lastPriceNote: string
  contact: string
  note?: string
}

const ALT_SUPPLIER_POOL = [
  'An Phát Deco',
  'Blum VN',
  'Häfele HCMC',
  'Nhựa Đông Á',
  'Kính Hải Long',
  'Kho tổng — điều chuyển nội bộ',
  'Thương mại Tín Phát',
] as const

function seed(m: Material): number {
  let h = 0
  for (let i = 0; i < m.id.length; i++) h = (h * 31 + m.id.charCodeAt(i)) >>> 0
  return h
}

const PO_STATUS_LABEL: Record<MaterialPoStatus, string> = {
  draft_internal: 'Nháp nội bộ',
  awaiting_supplier: 'Chờ NCC xác nhận',
  confirmed: 'Đã xác nhận — chờ giao',
  partial: 'Giao một phần',
}

/** Đơn mua đang mở (chưa nhận đủ) — mock theo vật tư */
export function mockOpenPurchaseOrdersForMaterial(m: Material): MaterialPurchaseOrderRow[] {
  if (m.status === 'discontinued') {
    return []
  }
  const s = seed(m)
  const u = m.unit
  const baseQty = 40 + (s % 120)
  const q1 = baseQty
  const q2 = Math.max(12, Math.floor(baseQty * 0.45))
  const recvPartial = Math.floor(q1 * 0.35)

  const rows: MaterialPurchaseOrderRow[] = []

  const pushRow = (
    poIndex: number,
    status: MaterialPoStatus,
    qtyOrd: number,
    qtyRec: number,
  ) => {
    const sup =
      poIndex % 2 === 0
        ? m.primarySupplier
        : ALT_SUPPLIER_POOL[s % ALT_SUPPLIER_POOL.length]
    rows.push({
      id: `${m.id}-po-${poIndex}`,
      poNumber: `PO-2026-${String(180 + ((s + poIndex * 7) % 800)).padStart(4, '0')}`,
      supplierName: sup,
      orderDate: poIndex === 0 ? '09/04/2026' : '05/04/2026',
      expectedDate: poIndex === 0 ? '18/04/2026' : '14/04/2026',
      qtyOrdered: formatQty(qtyOrd, u),
      qtyReceived: formatQty(qtyRec, u),
      status,
      statusLabel: PO_STATUS_LABEL[status],
    })
  }

  // Luôn có 1–3 dòng tùy seed
  const variant = s % 3
  if (variant === 0) {
    pushRow(0, 'partial', q1, recvPartial)
    pushRow(1, 'awaiting_supplier', q2, 0)
  } else if (variant === 1) {
    pushRow(0, 'confirmed', q1, 0)
  } else {
    pushRow(0, 'draft_internal', q2, 0)
    pushRow(1, 'confirmed', Math.max(20, q1 - 15), 0)
  }

  return rows
}

function pickAlts(primary: string, count: number, seedVal: number): string[] {
  const pool = ALT_SUPPLIER_POOL.filter((n) => n !== primary)
  const out: string[] = []
  let i = seedVal % Math.max(1, pool.length)
  let guard = 0
  while (out.length < count && guard < pool.length * 2) {
    const name = pool[i % pool.length]
    if (!out.includes(name)) out.push(name)
    i++
    guard++
  }
  return out
}

/** NCC đang cung cấp mã này (chính + dự phòng) — mock */
export function mockSuppliersForMaterial(m: Material): MaterialSupplierRow[] {
  const s = seed(m)
  const alts = pickAlts(m.primarySupplier, 2, s)

  const rows: MaterialSupplierRow[] = [
    {
      id: `${m.id}-sup-primary`,
      name: m.primarySupplier,
      isPrimary: true,
      roleLabel: 'NCC chính / hợp đồng khung',
      leadTimeDays: m.leadTimeDays,
      lastPriceNote: 'Theo báo giá Q2/2026',
      contact: '0938 ••• ••• (KD)',
      note: 'Ưu tiên cho đơn sản xuất series tủ bếp',
    },
  ]

  alts.forEach((name, i) => {
    rows.push({
      id: `${m.id}-sup-alt-${i}`,
      name,
      isPrimary: false,
      roleLabel: i === 0 ? 'NCC dự phòng' : 'Nguồn thay thế / spot',
      leadTimeDays: m.leadTimeDays + 2 + ((s + i) % 5),
      lastPriceNote: (s + i) % 2 === 0 ? 'Liên hệ theo lô' : '—',
      contact: '028 •••• ••••',
    })
  })

  return rows
}
