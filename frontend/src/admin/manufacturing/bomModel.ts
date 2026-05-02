/**
 * Định mức BOM theo thành phẩm — seed mock; persist qua BomCatalogContext.
 */
import { MOCK_MATERIALS, type Material } from './materialModel'

export type BomLine = {
  lineId: string
  materialId: string
  sku: string
  name: string
  unit: string
  qty: number
  note: string
}

function hashProductId(productId: string): number {
  let h = 0
  for (let i = 0; i < productId.length; i++) h = (h * 31 + productId.charCodeAt(i)) >>> 0
  return h
}

/** Định mức gợi ý theo thành phẩm (ổn định theo productId) */
export function seedBomLinesForProduct(productId: string): BomLine[] {
  const mats = MOCK_MATERIALS.filter((m) => m.status === 'active')
  const n = mats.length
  if (n === 0) return []

  const seed = hashProductId(productId)
  const targetCount = Math.min(4 + (seed % 3), n)
  const indices = new Set<number>()
  let k = seed
  while (indices.size < targetCount) {
    indices.add(k % n)
    k = (k * 17 + 11) >>> 0
  }

  return [...indices].map((idx, i) => {
    const m = mats[idx]
    const baseQty = 1 + ((seed + i * 23) % 18)
    return {
      lineId: `line-${productId}-${m.id}`,
      materialId: m.id,
      sku: m.sku,
      name: m.name,
      unit: m.unit,
      qty: i === 0 ? baseQty + 4 : baseQty,
      note: i === 0 ? 'Theo bản vẽ sản xuất' : '',
    }
  })
}

export function bomLineFromMaterial(productId: string, m: Material): BomLine {
  return {
    lineId: `line-${productId}-${m.id}-${Date.now().toString(36)}`,
    materialId: m.id,
    sku: m.sku,
    name: m.name,
    unit: m.unit,
    qty: 1,
    note: '',
  }
}
