/**
 * API mua hàng kế toán — /api/accountant/purchases, suppliers materials, giá NCC–NVL
 */
import { getAccessToken, getTokenType } from '../auth/storage'
import type { PageResponse, SupplierResponse } from '../admin/partners/adminSuppliersApi'
import type { MaterialResponse } from '../admin/manufacturing/adminMaterialsApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export type MaterialSupplierPriceHint = {
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  referenceUnitCost: number
  supplierId: string
  supplierName: string
  lastPurchaseUnitPrice: number | null
  lastPurchaseAt: string | null
  varianceToReference: number | null
  varianceToReferencePercent: number | null
  hasPurchaseHistory: boolean
}

export type OpenTaskMaterialNeedItem = {
  materialId: string
  materialCode: string
  materialName: string
  unit: string
  requiredForOpenTasks: number
  stockQuantity: number
  minStockLevel: number
  suggestedOrderQuantity: number
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data?: T
}

export class AccountantPurchaseApiError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'AccountantPurchaseApiError'
    this.statusCode = statusCode
  }
}

function authHeader(): Record<string, string> {
  const t = getAccessToken()
  if (!t) return {}
  return { Authorization: `${getTokenType()} ${t}` }
}

async function readErrorMessage(res: Response, body: unknown): Promise<string> {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as { message?: string }).message
    if (msg) return msg
  }
  return res.statusText || 'Lỗi không xác định'
}

function unwrapPage<T>(raw: unknown): PageResponse<T> {
  if (
    raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as PageResponse<T>).content) &&
    'totalElements' in (raw as object)
  ) {
    return raw as PageResponse<T>
  }
  const w = raw as ApiEnvelope<PageResponse<T>>
  if (w?.success && w.data) return w.data
  throw new AccountantPurchaseApiError('Phản hồi phân trang không hợp lệ', 500)
}

function unwrapList<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[]
  const w = raw as ApiEnvelope<T[]>
  if (w?.success && Array.isArray(w.data)) return w.data
  throw new AccountantPurchaseApiError('Phản hồi danh sách không hợp lệ', 500)
}

export type FetchAccountantSupplierMaterialsParams = {
  page: number
  size: number
  search?: string
  isActive?: boolean
  signal?: AbortSignal
}

export async function fetchAccountantSupplierMaterials(
  supplierId: string,
  params: FetchAccountantSupplierMaterialsParams,
): Promise<PageResponse<MaterialResponse>> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AccountantPurchaseApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.isActive === true) q.set('is_active', 'true')
  if (params.isActive === false) q.set('is_active', 'false')
  const res = await fetch(
    `${API_BASE_URL}/api/accountant/suppliers/${encodeURIComponent(supplierId)}/materials?${q.toString()}`,
    {
      headers: { accept: '*/*', ...authHeader() },
      signal: params.signal,
    },
  )
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AccountantPurchaseApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapPage<MaterialResponse>(body)
}

export async function fetchMaterialSupplierPrices(
  materialId?: string,
): Promise<MaterialSupplierPriceHint[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AccountantPurchaseApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  if (materialId?.trim()) q.set('material_id', materialId.trim())
  const suffix = q.toString() ? `?${q.toString()}` : ''
  const res = await fetch(
    `${API_BASE_URL}/api/accountant/purchases/material-supplier-prices${suffix}`,
    { headers: { accept: '*/*', ...authHeader() } },
  )
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AccountantPurchaseApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapList<MaterialSupplierPriceHint>(body)
}

export async function fetchOpenTaskMaterialNeeds(): Promise<OpenTaskMaterialNeedItem[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AccountantPurchaseApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/accountant/purchases/open-task-material-needs`, {
    headers: { accept: '*/*', ...authHeader() },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AccountantPurchaseApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapList<OpenTaskMaterialNeedItem>(body)
}

export async function fetchAccountantSupplierById(id: string): Promise<SupplierResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AccountantPurchaseApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/accountant/suppliers/${encodeURIComponent(id)}`, {
    headers: { accept: '*/*', ...authHeader() },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AccountantPurchaseApiError(await readErrorMessage(res, body), res.status)
  }
  if (body && typeof body === 'object' && 'id' in body) {
    return body as SupplierResponse
  }
  const w = body as ApiEnvelope<SupplierResponse>
  if (w?.success && w.data) return w.data
  throw new AccountantPurchaseApiError('Phản hồi NCC không hợp lệ', 500)
}
