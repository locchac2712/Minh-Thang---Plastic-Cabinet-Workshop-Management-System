/**
 * Thẻ bảng ráp tủ (Kanban) — gắn đơn NVBH; cùng nguồn với PRODUCTION_TASKS_BY_ORDER.
 */
import {
  PRODUCTION_TASKS_BY_ORDER_ROWS,
  type ProductionFloorColumn,
  type ProductionTaskByOrderRow,
} from './productionTasksByOrderMock'

export type AssemblyBoardCard = {
  id: string
  taskCode: string
  orderCode: string
  agencyShortName: string
  orderSummary: string
  floorStatus: ProductionFloorColumn
  dueDate: string
  priority: ProductionTaskByOrderRow['priority']
}

export function toAssemblyBoardCards(rows: ProductionTaskByOrderRow[]): AssemblyBoardCard[] {
  return rows.map((r) => ({
    id: r.id,
    taskCode: r.taskCode,
    orderCode: r.orderCode,
    agencyShortName: r.agencyShortName,
    orderSummary: r.orderSummary,
    floorStatus: r.floorStatus,
    dueDate: r.dueDate,
    priority: r.priority,
  }))
}

export const ASSEMBLY_BOARD_CARDS: AssemblyBoardCard[] = toAssemblyBoardCards(
  PRODUCTION_TASKS_BY_ORDER_ROWS,
)

export function uniqueOrderOptions(cards: AssemblyBoardCard[]): { code: string; label: string }[] {
  const seen = new Set<string>()
  const out: { code: string; label: string }[] = []
  for (const c of cards) {
    if (seen.has(c.orderCode)) continue
    seen.add(c.orderCode)
    out.push({
      code: c.orderCode,
      label: `${c.orderCode} · ${c.agencyShortName}`,
    })
  }
  return out.sort((a, b) => a.code.localeCompare(b.code, 'vi'))
}
