/** Mã hiển thị đơn (DH) trên xưởng — bỏ BG (báo giá). */
export function productionOrderRef(
  orderId: string,
  orderDisplayCode?: string | null,
): string {
  const code = orderDisplayCode?.trim()
  if (code && !/^BG-/i.test(code)) {
    return code
  }
  return orderId
}

export function productionOrderRefLabel(orderDisplayCode?: string | null): string | null {
  const code = orderDisplayCode?.trim()
  if (!code || /^BG-/i.test(code)) return null
  return code
}

export function productionOrderRefFromTask(task: {
  orderId?: string | null
  orderDisplayCode?: string | null
}): string | null {
  const oid = task.orderId?.trim()
  if (!oid) return null
  return productionOrderRef(oid, task.orderDisplayCode)
}

/** Lệnh trên bảng ráp tủ — giữ lệnh nội bộ hoặc lệnh gắn đơn DH (loại báo giá BG). */
export function isProductionBoardTask(task: {
  orderId?: string | null
  orderDisplayCode?: string | null
}): boolean {
  if (!task.orderId?.trim()) return true
  return productionOrderRefLabel(task.orderDisplayCode) !== null
}

export function isProductionQueueOrder(order: {
  orderDisplayCode?: string | null
}): boolean {
  return productionOrderRefLabel(order.orderDisplayCode) !== null
}
