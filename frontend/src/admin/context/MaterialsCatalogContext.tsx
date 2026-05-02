import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_MATERIALS, type Material } from '../manufacturing/materialModel'

type MaterialsCatalogValue = {
  materials: Material[]
  getMaterialById: (id: string) => Material | undefined
  addMaterial: (m: Material) => void
  updateMaterial: (m: Material) => void
  removeMaterial: (id: string) => void
}

const MaterialsCatalogContext = createContext<MaterialsCatalogValue | null>(null)

export function MaterialsCatalogProvider({ children }: { children: ReactNode }) {
  const [materials, setMaterials] = useState<Material[]>(() => [...MOCK_MATERIALS])

  const addMaterial = useCallback((m: Material) => {
    setMaterials((prev) => (prev.some((x) => x.id === m.id) ? prev : [m, ...prev]))
  }, [])

  const updateMaterial = useCallback((m: Material) => {
    setMaterials((prev) => prev.map((x) => (x.id === m.id ? m : x)))
  }, [])

  const removeMaterial = useCallback((id: string) => {
    setMaterials((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const getMaterialById = useCallback(
    (id: string) => materials.find((x) => x.id === id),
    [materials],
  )

  const value = useMemo(
    () => ({
      materials,
      getMaterialById,
      addMaterial,
      updateMaterial,
      removeMaterial,
    }),
    [materials, getMaterialById, addMaterial, updateMaterial, removeMaterial],
  )

  return (
    <MaterialsCatalogContext.Provider value={value}>
      {children}
    </MaterialsCatalogContext.Provider>
  )
}

export function useMaterialsCatalog(): MaterialsCatalogValue {
  const ctx = useContext(MaterialsCatalogContext)
  if (!ctx) {
    throw new Error('useMaterialsCatalog must be used within MaterialsCatalogProvider')
  }
  return ctx
}
