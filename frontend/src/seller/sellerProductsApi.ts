import { DEFAULT_PRODUCT_IMAGE_URL, type Product } from '../admin/catalog/productModel'
import { getAccessToken, getTokenType } from '../auth/storage'

export type SellerStoreProduct = Product & {
  /** SL có thể bán / giao ngay (mock kho) */
  stockQty: number
  /** Khi lấy từ API — hiển thị ngành hàng thật (categoryId có thể là UUID) */
  categoryName?: string
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

export type SellerProductListDto = {
  id: string
  categoryId: string
  categoryName: string
  sku: string
  name: string
  imageUrls: string[]
  costPrice: number
  suggestedPrice: number
  stockQuantity: number
  isActive: boolean
  createdAt: string
}

type ProductListResponse = {
  content: SellerProductListDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export function mapSellerProductDtoToStoreProduct(d: SellerProductListDto): SellerStoreProduct {
  return {
    id: d.id,
    sku: d.sku,
    name: d.name,
    categoryId: d.categoryId,
    description: `<p>${d.categoryName}</p>`,
    price: d.suggestedPrice,
    material: '—',
    status: d.isActive ? 'active' : 'discontinued',
    imageUrl: d.imageUrls?.length ? d.imageUrls[0]! : DEFAULT_PRODUCT_IMAGE_URL,
    stockQty: d.stockQuantity,
    categoryName: d.categoryName,
  }
}

export type FetchSellerProductsParams = {
  page?: number
  size?: number
  search?: string
  is_active?: boolean
  in_stock?: boolean
  category_id?: string
  /** Luôn gửi query; mặc định `false` nếu không truyền. */
  is_custom?: boolean
  /** Khi `is_custom: true` — SP custom theo đại lý. */
  agency_id?: string
  signal?: AbortSignal
}

export async function fetchSellerProducts(params: FetchSellerProductsParams): Promise<{
  content: SellerStoreProduct[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.is_active === true) q.set('is_active', 'true')
  if (params.is_active === false) q.set('is_active', 'false')
  if (params.in_stock === true) q.set('in_stock', 'true')
  if (params.in_stock === false) q.set('in_stock', 'false')
  if (params.category_id?.trim()) q.set('category_id', params.category_id.trim())

  const isCustom = params.is_custom === true
  q.set('is_custom', isCustom ? 'true' : 'false')
  if (isCustom && params.agency_id?.trim()) {
    q.set('agency_id', params.agency_id.trim())
  }

  const res = await fetch(`${API_BASE_URL}/api/seller/products?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    signal: params?.signal,
  })
  const envelope = (await res.json()) as ApiEnvelope<ProductListResponse>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách sản phẩm')
  }
  const data = envelope.data
  return {
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    last: data.last,
    content: data.content.map(mapSellerProductDtoToStoreProduct),
  }
}
