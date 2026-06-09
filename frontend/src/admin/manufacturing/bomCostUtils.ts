/** Dòng BOM từ API admin — có thể kèm materialUnitCost. */
export type BomLineWithCost = {
  materialId: string
  quantity: number
  materialUnitCost?: number | null
}

export type BomDraftLineLike = {
  materialId: string
  quantity: number
}

export function resolveMaterialUnitCost(
  materialId: string,
  costById: Record<string, number | undefined>,
): number | null {
  if (!materialId) return null
  const c = costById[materialId]
  return c == null ? null : c
}

export function bomLineCostVnd(quantity: number, unitCost: number | null | undefined): number | null {
  if (unitCost == null || !Number.isFinite(quantity) || quantity <= 0) return null
  return Math.round(quantity * unitCost)
}

export function buildBomUnitCostMap(
  bomRows: BomLineWithCost[],
  materialUnitCosts: Record<string, number>,
  supplemental: Record<string, number>,
): Record<string, number | undefined> {
  const m: Record<string, number | undefined> = { ...materialUnitCosts, ...supplemental }
  for (const row of bomRows) {
    if (row.materialId && row.materialUnitCost != null) {
      m[row.materialId] = row.materialUnitCost
    }
  }
  return m
}

export type BomCostSumResult =
  | { ok: true; total: number }
  | { ok: false; reason: 'empty' | 'incomplete' }

export function trySumBomCostVnd(
  lines: BomDraftLineLike[],
  costById: Record<string, number | undefined>,
): BomCostSumResult {
  if (lines.length === 0) return { ok: false, reason: 'empty' }
  let t = 0
  for (const ln of lines) {
    if (!ln.materialId) return { ok: false, reason: 'incomplete' }
    const c = costById[ln.materialId]
    if (c == null) return { ok: false, reason: 'incomplete' }
    t += ln.quantity * c
  }
  return { ok: true, total: Math.round(t) }
}
