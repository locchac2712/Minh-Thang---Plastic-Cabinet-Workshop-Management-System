export type OrderActivityLogDto = {
  id: string
  taskId: string
  taskDisplayCode?: string | null
  userId: string
  userName: string
  imageUrl: string | null
  description: string
  createdAt: string
}

export type OrderProductionTaskDto = {
  taskId: string
  displayCode?: string | null
  orderItemId: string | null
  orderId: string
  productId: string | null
  productName: string | null
  quantity: number
  assignedToId: string | null
  assignedToName: string | null
  status: 'Waiting' | 'Doing' | 'Done'
  startDate: string | null
  expectedEndDate: string | null
  completedAt: string | null
  deliveredAt: string | null
  deliveryAddress?: string | null
  deliveryProofImageUrl?: string | null
  deliverable: boolean
  taskCreatedAt: string
  activityLogs: OrderActivityLogDto[]
}

export type OrderFulfillmentLineDto = {
  orderItemId: string
  productId: string
  productName: string
  orderedQuantity: number
  batchedQuantity: number
  deliveredQuantity: number
  remainingToBatch: number
  remainingToDeliver: number
}

export type OrderFulfillmentSummaryDto = {
  orderId: string
  status: string
  lines: OrderFulfillmentLineDto[]
}

export function productionTaskStatusLabel(status: OrderProductionTaskDto['status']): string {
  const m: Record<OrderProductionTaskDto['status'], string> = {
    Waiting: 'Chờ nhận',
    Doing: 'Đang làm',
    Done: 'Hoàn tất',
  }
  return m[status] ?? status
}

export function orderProductionTaskRef(
  task: Pick<OrderProductionTaskDto, 'taskId' | 'displayCode'>,
): string {
  const code = task.displayCode?.trim()
  return code || task.taskId
}

/** @deprecated Dùng orderProductionTaskRef — giữ cho tương thích mock. */
export function shortTaskRef(taskId: string): string {
  const s = taskId.trim()
  return s.length > 8 ? s.slice(0, 8) : s
}
