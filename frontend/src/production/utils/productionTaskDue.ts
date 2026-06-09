/** ISO date YYYY-MM-DD theo giờ local của trình duyệt. */
export function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export type ProductionTaskDueFields = {
  status: string
  expectedEndDate: string | null
  startDate?: string | null
  completedAt?: string | null
  overdue?: boolean | null
  overdueDays?: number | null
}

function isoDatePart(iso: string | null | undefined): string | null {
  if (!iso?.trim()) return null
  const d = iso.trim()
  return d.length >= 10 ? d.slice(0, 10) : d
}

/** Client fallback khi API chưa trả overdue (hoặc mock). */
export function resolveTaskOverdue(task: ProductionTaskDueFields): {
  overdue: boolean
  overdueDays: number
} {
  if (task.overdue === true && task.overdueDays != null && task.overdueDays > 0) {
    return { overdue: true, overdueDays: task.overdueDays }
  }
  if (task.overdue === false) {
    return { overdue: false, overdueDays: task.overdueDays ?? 0 }
  }

  const expected = isoDatePart(task.expectedEndDate)
  if (!expected) return { overdue: false, overdueDays: 0 }

  const today = todayIsoDate()
  if (task.status === 'Done') {
    const completed = isoDatePart(task.completedAt)
    if (!completed || completed <= expected) return { overdue: false, overdueDays: 0 }
    const days = Math.floor(
      (Date.parse(`${completed}T00:00:00`) - Date.parse(`${expected}T00:00:00`)) / 86_400_000,
    )
    return { overdue: days > 0, overdueDays: Math.max(0, days) }
  }

  if (expected < today) {
    const days = Math.floor(
      (Date.parse(`${today}T00:00:00`) - Date.parse(`${expected}T00:00:00`)) / 86_400_000,
    )
    return { overdue: days > 0, overdueDays: Math.max(0, days) }
  }
  return { overdue: false, overdueDays: 0 }
}

/** Nhãn chân thẻ bảng công việc / tóm tắt hạn. */
export function formatTaskDueFootLabel(task: ProductionTaskDueFields): string {
  if (task.status === 'Done' && task.completedAt) {
    const when = task.completedAt.replace('T', ' ').slice(0, 16)
    const { overdue, overdueDays } = resolveTaskOverdue(task)
    if (overdue && overdueDays > 0) {
      return `Xong ${when} · trễ ${overdueDays} ngày`
    }
    return `Xong ${when}`
  }

  const { overdue, overdueDays } = resolveTaskOverdue(task)
  if (overdue && overdueDays > 0) {
    return `Trễ ${overdueDays} ngày`
  }
  const expected = isoDatePart(task.expectedEndDate)
  if (expected) return `Hạn ${expected}`
  const start = isoDatePart(task.startDate as string | null | undefined)
  if (start) return `Bắt đầu ${start}`
  return '—'
}

/** Ô bảng — ngày hạn hoặc trễ hạn. */
export function formatTaskDueCell(task: ProductionTaskDueFields): string {
  const { overdue, overdueDays } = resolveTaskOverdue(task)
  if (overdue && overdueDays > 0) {
    return `Trễ ${overdueDays} ngày`
  }
  const expected = isoDatePart(task.expectedEndDate)
  return expected ?? '—'
}

export function isTaskDueOverdue(task: ProductionTaskDueFields): boolean {
  return resolveTaskOverdue(task).overdue
}
