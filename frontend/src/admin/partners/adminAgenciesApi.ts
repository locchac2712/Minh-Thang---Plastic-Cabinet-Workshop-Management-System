/**
 * API quản trị đại lý — theo document/guidelineUI/admin/agencies.md
 * Thành công: thân JSON trực tiếp; lỗi: ApiResponse.
 */
import { getAccessToken, getTokenType } from '../../auth/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export type AgencyResponse = {
  id: string
  name: string
  assignedSellerId: string | null
  assignedSellerName: string | null
  level: string
  phone: string | null
  address: string | null
  taxCode: string | null
  legalCompanyName: string | null
  totalDebt: number
  computedDebtFromOrders?: number | null
  debtReconciliationDelta?: number | null
  maxDebtLimit: number
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

export type CreateAgencyRequest = {
  assignedSellerId: string
  name: string
  level: string
  phone?: string
  address?: string
  taxCode?: string
  /** Tên công ty pháp nhân — theo DTO BE (bổ sung từ bản hướng dẫn tối thiểu) */
  legalCompanyName?: string
}

export type UpdateAgencyRequest = {
  name?: string
  phone?: string
  address?: string
  taxCode?: string
  legalCompanyName?: string
  level?: string
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
  throw new Error('Phản hồi danh sách đại lý không hợp lệ')
}

function unwrapEntity<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'id' in raw) {
    return raw as T
  }
  const w = raw as ApiEnvelope<T>
  if (w?.success && w.data) return w.data
  throw new Error('Phản hồi đại lý không hợp lệ')
}

export class AdminAgencyApiError extends Error {
  statusCode: number
  fieldErrors: Record<string, string> | null
  constructor(
    message: string,
    statusCode: number,
    fieldErrors: Record<string, string> | null = null,
  ) {
    super(message)
    this.name = 'AdminAgencyApiError'
    this.statusCode = statusCode
    this.fieldErrors = fieldErrors
  }
}

export type FetchAdminAgenciesParams = {
  page: number
  size: number
  search?: string
  level?: string
  isActive?: boolean
  signal?: AbortSignal
}

export async function fetchAdminAgencies(
  params: FetchAdminAgenciesParams,
): Promise<PageResponse<AgencyResponse>> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('size', String(params.size))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.level) q.set('level', params.level)
  if (params.isActive === true) q.set('is_active', 'true')
  if (params.isActive === false) q.set('is_active', 'false')
  const res = await fetch(`${API_BASE_URL}/api/admin/agencies?${q.toString()}`, {
    headers: { accept: '*/*', ...authHeader() },
    signal: params.signal,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminAgencyApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapPage<AgencyResponse>(body)
}

export async function fetchAdminAgencyById(id: string): Promise<AgencyResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/agencies/${encodeURIComponent(id)}`, {
    headers: { accept: '*/*', ...authHeader() },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminAgencyApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapEntity<AgencyResponse>(body)
}

export type AgencyOrderHistoryDto = {
  id: string
  displayCode?: string | null
  sourceOrderId?: string | null
  recordKind?: string | null
  totalPayable: number
  status: string
  createdAt: string
}

async function fetchAdminAgencyOrderPage(
  agencyId: string,
  resource: 'orders' | 'quotations',
  params: { page?: number; size?: number; status?: string; signal?: AbortSignal } = {},
): Promise<PageResponse<AgencyOrderHistoryDto>> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.status?.trim()) q.set('status', params.status.trim())
  const res = await fetch(
    `${API_BASE_URL}/api/admin/agencies/${encodeURIComponent(agencyId)}/${resource}?${q.toString()}`,
    {
      headers: { accept: '*/*', ...authHeader() },
      signal: params.signal,
    },
  )
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminAgencyApiError(await readErrorMessage(res, body), res.status)
  }
  return unwrapPage<AgencyOrderHistoryDto>(body)
}

export async function fetchAdminAgencyOrders(
  agencyId: string,
  params: { page?: number; size?: number; status?: string; signal?: AbortSignal } = {},
): Promise<PageResponse<AgencyOrderHistoryDto>> {
  return fetchAdminAgencyOrderPage(agencyId, 'orders', params)
}

export async function fetchAdminAgencyQuotations(
  agencyId: string,
  params: { page?: number; size?: number; status?: string; signal?: AbortSignal } = {},
): Promise<PageResponse<AgencyOrderHistoryDto>> {
  return fetchAdminAgencyOrderPage(agencyId, 'quotations', params)
}

export async function createAdminAgency(payload: CreateAgencyRequest): Promise<AgencyResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/agencies`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify({
      assignedSellerId: payload.assignedSellerId,
      name: payload.name.trim(),
      level: payload.level.trim(),
      phone: payload.phone?.trim() || undefined,
      address: payload.address?.trim() || undefined,
      taxCode: payload.taxCode?.trim() || undefined,
      legalCompanyName: payload.legalCompanyName?.trim() || undefined,
    }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const errMsg = await readErrorMessage(res, body)
    const fe =
      body && typeof body === 'object' && 'errors' in body
        ? (body as ApiErrorJson).errors ?? null
        : null
    throw new AdminAgencyApiError(errMsg, res.status, fe)
  }
  return unwrapEntity<AgencyResponse>(body)
}

