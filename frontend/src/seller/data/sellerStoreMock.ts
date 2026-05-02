/**
 * Dữ liệu storefront Seller — dựa trên catalog admin + tồn kho giao ngay (mock).
 */
import {
  type Product,
  MOCK_PRODUCTS,
} from '../../admin/catalog/productModel'

export type SellerStoreProduct = Product & {
  /** SL có thể bán / giao ngay (mock kho) */
  stockQty: number
  /** Khi lấy từ API — hiển thị ngành hàng thật (categoryId có thể là UUID) */
  categoryName?: string
}

function mockStockFromId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) % 997
  }
  return h % 14
}

export function toSellerStoreProduct(p: Product): SellerStoreProduct {
  return {
    ...p,
    stockQty: mockStockFromId(p.id),
  }
}

/** Chỉ mẫu đang niêm yết — Sale bán tủ sẵn */
export const SELLER_STORE_PRODUCTS: SellerStoreProduct[] = MOCK_PRODUCTS.filter(
  (p) => p.status === 'active',
).map(toSellerStoreProduct)
