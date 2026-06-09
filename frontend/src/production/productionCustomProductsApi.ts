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

export type UpdateProductionCustomProductPayload = Omit<
  CreateProductionCustomProductPayload,
  'sku'
>

export type ProductionCustomProductDto = {
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
  agencyName: string | null
  createdById: string
  resourceUrl: string | null
  createdAt: string
}

export type ProductionCustomProductBomLineDto = {
  id: string
  productId: string
  materialId: string
  materialCode: string
  materialName: string
  materialUnit: string
  materialUnitCost: number | null
  quantity: number
  note: string | null
  createdAt: string
}

export type ProductionCustomProductPage = {
  content: ProductionCustomProductDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

function authHeaders(json = false): HeadersInit {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const h: HeadersInit = {
    accept: '*/*',
    Authorization: `${getTokenType()} ${accessToken}`,
  }
  if (json) h['Content-Type'] = 'application/json'
  return h
}

async function unwrap<T>(res: Response, failMessage: string): Promise<T> {
  const envelope = (await res.json()) as ApiEnvelope<T>
  if (!res.ok || !envelope.success || envelope.data === undefined) {
    throw new Error(envelope.message || failMessage)
  }
  return envelope.data
}

/** GET /api/production/custom-products */
export async function fetchProductionCustomProducts(params: {
  page?: number
  size?: number
  search?: string
  agencyId?: string
}): Promise<ProductionCustomProductPage> {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.agencyId?.trim()) q.set('agency_id', params.agencyId.trim())

  const res = await fetch(`${API_BASE_URL}/api/production/custom-products?${q.toString()}`, {
    headers: authHeaders(),
  })
  return unwrap<ProductionCustomProductPage>(res, 'Không tải được danh sách sản phẩm custom')
}

/** GET /api/production/custom-products/:id */
export async function fetchProductionCustomProductById(
  productId: string,
): Promise<ProductionCustomProductDto> {
  const res = await fetch(
    `${API_BASE_URL}/api/production/custom-products/${encodeURIComponent(productId)}`,
    { headers: authHeaders() },
  )
  return unwrap<ProductionCustomProductDto>(res, 'Không tải được chi tiết sản phẩm custom')
}

/** GET /api/production/custom-products/:id/bom */
export async function fetchProductionCustomProductBom(
  productId: string,
): Promise<ProductionCustomProductBomLineDto[]> {
  const res = await fetch(
    `${API_BASE_URL}/api/production/custom-products/${encodeURIComponent(productId)}/bom`,
    { headers: authHeaders() },
  )
  return unwrap<ProductionCustomProductBomLineDto[]>(res, 'Không tải được BOM')
}

/** POST /api/production/custom-products */
export async function createProductionCustomProduct(
  body: CreateProductionCustomProductPayload,
): Promise<ProductionCustomProductDto> {
  const res = await fetch(`${API_BASE_URL}/api/production/custom-products`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(body),
  })
  return unwrap<ProductionCustomProductDto>(res, 'Không tạo được sản phẩm custom')
}

/** PUT /api/production/custom-products/:id */
export async function updateProductionCustomProduct(
  productId: string,
  body: UpdateProductionCustomProductPayload,
): Promise<ProductionCustomProductDto> {
  const res = await fetch(
    `${API_BASE_URL}/api/production/custom-products/${encodeURIComponent(productId)}`,
    {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(body),
    },
  )
  return unwrap<ProductionCustomProductDto>(res, 'Không cập nhật được sản phẩm custom')
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

/** GET /api/production/agencies */
export async function fetchProductionAgenciesPage(params: {
  page?: number
  size?: number
  search?: string
  isActive?: boolean
}): Promise<AgencyListPage> {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 50))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.isActive === true) q.set('is_active', 'true')
  if (params.isActive === false) q.set('is_active', 'false')

  const res = await fetch(`${API_BASE_URL}/api/production/agencies?${q.toString()}`, {
    headers: authHeaders(),
  })
  return unwrap<AgencyListPage>(res, 'Không tải được danh sách đại lý')
}

export function mapAgencyRow(r: AgencyListPage['content'][number]): ProductionAgencyPickRow {
  return {
    id: r.id,
    name: r.name,
    legalCompanyName: r.legalCompanyName,
    taxCode: r.taxCode,
  }
}

async function uploadMultipart(urlPath: string, file: File, failMessage: string): Promise<string> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
  }
  const uploadBody = new FormData()
  uploadBody.append('file', file)
  const res = await fetch(`${API_BASE_URL}${urlPath}`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: uploadBody,
  })
  const envelope = (await res.json()) as ApiEnvelope<{ url?: string }>
  if (!res.ok || !envelope.success || !envelope.data?.url) {
    throw new Error(envelope.message || failMessage)
  }
  return envelope.data.url
}

/** POST /api/uploadable/document — PDF tài liệu / bản vẽ. */
export async function uploadProductionDocumentFile(file: File): Promise<string> {
  return uploadMultipart('/api/uploadable/document', file, 'Upload tài liệu thất bại')
}

export function isPdfUploadFile(file: File): boolean {
  if (file.type === 'application/pdf') return true
  return file.name.trim().toLowerCase().endsWith('.pdf')
}

/** @deprecated alias — dùng fetchProductionCustomProductById */
export type ProductionCustomProductCreatedDto = ProductionCustomProductDto