export function buildAgencyUpdatePayload(
  current: AgencyResponse,
  d: {
    name: string
    phone: string
    address: string
    taxCode: string
    legalCompanyName: string
  },
): UpdateAgencyRequest {
  const out: UpdateAgencyRequest = {}
  const n = d.name.trim()
  if (n !== (current.name ?? '').trim()) out.name = n
  const p = d.phone.trim()
  const cp = (current.phone ?? '').trim()
  if (p !== cp) out.phone = p
  const a = d.address.trim()
  const ca = (current.address ?? '').trim()
  if (a !== ca) out.address = a
  const t = d.taxCode.trim()
  const ct = (current.taxCode ?? '').trim()
  if (t !== ct) out.taxCode = t
  const l = d.legalCompanyName.trim()
  const cl = (current.legalCompanyName ?? '').trim()
  if (l !== cl) out.legalCompanyName = l || (current.legalCompanyName == null ? undefined : '')
  return out
}

export async function patchAdminAgency(
  id: string,
  payload: UpdateAgencyRequest,
): Promise<AgencyResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const body: Record<string, string> = {}
  if (payload.name !== undefined) body.name = payload.name
  if (payload.phone !== undefined) body.phone = payload.phone
  if (payload.address !== undefined) body.address = payload.address
  if (payload.taxCode !== undefined) body.taxCode = payload.taxCode
  if (payload.legalCompanyName !== undefined) body.legalCompanyName = payload.legalCompanyName
  if (payload.level !== undefined) body.level = payload.level
  const res = await fetch(`${API_BASE_URL}/api/admin/agencies/${encodeURIComponent(id)}`, {
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
    throw new AdminAgencyApiError(errMsg, res.status, fe)
  }
  return unwrapEntity<AgencyResponse>(json)
}

export async function transferAgencyOwner(
  agencyId: string,
  newSellerId: string,
): Promise<AgencyResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(
    `${API_BASE_URL}/api/admin/agencies/${encodeURIComponent(agencyId)}/transfer-owner`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify({ newSellerId }),
    },
  )
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminAgencyApiError(await readErrorMessage(res, json), res.status)
  }
  return unwrapEntity<AgencyResponse>(json)
}

export async function toggleAgencyActive(id: string): Promise<AgencyResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const res = await fetch(
    `${API_BASE_URL}/api/admin/agencies/${encodeURIComponent(id)}/toggle-active`,
    {
      method: 'PATCH',
      headers: { accept: '*/*', ...authHeader() },
    },
  )
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new AdminAgencyApiError(await readErrorMessage(res, json), res.status)
  }
  return unwrapEntity<AgencyResponse>(json)
}

/** Danh sách user (SELLER active) cho form gán / chuyển — dùng GET /api/admin/users */
export type UserListItem = {
  id: string
  fullName: string
  email: string
  role: string
  isActive: boolean
}

type UserPageEnvelope = {
  content: Array<{
    id: string
    fullName: string
    email: string
    role: string
    isActive: boolean
  }>
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export async function fetchAdminActiveSellers(maxSize = 200): Promise<UserListItem[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new AdminAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }
  const q = new URLSearchParams()
  q.set('page', '0')
  q.set('size', String(maxSize))
  q.set('role', 'SELLER')
  q.set('status', 'true')
  const res = await fetch(`${API_BASE_URL}/api/admin/users?${q.toString()}`, {
    headers: { accept: '*/*', ...authHeader() },
  })
  const body = (await res.json().catch(() => null)) as ApiEnvelope<UserPageEnvelope> | null
  if (!res.ok || !body?.success || !body.data) {
    throw new AdminAgencyApiError(
      (body as ApiErrorJson | null)?.message ?? 'Không tải được danh sách NVBH',
      res.status,
    )
  }
  return body.data.content.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
  }))
}
