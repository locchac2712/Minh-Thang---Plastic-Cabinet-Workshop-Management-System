/**
 * Định dạng số tiền (VND) + nhãn mốc thời gian theo tài liệu fe_inter.md
 */

export type ChartGranularity = 'day' | 'week' | 'month'

const vndFull = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
const vndCompact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })
const nCompact = new Intl.NumberFormat('vi-VN', { notation: 'compact', maximumFractionDigits: 1 })

export function formatVndFull(n: number): string {
  return vndFull.format(n)
}

/** Trục / tooltip: ký hiệu compact (gợi ý tài liệu). */
export function formatVndCompact(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return vndCompact.format(n) + ' đ'
}

export function formatCountCompact(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return nCompact.format(n)
}

const monthYearFmt = new Intl.DateTimeFormat('vi-VN', { month: '2-digit', year: 'numeric' })
const dayMonthFmt = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' })
const yearFmt = new Intl.DateTimeFormat('vi-VN', { year: 'numeric' })

/**
 * from/to — YYYY-MM-DD, exclusive end khi tính khoảng; return số ngày (ít nhất 0).
 */
export function daysInclusive(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + 'T12:00:00')
  const b = new Date(toIso + 'T12:00:00')
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0
  const d = Math.round((b.getTime() - a.getTime()) / 86400000) + 1
  return Math.max(0, d)
}

/** Tự chọn granularity: ≤60 ngày day, ≤365 week, còn lại month. */
export function suggestGranularity(fromIso: string, toIso: string): ChartGranularity {
  const days = daysInclusive(fromIso, toIso)
  if (days === 0) return 'day'
  if (days <= 60) return 'day'
  if (days <= 365) return 'week'
  return 'month'
}

/** ISO bucket YYYY-MM-DD (đầu bucket) → nhãn theo mức. */
export function formatBucketLabel(bucket: string, granularity: ChartGranularity): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bucket)) return bucket
  if (granularity === 'day') {
    return dayMonthFmt.format(new Date(bucket + 'T12:00:00'))
  }
  if (granularity === 'week') {
    // Tuần bắt đầu tại bucket: dd/MM
    return `Từ ${dayMonthFmt.format(new Date(bucket + 'T12:00:00'))}`
  }
  return monthYearFmt.format(new Date(bucket + 'T00:00:00'))
}

export function formatAxisMonthFromBucket(bucket: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bucket)) return bucket
  return yearFmt.format(new Date(bucket + 'T12:00:00'))
}
