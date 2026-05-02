import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Material } from '../manufacturing/materialModel'
import {
  bomLineFromMaterial,
  seedBomLinesForProduct,
  type BomLine,
} from '../manufacturing/bomModel'

type BomCatalogValue = {
  /** Luôn trả về snapshot hiện tại (đã chỉnh sửa hoặc seed) */
  getBom: (productId: string) => BomLine[]
  setBomLines: (productId: string, lines: BomLine[]) => void
  updateLineQty: (productId: string, lineId: string, qty: number) => void
  updateLineNote: (productId: string, lineId: string, note: string) => void
  removeLine: (productId: string, lineId: string) => void
  addMaterial: (productId: string, material: Material) => void
  resetToSeed: (productId: string) => void
}

const BomCatalogContext = createContext<BomCatalogValue | null>(null)

export function BomCatalogProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<Record<string, BomLine[]>>({})

  const getBom = useCallback(
    (productId: string) => {
      if (Object.prototype.hasOwnProperty.call(overrides, productId)) {
        return overrides[productId]
      }
      return seedBomLinesForProduct(productId)
    },
    [overrides],
  )

  const setBomLines = useCallback((productId: string, lines: BomLine[]) => {
    setOverrides((prev) => ({ ...prev, [productId]: lines }))
  }, [])

  const updateLineQty = useCallback((productId: string, lineId: string, qty: number) => {
    const safe = Math.max(0.001, Number.isFinite(qty) ? qty : 0)
    setOverrides((prev) => {
      const base = prev[productId] ?? seedBomLinesForProduct(productId)
      const next = base.map((l) => (l.lineId === lineId ? { ...l, qty: safe } : l))
      return { ...prev, [productId]: next }
    })
  }, [])

  const updateLineNote = useCallback((productId: string, lineId: string, note: string) => {
    setOverrides((prev) => {
      const base = prev[productId] ?? seedBomLinesForProduct(productId)
      const next = base.map((l) => (l.lineId === lineId ? { ...l, note } : l))
      return { ...prev, [productId]: next }
    })
  }, [])

  const removeLine = useCallback((productId: string, lineId: string) => {
    setOverrides((prev) => {
      const base = prev[productId] ?? seedBomLinesForProduct(productId)
      const next = base.filter((l) => l.lineId !== lineId)
      return { ...prev, [productId]: next }
    })
  }, [])

  const addMaterial = useCallback((productId: string, material: Material) => {
    setOverrides((prev) => {
      const base = prev[productId] ?? seedBomLinesForProduct(productId)
      if (base.some((l) => l.materialId === material.id)) {
        return prev
      }
      return {
        ...prev,
        [productId]: [...base, bomLineFromMaterial(productId, material)],
      }
    })
  }, [])

  const resetToSeed = useCallback((productId: string) => {
    setOverrides((prev) => {
      const next = { ...prev }
      delete next[productId]
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      getBom,
      setBomLines,
      updateLineQty,
      updateLineNote,
      removeLine,
      addMaterial,
      resetToSeed,
    }),
    [
      getBom,
      setBomLines,
      updateLineQty,
      updateLineNote,
      removeLine,
      addMaterial,
      resetToSeed,
    ],
  )

  return <BomCatalogContext.Provider value={value}>{children}</BomCatalogContext.Provider>
}

export function useBomCatalog(): BomCatalogValue {
  const ctx = useContext(BomCatalogContext)
  if (!ctx) {
    throw new Error('useBomCatalog must be used within BomCatalogProvider')
  }
  return ctx
}
