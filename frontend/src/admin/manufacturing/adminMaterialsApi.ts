/**
 * API quản trị vật tư — /api/admin/materials
 */
import { getAccessToken, getTokenType } from '../../auth/storage'
import type { PageResponse } from '../partners/adminSuppliersApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export type MaterialSupplierItem = {
  id: string
  name: string
}

export type MaterialResponse = {
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
  linkedSuppliers?: MaterialSupplierItem[] | null
  linkedSupplierCount?: number
}

export type CreateMaterialRequest = {
  code: string
  name: string
  imageUrl?: string
  unit: string
  minStockLevel?: number
  supplierIds?: string[]
}

export type UpdateMaterialRequest = {
  name?: string
  imageUrl?: string | null
  unit?: string
  minStockLevel?: number
  isActive?: boolean
  supplierIds?: string[] | null
}

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data?: T
}

export class AdminMaterialApiError extends Error {
  statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'AdminMaterialApiError'
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
  throw new AdminMaterialApiError('Phản hồi danh sách vật tư không hợp lệ', 500)
}

function unwrapEntity<T extends { id: string }>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'id' in raw) {
    return raw as T
  }
  const w = raw as ApiEnvelope<T>
  if (w?.success && w.data) return w.data
  throw new AdminMaterialApiError('Phản hồi vật tư không hợp lệ', 500)
}

export type FetchAdminMaterialsParams = {
  page: number
  size: number
  search?: string
  isActive?: boolean
  signal?: AbortSignal
}

export async function fetchAdminMaterials(
  params: FetchAdminMaterialsParams,
): Promise<PageResponse<MaterialResponse>> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminMaterialApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.isActive === true) q.set('is_active', 'true')
  if (params.isActive === false) q.set('is_active', 'false')
  const res = await fetch(`${API_BASE_URL}/api/admin/materials?${q.toString()}`, {
    headers: { accept: '*/*', ...authHeader() },
    signal: params.signal,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminMaterialApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapPage<MaterialResponse>(body)
}

export async function fetchAdminMaterialById(id: string): Promise<MaterialResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminMaterialApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/materials/${encodeURIComponent(id)}`, {
    headers: { accept: '*/*', ...authHeader() },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminMaterialApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapEntity<MaterialResponse>(body)
}

export async function createAdminMaterial(payload: CreateMaterialRequest): Promise<MaterialResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminMaterialApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/materials`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminMaterialApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapEntity<MaterialResponse>(body)
}

export async function patchAdminMaterial(
  id: string,
  payload: UpdateMaterialRequest,
): Promise<MaterialResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminMaterialApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/materials/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminMaterialApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapEntity<MaterialResponse>(body)
}
