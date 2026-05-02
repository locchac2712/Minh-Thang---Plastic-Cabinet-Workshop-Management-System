/**
 * Nhật ký tiến độ xưởng — log công việc theo ngày cho từng PRODUCTION_TASK (mock).
 * API sau: GET/POST /production/task-daily-logs với task_id, work_date, body, photos…
 */
import { PRODUCTION_INTERNAL_TASK_ROWS } from './productionTasksInternalMock'
import { PRODUCTION_TASKS_BY_ORDER_ROWS } from './productionTasksByOrderMock'

export type ProductionDailyTaskKind = 'by_order' | 'internal'

export type ProductionDailyLogEntry = {
  id: string
  /** Ngày làm việc (theo ca xưởng) */
  workDate: string
  /** Giờ ghi nhận (mock) */
  timeLocal: string
  taskKind: ProductionDailyTaskKind
  taskId: string
  taskCode: string
  /** Một dòng ngữ cảnh: đơn / thành phẩm */
  taskLabel: string
  /** Nội dung công việc đã làm */
  body: string
  authorName: string
  /** % tiến độ ước lượng tại thời điểm ghi (tùy quy ước xưởng) */
  progressPercent?: number
  /** Số ảnh đính kèm (stub) */
  photoCount: number
}

const AUTHORS = [
  'Phạm Văn Thọ',
  'Lê Thị Mai',
  'Hoàng Minh Tuấn',
  'Nguyễn Hữu Tài',
  'Tổ trưởng Xưởng',
] as const

const ORDER_BODIES: string[] = [
  'Lắp khung tủ dưới — đã căn chỉnh ray Blum, chờ gắn mặt cánh.',
  'Cắt CNC xong batch 1 — dán cạnh PVC theo quy cách màu trắng.',
  'QC sơ bộ mối dán cạnh — đạt, chuyển sang lắp phụ kiện trong ngăn.',
  'Chụp ảnh hiện trường gửi NVBH — khách xác nhận màu acrylic mặt B.',
  'Điều chỉnh lại khe cánh 2mm theo góp ý QC cuối chuyền.',
  'Đóng gói module tủ trên — dán nhãn pallet kho chờ giao.',
]

const INTERNAL_BODIES: string[] = [
  'Nesting ván tối ưu khổ — dư 1 tấm nhỏ đưa về kho scrap.',
  'Ráp khung MTS — đủ vít, chờ dán cạnh cao áp.',
  'Hoàn tất dán cạnh — chuyển sang chà nhám nhẹ trước sơn PU (nếu có).',
  'Bàn giao QC — không lỗi, chờ nhập kho TP.',
]

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!
}

function buildLogs(): ProductionDailyLogEntry[] {
  const out: ProductionDailyLogEntry[] = []
  let seq = 0

  const days = [
    '2026-04-11',
    '2026-04-10',
    '2026-04-09',
    '2026-04-08',
    '2026-04-07',
    '2026-04-06',
  ]

  const orderRows = PRODUCTION_TASKS_BY_ORDER_ROWS.slice(0, 8)
  orderRows.forEach((row, i) => {
    const d = pick(days, i)
    const d2 = pick(days, i + 2)
    seq += 1
    const hh = 7 + (i % 4)
    const mm = String(((i * 13) % 55) + 5).padStart(2, '0')
    out.push({
      id: `plog-order-${seq}`,
      workDate: d,
      timeLocal: `${hh}:${mm}`,
      taskKind: 'by_order',
      taskId: row.id,
      taskCode: row.taskCode,
      taskLabel: `${row.orderCode} · ${row.agencyShortName}`,
      body: pick(ORDER_BODIES, i),
      authorName: pick(AUTHORS, i),
      progressPercent: 25 + (i * 11) % 70,
      photoCount: i % 3,
    })
    if (i % 2 === 0) {
      seq += 1
      out.push({
        id: `plog-order-${seq}`,
        workDate: d2,
        timeLocal: `${14 + (i % 2)}:20`,
        taskKind: 'by_order',
        taskId: row.id,
        taskCode: row.taskCode,
        taskLabel: `${row.orderCode} · ${row.agencyShortName}`,
        body: pick(ORDER_BODIES, i + 3),
        authorName: pick(AUTHORS, i + 1),
        progressPercent: Math.min(95, 40 + (i * 13) % 55),
        photoCount: 1,
      })
    }
  })

  const internalRows = PRODUCTION_INTERNAL_TASK_ROWS.slice(0, 5)
  internalRows.forEach((row, i) => {
    const d = pick(days, i + 1)
    seq += 1
    out.push({
      id: `plog-int-${seq}`,
      workDate: d,
      timeLocal: `${8 + (i % 3)}:45`,
      taskKind: 'internal',
      taskId: row.id,
      taskCode: row.taskCode,
      taskLabel: `${row.sku} · ${row.productName}`,
      body: pick(INTERNAL_BODIES, i),
      authorName: pick(AUTHORS, i + 2),
      progressPercent: 20 + (i * 17) % 75,
      photoCount: i % 2,
    })
  })

  return out.sort((a, b) => {
    const da = a.workDate.localeCompare(b.workDate)
    if (da !== 0) return -da
    return b.timeLocal.localeCompare(a.timeLocal)
  })
}

export const PRODUCTION_DAILY_LOG_ENTRIES: ProductionDailyLogEntry[] = buildLogs()

export type DailyLogFilter = {
  /** `all` hoặc `by_order:<taskId>` / `internal:<taskId>` */
  taskKey: string
  /** YYYY-MM-DD hoặc rỗng = không lọc */
  fromDate: string
  toDate: string
  search: string
}

/** `taskKey`: `all` | `by_order:<id>` | `internal:<id>` */
export function filterDailyLogs(
  entries: ProductionDailyLogEntry[],
  f: DailyLogFilter,
): ProductionDailyLogEntry[] {
  const q = f.search.trim().toLowerCase()
  return entries.filter((e) => {
    if (f.taskKey !== 'all') {
      const [kind, id] = f.taskKey.split(':') as [string, string]
      if (kind === 'by_order' && (e.taskKind !== 'by_order' || e.taskId !== id)) return false
      if (kind === 'internal' && (e.taskKind !== 'internal' || e.taskId !== id)) return false
    }
    if (f.fromDate && e.workDate < f.fromDate) return false
    if (f.toDate && e.workDate > f.toDate) return false
    if (!q) return true
    return (
      e.body.toLowerCase().includes(q) ||
      e.taskCode.toLowerCase().includes(q) ||
      e.taskLabel.toLowerCase().includes(q) ||
      e.authorName.toLowerCase().includes(q)
    )
  })
}

export function taskKeyForEntry(e: ProductionDailyLogEntry): string {
  return `${e.taskKind}:${e.taskId}`
}
