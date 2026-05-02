import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { MOCK_PRODUCTS, type Product } from '../catalog/productModel'

type ProductsCatalogValue = {
  products: Product[]
  getProductById: (id: string) => Product | undefined
  addProduct: (p: Product) => void
  updateProduct: (p: Product) => void
  removeProduct: (id: string) => void
}

const ProductsCatalogContext = createContext<ProductsCatalogValue | null>(null)

export function ProductsCatalogProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => [...MOCK_PRODUCTS])

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products],
  )

  const addProduct = useCallback((p: Product) => {
    setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]))
  }, [])

  const updateProduct = useCallback((p: Product) => {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)))
  }, [])

  const removeProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((x) => x.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      products,
      getProductById,
      addProduct,
      updateProduct,
      removeProduct,
    }),
    [products, getProductById, addProduct, updateProduct, removeProduct],
  )

  return (
    <ProductsCatalogContext.Provider value={value}>
      {children}
    </ProductsCatalogContext.Provider>
  )
}

export function useProductsCatalog(): ProductsCatalogValue {
  const ctx = useContext(ProductsCatalogContext)
  if (!ctx) {
    throw new Error('useProductsCatalog must be used within ProductsCatalogProvider')
  }
  return ctx
}
