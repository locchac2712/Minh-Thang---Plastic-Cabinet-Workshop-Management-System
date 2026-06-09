/**
 * Mock đơn hàng B2B / chứng từ theo khách sỉ — thay API sau.
 */
import type { Agency } from './agencyModel'
import { formatVND } from './agencyModel'

export type AgencyOrderRow = {
  id: string
  orderRef: string
  orderDate: string
  amountVnd: number
  statusLabel: string
  /** Mã trạng thái BE — dùng badge màu (Draft, Pending, …). */
  status?: string
  recordKind?: 'quotation' | 'fulfillment'
}

function seed(a: Agency): number {
  let h = 0
  for (let i = 0; i < a.id.length; i++) h = (h * 31 + a.id.charCodeAt(i)) >>> 0
  return h
}

export function mockRecentOrdersForAgency(a: Agency): AgencyOrderRow[] {
  const k = seed(a)
  const base = 28_000_000 + (k % 80) * 1_000_000
  return [
    {
      id: `${a.id}-so1`,
      orderRef: `DH-2026-${String(1200 + (k % 400)).padStart(5, '0')}`,
      orderDate: '07/04/2026',
      amountVnd: base,
      statusLabel: 'Đang sản xuất',
      status: 'Producing',
      recordKind: 'fulfillment',
    },
    {
      id: `${a.id}-so2`,
      orderRef: `DH-2026-${String(900 + (k % 200)).padStart(5, '0')}`,
      orderDate: '22/03/2026',
      amountVnd: Math.floor(base * 0.62),
      statusLabel: 'Đã duyệt chờ SX',
      status: 'Approved',
      recordKind: 'fulfillment',
    },
    {
      id: `${a.id}-so3`,
      orderRef: `DH-2025-${String(4400 + (k % 100)).padStart(5, '0')}`,
      orderDate: '15/12/2025',
      amountVnd: Math.floor(base * 1.15),
      statusLabel: 'Hoàn tất',
      status: 'Done',
      recordKind: 'fulfillment',
    },
  ]
}

export function mockRecentQuotationsForAgency(a: Agency): AgencyOrderRow[] {
  const k = seed(a)
  const base = 18_000_000 + (k % 60) * 800_000
  return [
    {
      id: `${a.id}-bg1`,
      orderRef: `BG-2026-${String(200 + (k % 300)).padStart(5, '0')}`,
      orderDate: '10/04/2026',
      amountVnd: base,
      statusLabel: 'Chờ duyệt',
      status: 'Pending',
      recordKind: 'quotation',
    },
    {
      id: `${a.id}-bg2`,
      orderRef: `BG-2026-${String(80 + (k % 120)).padStart(5, '0')}`,
      orderDate: '01/03/2026',
      amountVnd: Math.floor(base * 0.75),
      statusLabel: 'Đã duyệt',
      status: 'Approved',
      recordKind: 'quotation',
    },
  ]
}

export function formatOrderAmount(n: number): string {
  return formatVND(n)
}
