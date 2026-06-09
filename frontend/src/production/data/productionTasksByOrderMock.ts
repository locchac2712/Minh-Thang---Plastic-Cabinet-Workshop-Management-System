/**
 * Lệnh sản xuất gắn đơn bán — PRODUCTION_TASKS.order_id → ORDERS (mock gắn qua mã đơn).
 * Chỉ đơn đang/ sắp vào xưởng: producing, shipping (và một phần chờ nhận lệnh).
 */
import { SELLER_LOGIN_NAME } from '../../seller/data/sellerAgenciesMock'
import { SELLER_ORDER_ROWS } from '../../seller/data/sellerOrdersMock'

export type ProductionFloorColumn = 'waiting' | 'doing' | 'done'

export type ProductionTaskByOrderRow = {
  id: string
  /** Mã lệnh xưởng (mock) */
  taskCode: string
  orderCode: string
  agencyCode: string
  agencyShortName: string
  orderSummary: string
  orderKind: 'ready_made' | 'custom'
  totalVnd: number
  lineCount: number
  /** Trạng thái đơn NVBH */
  orderStatus: 'producing' | 'shipping'
  /** Cột Kanban xưởng */
  floorStatus: ProductionFloorColumn
  sellerName: string
  /** Hạn giao ước tính (mock) */
  dueDate: string
  priority: 'normal' | 'high'
}

function buildRows(): ProductionTaskByOrderRow[] {
  const pool = SELLER_ORDER_ROWS.filter(
    (r) => r.status === 'producing' || r.status === 'shipping',
  )
  const cols: ProductionFloorColumn[] = ['waiting', 'doing', 'done']
  return pool.slice(0, 12).map((r, i) => {
    const floorStatus = cols[i % cols.length]!
    const due = new Date(r.orderedAt)
    due.setDate(due.getDate() + 14)
    const dueDate = due.toISOString().slice(0, 10)
    return {
      id: `pt-order-${r.id}`,
      taskCode: `LSX-${r.orderCode.replace(/^DH-|^BG-/, '')}`,
      orderCode: r.orderCode,
      agencyCode: r.agencyCode,
      agencyShortName: r.agencyShortName,
      orderSummary: r.summary,
      orderKind: r.orderKind,
      totalVnd: r.totalVnd,
      lineCount: r.lineCount,
      orderStatus: r.status as 'producing' | 'shipping',
      floorStatus,
      sellerName: SELLER_LOGIN_NAME,
      dueDate,
      priority: r.orderKind === 'custom' || r.totalVnd >= 80_000_000 ? 'high' : 'normal',
    }
  })
}

export const PRODUCTION_TASKS_BY_ORDER_ROWS: ProductionTaskByOrderRow[] = buildRows()

export function getProductionTaskByOrderById(id: string): ProductionTaskByOrderRow | undefined {
  return PRODUCTION_TASKS_BY_ORDER_ROWS.find((r) => r.id === id)
}

export function floorColumnLabel(c: ProductionFloorColumn): string {
  const m: Record<ProductionFloorColumn, string> = {
    waiting: 'Chờ làm',
    doing: 'Đang làm',
    done: 'Xong xưởng',
  }
  return m[c]
}

export function orderStatusShort(s: ProductionTaskByOrderRow['orderStatus']): string {
  return s === 'producing' ? 'Đang ráp' : 'Chờ giao'
}
