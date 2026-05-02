import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_SUPPLIERS, type Supplier } from '../partners/supplierModel'

type SuppliersCatalogValue = {
  suppliers: Supplier[]
  getSupplierById: (id: string) => Supplier | undefined
  updateSupplier: (s: Supplier) => void
  addSupplier: (s: Supplier) => void
  removeSupplier: (id: string) => void
}

const SuppliersCatalogContext = createContext<SuppliersCatalogValue | null>(null)

export function SuppliersCatalogProvider({ children }: { children: ReactNode }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => [...MOCK_SUPPLIERS])

  const getSupplierById = useCallback(
    (id: string) => suppliers.find((x) => x.id === id),
    [suppliers],
  )

  const addSupplier = useCallback((s: Supplier) => {
    setSuppliers((prev) => (prev.some((x) => x.id === s.id) ? prev : [s, ...prev]))
  }, [])

  const updateSupplier = useCallback((s: Supplier) => {
    setSuppliers((prev) => prev.map((x) => (x.id === s.id ? s : x)))
  }, [])

  const removeSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      suppliers,
      getSupplierById,
      addSupplier,
      updateSupplier,
      removeSupplier,
    }),
    [suppliers, getSupplierById, addSupplier, updateSupplier, removeSupplier],
  )

  return (
    <SuppliersCatalogContext.Provider value={value}>
      {children}
    </SuppliersCatalogContext.Provider>
  )
}

export function useSuppliersCatalog(): SuppliersCatalogValue {
  const ctx = useContext(SuppliersCatalogContext)
  if (!ctx) {
    throw new Error('useSuppliersCatalog must be used within SuppliersCatalogProvider')
  }
  return ctx
}
