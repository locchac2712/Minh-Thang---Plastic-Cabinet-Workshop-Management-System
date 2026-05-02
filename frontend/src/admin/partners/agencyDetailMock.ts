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
      orderRef: `SO-B2B-2026-${String(1200 + (k % 400)).padStart(4, '0')}`,
      orderDate: '07/04/2026',
      amountVnd: base,
      statusLabel: 'Đang xử lý SX',
    },
    {
      id: `${a.id}-so2`,
      orderRef: `SO-B2B-2026-${String(900 + (k % 200)).padStart(4, '0')}`,
      orderDate: '22/03/2026',
      amountVnd: Math.floor(base * 0.62),
      statusLabel: 'Đã giao — chờ đối soát',
    },
    {
      id: `${a.id}-so3`,
      orderRef: `SO-B2B-2025-${String(4400 + (k % 100)).padStart(4, '0')}`,
      orderDate: '15/12/2025',
      amountVnd: Math.floor(base * 1.15),
      statusLabel: 'Hoàn tất',
    },
  ]
}

export function formatOrderAmount(n: number): string {
  return formatVND(n)
}
