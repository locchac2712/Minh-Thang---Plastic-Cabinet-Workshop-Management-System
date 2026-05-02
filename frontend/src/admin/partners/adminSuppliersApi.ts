/**
 * API quản trị NCC — theo document/guidelineUI/admin/suppliers.md
 * Thành công: thân JSON trực tiếp (có thể kèm vỏ ApiResponse từ môi trường).
 */
import { getAccessToken, getTokenType } from '../../auth/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export type SupplierResponse = {
  id: string
  name: string
  phone: string | null
  address: string | null
  taxCode: string | null
  totalDebt: number
  isActive: boolean
  createdAt: string
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type CreateSupplierRequest = {
  name: string
  phone?: string
  address?: string
  taxCode?: string
}

export type UpdateSupplierRequest = {
  name?: string
  phone?: string
  address?: string
  taxCode?: string
}

/** Chỉ các field thay đổi (PATCH thưa) so với bản từ GET. */
export function buildSupplierPatchPayload(
  current: SupplierResponse,
  draft: { name: string; phone: string; address: string; taxCode: string },
): UpdateSupplierRequest {
  const out: UpdateSupplierRequest = {}
  const dName = draft.name.trim()
  if (dName !== current.name) out.name = dName
  const dPhone = draft.phone.trim()
  const cPhone = (current.phone ?? '').trim()
  if (dPhone !== cPhone) out.phone = dPhone
  const dAddr = draft.address.trim()
  const cAddr = (current.address ?? '').trim()
  if (dAddr !== cAddr) out.address = dAddr
  const dTax = draft.taxCode.trim()
  const cTax = (current.taxCode ?? '').trim()
  if (dTax !== cTax) out.taxCode = dTax
  return out
}

/** Một dòng vật tư trong `GET /api/admin/suppliers/{id}/materials` — cùng schema list vật tư admin */
export type SupplierMaterialResponse = {
  id: string
  code: string
  name: string
  imageUrl: string | null
  unit: string
  unitCost: number
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
  createdAt: string
}

export type FetchAdminSupplierMaterialsParams = {
  page: number
  size: number
  search?: string
  /** Bỏ qua: không lọc; true/false: map query `is_active` */
  isActive?: boolean
  signal?: AbortSignal
}

type ApiErrorJson = {
  success?: boolean
  message?: string
  statusCode?: number
  errors?: Record<string, string>
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data?: T
}

function authHeader(): Record<string, string> {
  const t = getAccessToken()
  if (!t) return {}
  return { Authorization: `${getTokenType()} ${t}` }
}

async function readErrorMessage(res: Response, body: unknown): Promise<string> {
  if (body && typeof body === 'object') {
    const j = body as ApiErrorJson
    if (j.message) return j.message
    if (j.errors) {
      const first = Object.values(j.errors).find(Boolean)
      if (first) return first
    }
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
  throw new Error('Phản hồi danh sách NCC không hợp lệ')
}

function unwrapEntity<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'id' in raw) {
    return raw as T
  }
  const w = raw as ApiEnvelope<T>
  if (w?.success && w.data) return w.data
  throw new Error('Phản hồi NCC không hợp lệ')
}

export class AdminSupplierApiError extends Error {
  statusCode: number
  fieldErrors: Record<string, string> | null
  constructor(message: string, statusCode: number, fieldErrors: Record<string, string> | null = null) {
    super(message)
    this.name = 'AdminSupplierApiError'
    this.statusCode = statusCode
    this.fieldErrors = fieldErrors
  }
}

export type FetchAdminSuppliersParams = {
  page: number
  size: number
  search?: string
  hasDebt?: boolean
  signal?: AbortSignal
}

export async function fetchAdminSuppliers(
  params: FetchAdminSuppliersParams,
): Promise<PageResponse<SupplierResponse>> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminSupplierApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.hasDebt === true) q.set('has_debt', 'true')
  if (params.hasDebt === false) q.set('has_debt', 'false')
  const res = await fetch(`${API_BASE_URL}/api/admin/suppliers?${q.toString()}`, {
    headers: {
      accept: '*/*',
      ...authHeader(),
    },
    signal: params.signal,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminSupplierApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapPage<SupplierResponse>(body)
}

export async function fetchAdminSupplierMaterials(
  supplierId: string,
  params: FetchAdminSupplierMaterialsParams,
): Promise<PageResponse<SupplierMaterialResponse>> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminSupplierApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.isActive === true) q.set('is_active', 'true')
  if (params.isActive === false) q.set('is_active', 'false')
  const res = await fetch(
    `${API_BASE_URL}/api/admin/suppliers/${encodeURIComponent(supplierId)}/materials?${q.toString()}`,
    {
      headers: {
        accept: '*/*',
        ...authHeader(),
      },
      signal: params.signal,
    },
  )
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminSupplierApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapPage<SupplierMaterialResponse>(body)
}

export async function fetchAdminSupplierById(id: string): Promise<SupplierResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminSupplierApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/suppliers/${encodeURIComponent(id)}`, {
    headers: {
      accept: '*/*',
      ...authHeader(),
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminSupplierApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapEntity<SupplierResponse>(body)
}

export async function createAdminSupplier(payload: CreateSupplierRequest): Promise<SupplierResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminSupplierApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/suppliers`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({
      name: payload.name.trim(),
      phone: payload.phone?.trim() || undefined,
      address: payload.address?.trim() || undefined,
      taxCode: payload.taxCode?.trim() || undefined,
    }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const errMsg = await readErrorMessage(res, body)
    const fe =
      body && typeof body === 'object' && 'errors' in body
        ? (body as ApiErrorJson).errors ?? null
        : null
    throw new AdminSupplierApiError(errMsg, res.status, fe)
  }
  if (res.status === 201 || res.status === 200) {
    return unwrapEntity<SupplierResponse>(body)
  }
  return unwrapEntity<SupplierResponse>(body)
}

export async function patchAdminSupplier(
  id: string,
  payload: UpdateSupplierRequest,
): Promise<SupplierResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminSupplierApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const body: Record<string, string> = {}
  if (payload.name !== undefined) body.name = payload.name
  if (payload.phone !== undefined) body.phone = payload.phone
  if (payload.address !== undefined) body.address = payload.address
  if (payload.taxCode !== undefined) body.taxCode = payload.taxCode
  const res = await fetch(`${API_BASE_URL}/api/admin/suppliers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const errMsg = await readErrorMessage(res, json)
    const fe =
      json && typeof json === 'object' && 'errors' in json
        ? (json as ApiErrorJson).errors ?? null
        : null
    throw new AdminSupplierApiError(errMsg, res.status, fe)
  }
  return unwrapEntity<SupplierResponse>(json)
}

export async function toggleAdminSupplierActive(id: string): Promise<SupplierResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminSupplierApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(
    `${API_BASE_URL}/api/admin/suppliers/${encodeURIComponent(id)}/toggle-active`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        ...authHeader(),
      },
    },
  )
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminSupplierApiError(await readErrorMessage(res, json), res.status)
  }
  return unwrapEntity<SupplierResponse>(json)
}
