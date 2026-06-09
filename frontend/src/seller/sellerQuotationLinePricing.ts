/**
 * Quy tắc giá dòng báo giá (FE) — BE chỉ lưu `unitPrice` (đơn giá sau CK) và `subtotal`.
 *
 * 1. Niêm yết: `listUnitPriceVnd` = giá catalog hiện tại (`suggestedPrice`), không persist DB.
 * 2. CK %: người dùng nhập 0–100 (tối đa 2 chữ số thập phân khi hiển thị).
 * 3. Đơn giá gửi API: `unitPrice = round(list × (1 − pct/100))` (VND nguyên).
 * 4. Thành tiền dòng UI: `quantity × unitPrice` — khớp BE `subtotal = unitPrice × quantity`.
 * 5. Tổng hàng: ưu tiên `sum(items[].subtotal)` từ API sau lưu; không tự cộng lại từ % khi xem chi tiết.
 * 6. Khi mở lại: suy CK % từ `(list, unitPrice đã lưu)`; nếu `round(list×(1−pct/100)) ≠ unitPrice` → drift (đổi giá catalog / dòng cũ).
 */

export function clampDiscountPercent(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(100, Math.max(0, n))
}

export function parseDiscountPercentField(raw: string): number {
  const trimmed = raw.trim().replace(',', '.')
  if (!trimmed) return 0
  return clampDiscountPercent(Number(trimmed))
}

/** Đơn giá sau CK — giá trị duy nhất gửi lên BE. */
export function effectiveUnitFromListAndPercent(
  listUnitPriceVnd: number,
  discountPercent: number,
): number {
  const base = Math.max(0, listUnitPriceVnd)
  const pct = clampDiscountPercent(discountPercent)
  return Math.round(base * (1 - pct / 100))
}

export function lineSubtotalFromListAndPercent(
  listUnitPriceVnd: number,
  discountPercent: number,
  quantity: number,
): number {
  const qty = Math.max(0, Math.floor(quantity) || 0)
  return qty * effectiveUnitFromListAndPercent(listUnitPriceVnd, discountPercent)
}

export type ResolvedLineDiscount = {
  /** % hiển thị (0.01 bước) sao cho round-trip gần nhất với unitPrice đã lưu. */
  discountPercent: number
  /** |round(list×(1−pct/100)) − storedUnit| — 0 = khớp tuyệt đối. */
  driftVnd: number
}

/**
 * Tìm % CK sao cho `effectiveUnitFromListAndPercent` khớp `storedEffectiveUnitVnd` nếu có thể;
 * nếu không (giá niêm yết đổi), trả % gần nhất và `driftVnd > 0`.
 */
export function resolveDiscountPercentForStored(
  listUnitPriceVnd: number,
  storedEffectiveUnitVnd: number,
): ResolvedLineDiscount {
  const list = Math.max(0, listUnitPriceVnd)
  const stored = Math.max(0, storedEffectiveUnitVnd)
  if (list <= 0) {
    return { discountPercent: 0, driftVnd: 0 }
  }
  if (stored >= list) {
    return { discountPercent: 0, driftVnd: Math.abs(stored - list) }
  }

  let bestPct = 0
  let bestDrift = Math.abs(stored - list)
  for (let p = 0; p <= 10_000; p++) {
    const pct = p / 100
    const eff = effectiveUnitFromListAndPercent(list, pct)
    const drift = Math.abs(eff - stored)
    if (drift < bestDrift) {
      bestDrift = drift
      bestPct = pct
    }
    if (drift === 0) break
  }
  return { discountPercent: bestPct, driftVnd: bestDrift }
}
