import { getAccessToken, getTokenType } from '../auth/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

export type ProductionCustomProductBomItemPayload = {
  materialId: string
  quantity: number
  note?: string
}

export type CreateProductionCustomProductPayload = {
  agencyId: string
  sku: string
  name: string
  imageUrls: string[]
  resourceUrl?: string | null
  costPrice: number
  suggestedPrice: number
  bomItems: ProductionCustomProductBomItemPayload[]
}

export type ProductionCustomProductCreatedDto = {
  id: string
  categoryId: string | null
  categoryName: string | null
  sku: string
  name: string
  imageUrls: string[]
  costPrice: number
  suggestedPrice: number
  stockQuantity: number
  isActive: boolean
  isCustom: boolean
  agencyId: string
  createdById: string
  resourceUrl: string | null
  createdAt: string
}

/** POST /api/production/custom-products */
export async function createProductionCustomProduct(
  body: CreateProductionCustomProductPayload,
): Promise<ProductionCustomProductCreatedDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/production/custom-products`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  const envelope = (await res.json()) as ApiEnvelope<ProductionCustomProductCreatedDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tạo được sản phẩm custom')
  }
  return envelope.data
}

type AgencyListPage = {
  content: { id: string; name: string; legalCompanyName: string; taxCode: string; isActive: boolean }[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type ProductionAgencyPickRow = {
  id: string
  name: string
  legalCompanyName: string
  taxCode: string
}

/**
 * Danh sách đại lý cho form (GET /api/production/agencies).
 * Nếu backend chưa mở endpoint, gọi sẽ lỗi — UI cho phép nhập UUID thủ công.
 */
export async function fetchProductionAgenciesPage(params: {
  page?: number
  size?: number
  search?: string
  isActive?: boolean
}): Promise<AgencyListPage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 50))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.isActive === true) q.set('is_active', 'true')
  if (params.isActive === false) q.set('is_active', 'false')

  const res = await fetch(`${API_BASE_URL}/api/production/agencies?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<AgencyListPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách đại lý')
  }
  return envelope.data
}

export function mapAgencyRow(r: AgencyListPage['content'][number]): ProductionAgencyPickRow {
  return {
    id: r.id,
    name: r.name,
    legalCompanyName: r.legalCompanyName,
    taxCode: r.taxCode,
  }
}
