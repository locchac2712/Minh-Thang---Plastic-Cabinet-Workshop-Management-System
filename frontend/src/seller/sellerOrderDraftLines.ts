/** Dòng nháp đơn/báo giá — gộp SL khi chọn trùng sản phẩm thay vì thêm dòng mới. */

export type DraftLineWithProduct = {
  id: string
  productId?: string
  productName: string
  qty: number
}

export function findDuplicateProductLine<T extends DraftLineWithProduct>(
  lines: T[],
  productId: string,
  excludeLineId?: string,
  match?: (line: T) => boolean,
): T | undefined {
  return lines.find(
    (ln) =>
      ln.productId === productId &&
      ln.id !== excludeLineId &&
      (match ? match(ln) : true),
  )
}

/** Cộng thêm qtyIncrement vào dòng đã có cùng productId. */
export function bumpProductLineQty<T extends DraftLineWithProduct>(
  lines: T[],
  productId: string,
  qtyIncrement = 1,
  match?: (line: T) => boolean,
): { next: T[]; merged: boolean; mergedLine?: T } {
  const existing = findDuplicateProductLine(lines, productId, undefined, match)
  if (!existing) return { next: lines, merged: false }
  return {
    merged: true,
    mergedLine: existing,
    next: lines.map((ln) =>
      ln.id === existing.id ? { ...ln, qty: ln.qty + qtyIncrement } : ln,
    ),
  }
}

/**
 * Gộp dòng `sourceLineId` vào dòng trùng productId khác (đổi SP trên dropdown).
 * Trả về null nếu không có dòng trùng.
 */
export function mergeDraftLineIntoDuplicate<T extends DraftLineWithProduct>(
  lines: T[],
  sourceLineId: string,
  productId: string,
  match?: (line: T) => boolean,
): { next: T[]; targetLine: T } | null {
  const source = lines.find((ln) => ln.id === sourceLineId)
  const target = findDuplicateProductLine(lines, productId, sourceLineId, match)
  if (!source || !target) return null
  const addQty = Math.max(1, source.qty)
  return {
    targetLine: target,
    next: lines
      .filter((ln) => ln.id !== sourceLineId)
      .map((ln) => (ln.id === target.id ? { ...ln, qty: ln.qty + addQty } : ln)),
  }
}
