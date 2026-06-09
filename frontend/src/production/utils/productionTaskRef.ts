/** Mã hiển thị lệnh SX (LSX) — fallback UUID khi API chưa có displayCode. */
export function productionTaskRef(task: {
  id: string
  displayCode?: string | null
}): string {
  const code = task.displayCode?.trim()
  return code || task.id
}

export function productionTaskRefFromId(
  taskId: string,
  displayCode?: string | null,
): string {
  const code = displayCode?.trim()
  return code || taskId
}
