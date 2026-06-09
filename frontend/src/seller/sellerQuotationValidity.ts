/** Ngày lịch hôm nay theo ISO YYYY-MM-DD (local browser). */
export function todayIsoDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIsoDate(value: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null
  return { y, m: mo, d }
}

function compareIsoDates(a: string, b: string): number {
  const pa = parseIsoDate(a)
  const pb = parseIsoDate(b)
  if (!pa || !pb) return 0
  if (pa.y !== pb.y) return pa.y - pb.y
  if (pa.m !== pb.m) return pa.m - pb.m
  return pa.d - pb.d
}

export function isQuotationExpired(
  validUntil: string | null | undefined,
  todayIso?: string,
): boolean {
  const until = validUntil?.trim()
  if (!until) return false
  const today = todayIso ?? todayIsoDate()
  return compareIsoDates(until, today) < 0
}

export function isQuotationExpiringSoon(
  validUntil: string | null | undefined,
  withinDays = 3,
  todayIso?: string,
): boolean {
  const until = validUntil?.trim()
  if (!until || withinDays < 0) return false
  const today = todayIso ?? todayIsoDate()
  const cmp = compareIsoDates(until, today)
  if (cmp < 0) return false
  if (cmp === 0) return true
  const start = parseIsoDate(today)
  const end = parseIsoDate(until)
  if (!start || !end) return false
  const startMs = Date.UTC(start.y, start.m - 1, start.d)
  const endMs = Date.UTC(end.y, end.m - 1, end.d)
  const diffDays = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000))
  return diffDays <= withinDays
}

export type QuotationValidityLabel = 'none' | 'active' | 'expiring_soon' | 'expired'

export function quotationValidityLabel(
  validUntil: string | null | undefined,
  todayIso?: string,
): QuotationValidityLabel {
  const until = validUntil?.trim()
  if (!until) return 'none'
  if (isQuotationExpired(until, todayIso)) return 'expired'
  if (isQuotationExpiringSoon(until, 3, todayIso)) return 'expiring_soon'
  return 'active'
}

export function quotationValidityContextHint(
  validUntil: string | null | undefined,
  todayIso?: string,
): string | null {
  const label = quotationValidityLabel(validUntil, todayIso)
  if (label === 'expired') {
    return 'Báo giá đã hết hạn hiệu lực. Bạn vẫn có thể gửi duyệt theo quy trình hiện tại.'
  }
  if (label === 'expiring_soon') {
    return 'Báo giá sắp hết hạn hiệu lực.'
  }
  return null
}

/** Lỗi hiển thị khi người dùng chọn hạn báo giá; null = hợp lệ hoặc để trống. */
export function validateQuotationValidUntilInput(
  validUntil: string | null | undefined,
  todayIso?: string,
): string | null {
  const until = validUntil?.trim()
  if (!until) return null
  if (!parseIsoDate(until)) return 'Ngày hạn báo giá không hợp lệ.'
  if (isQuotationExpired(until, todayIso)) {
    return 'Hạn báo giá không được là ngày trong quá khứ.'
  }
  return null
}
