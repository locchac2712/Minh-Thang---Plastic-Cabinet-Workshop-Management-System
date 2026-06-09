/** Chỉ giữ chữ số từ chuỗi nhập tiền VND. */
export function digitsOnlyVnd(raw: string): string {
  return raw.replace(/\D/g, '')
}

/** Parse số nguyên VND từ ô nhập (có thể có dấu chấm phân cách). */
export function parseVndInput(raw: string): number | null {
  const d = digitsOnlyVnd(raw)
  if (!d) return null
  const n = Number(d)
  return Number.isFinite(n) ? n : null
}

/** Format số nguyên cho ô nhập — vi-VN (1.234.567). */
export function formatVndInputAmount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return ''
  return Math.round(n).toLocaleString('vi-VN')
}

/** Chuẩn hóa khi user gõ: giữ chữ số và format lại. */
export function normalizeVndInputTyping(raw: string): string {
  const d = digitsOnlyVnd(raw)
  if (!d) return ''
  return formatVndInputAmount(Number(d))
}

/** Parse số lượng nguyên dương từ ô nhập. */
export function parseQuantityInput(raw: string): number | null {
  const d = raw.replace(/\D/g, '')
  if (!d) return null
  const n = Number(d)
  return Number.isFinite(n) && n > 0 ? n : null
}
