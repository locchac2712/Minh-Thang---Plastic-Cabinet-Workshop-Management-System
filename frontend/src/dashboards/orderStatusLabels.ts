/** Nhãn gợi ý cho tên trạng thái từ BE (tài liệu fe — tiếng Anh). */
const ORDER_STATUS_VI: Record<string, string> = {
  draft: 'Nháp',
  Draft: 'Nháp',
  DRAFT: 'Nháp',
  pending: 'Chờ duyệt',
  Pending: 'Chờ duyệt',
  PENDING: 'Chờ duyệt',
  approved: 'Đã duyệt',
  Approved: 'Đã duyệt',
  APPROVED: 'Đã duyệt',
  producing: 'Đang sản xuất',
  Producing: 'Đang sản xuất',
  PRODUCING: 'Đang sản xuất',
  done: 'Hoàn tất',
  Done: 'Hoàn tất',
  DONE: 'Hoàn tất',
  done_lower: 'Hoàn tất',
  canceled: 'Đã hủy',
  Canceled: 'Đã hủy',
  CANCELED: 'Đã hủy',
  // Production task
  doing: 'Đang làm',
  Doing: 'Đang làm',
  DOING: 'Đang làm',
  waiting: 'Chờ xử lý',
  Waiting: 'Chờ xử lý',
  WAITING: 'Chờ xử lý',
  Done_task: 'Hoàn thành',
  WAITING_T: 'Chờ xử lý',
  Done_production: 'Hoàn thành',
}

export function orderStatusLabelVi(name: string): string {
  const t = (name ?? '').trim()
  return ORDER_STATUS_VI[t] ?? ORDER_STATUS_VI[t.toLowerCase() as string] ?? t
}

const PIPELINE_ORDER = ['Draft', 'Pending', 'Approved', 'Producing', 'Done'] as const
export const PIPELINE_ORDER_EN = ['Draft', 'Pending', 'Approved', 'Producing', 'Done'] as const

export function sortPipelineFunnel(
  points: { name: string; value: number; count: number }[],
): { name: string; value: number; count: number }[] {
  const m = new Map(points.map((p) => [p.name, p]))
  return PIPELINE_ORDER.map((key) => {
    return m.get(key) ?? { name: key, value: 0, count: 0 }
  })
}

export function orderStatusColor(name: string): string {
  const t = (name || '').toLowerCase()
  if (t === 'done') return '#22c55e'
  if (t === 'producing' || t === 'doing') return '#38bdf8'
  if (t === 'pending' || t === 'approved') return '#f59e0b'
  if (t === 'draft' || t === 'waiting') return '#94a3b8'
  if (t === 'canceled') return '#ef4444'
  return '#64748b'
}

export function taskStatusColor(name: string): string {
  return orderStatusColor(
    name.toLowerCase() === 'waiting' ? 'draft' : name.toLowerCase() === 'done' ? 'done' : name.toLowerCase() === 'doing' ? 'producing' : name,
  )
}
