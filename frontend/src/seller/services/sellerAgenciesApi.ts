import type { AgencyLevel, Agency } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'

export type SellerAgencyRow = Agency & {
  /** Số đơn / tủ đã lấy gần đây (mock 90 ngày) — up-sale */
  recentCabinetOrders90d: number
}

/** Đơn hàng mock cho tab “Đơn & tủ đã lấy” — API GET /orders?seller&agencyId sau */
export type SellerAgencyOrderMock = {
  orderCode: string
  orderedAt: string
  summary: string
  lineCount: number
  totalVnd: number
  status: 'draft' | 'pending_approval' | 'producing' | 'shipping' | 'done'
  /** Đơn sẵn (thành phẩm chuẩn) hoặc custom (theo thiết kế / đo thực tế) */
  orderKind: 'ready_made' | 'custom'
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type ApiErrorJson = {
  success?: boolean
  message?: string
  statusCode?: number
  errors?: Record<string, string>
}

export type AgencyApiDto = {
  id: string
  name: string
  assignedSellerId: string
  assignedSellerName: string
  level: string
  phone: string
  address: string
  taxCode: string
  legalCompanyName: string
  totalDebt: number
  maxDebtLimit: number
  isActive: boolean
  createdAt: string
}

type AgencyListResponse = {
  content: AgencyApiDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

/** Theo CreateAgencyRequest — POST /api/seller/agencies */
export type SellerCreateAgencyRequest = {
  name: string
  level: string
  phone: string
  legalCompanyName?: string
  address?: string
  taxCode?: string
  email?: string
}

/** Theo SellerUpdateAgencyRequest — PUT /api/seller/agencies/{id} */
export type SellerUpdateAgencyRequest = {
  name?: string
  phone?: string
  address?: string
  taxCode?: string
  legalCompanyName?: string
}

export class SellerAgencyApiError extends Error {
  statusCode: number
  fieldErrors: Record<string, string> | null

  constructor(message: string, statusCode: number, fieldErrors: Record<string, string> | null = null) {
    super(message)
    this.name = 'SellerAgencyApiError'
    this.statusCode = statusCode
    this.fieldErrors = fieldErrors
  }
}

async function readSellerAgencyErrorMessage(res: Response, body: unknown): Promise<string> {
  if (body && typeof body === 'object') {
    const j = body as ApiErrorJson
    if (j.message?.trim()) return j.message.trim()
    if (j.errors) {
      const first = Object.values(j.errors).find(Boolean)
      if (first) return first
    }
  }
  return res.statusText || 'Lỗi không xác định'
}

function unwrapAgencyEntity(raw: unknown): AgencyApiDto {
  if (raw && typeof raw === 'object' && 'id' in raw && 'name' in raw) {
    return raw as AgencyApiDto
  }
  const w = raw as ApiEnvelope<AgencyApiDto>
  if (w?.success && w.data) return w.data
  throw new Error('Phản hồi đại lý không hợp lệ')
}

function authHeader(): Record<string, string> {
  const t = getAccessToken()
  if (!t) return {}
  return { Authorization: `${getTokenType()} ${t}` }
}

export async function createSellerAgency(payload: SellerCreateAgencyRequest): Promise<SellerAgencyRow> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new SellerAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }

  const body: Record<string, string> = {
    name: payload.name.trim(),
    level: payload.level.trim(),
    phone: payload.phone.trim(),
  }
  if (payload.legalCompanyName?.trim()) body.legalCompanyName = payload.legalCompanyName.trim()
  if (payload.address?.trim()) body.address = payload.address.trim()
  if (payload.taxCode?.trim()) body.taxCode = payload.taxCode.trim()
  if (payload.email?.trim()) body.email = payload.email.trim()

  const res = await fetch(`${API_BASE_URL}/api/seller/agencies`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = await readSellerAgencyErrorMessage(res, json)
    const fe =
      json && typeof json === 'object' && 'errors' in json
        ? ((json as ApiErrorJson).errors ?? null)
        : null
    throw new SellerAgencyApiError(msg, res.status, fe)
  }
  const dto = unwrapAgencyEntity(json)
  return mapApiToSellerRow(dto)
}

export async function updateSellerAgency(
  id: string,
  patch: SellerUpdateAgencyRequest,
): Promise<SellerAgencyRow> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new SellerAgencyApiError('Thiếu access token. Vui lòng đăng nhập lại.', 401)
  }

  const body: Record<string, string> = {}
  if (patch.name !== undefined && patch.name.trim()) body.name = patch.name.trim()
  if (patch.phone !== undefined && patch.phone.trim()) body.phone = patch.phone.trim()
  if (patch.address !== undefined && patch.address.trim()) body.address = patch.address.trim()
  if (patch.taxCode !== undefined && patch.taxCode.trim()) body.taxCode = patch.taxCode.trim()
  if (patch.legalCompanyName !== undefined && patch.legalCompanyName.trim()) {
    body.legalCompanyName = patch.legalCompanyName.trim()
  }

  if (Object.keys(body).length === 0) {
    throw new SellerAgencyApiError('Không có trường nào để cập nhật.', 400)
  }

  const res = await fetch(`${API_BASE_URL}/api/seller/agencies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      ...authHeader(),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = await readSellerAgencyErrorMessage(res, json)
    const fe =
      json && typeof json === 'object' && 'errors' in json
        ? ((json as ApiErrorJson).errors ?? null)
        : null
    throw new SellerAgencyApiError(msg, res.status, fe)
  }
  const dto = unwrapAgencyEntity(json)
  return mapApiToSellerRow(dto)
}

function apiLevelToAgencyLevel(level: string): AgencyLevel {
  const x = level.trim().toLowerCase()
  if (x === 'gold') return 'gold'
  if (x === 'vip') return 'vip'
  return 'standard'
}

function guessCityFromAddress(address: string): string {
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean)
  return parts.length ? parts[parts.length - 1]! : address.slice(0, 40)
}

export function mapApiToSellerRow(d: AgencyApiDto): SellerAgencyRow {
  return {
    id: d.id,
    code: (d.taxCode ?? '') || `KS-${d.id.slice(0, 8)}`,
    legalName: d.legalCompanyName ?? '',
    shortName: d.name ?? '',
    taxCode: d.taxCode ?? '',
    level: apiLevelToAgencyLevel(d.level ?? ''),
    phone: d.phone ?? '',
    email: '',
    city: guessCityFromAddress(d.address ?? ''),
    address: d.address ?? '',
    assignedSellerName: d.assignedSellerName ?? '',
    totalDebtVnd: d.totalDebt ?? 0,
    creditLimitVnd: d.maxDebtLimit ?? 0,
    isActive: d.isActive ?? true,
    note: '',
    createdAt: d.createdAt ?? '',
    recentCabinetOrders90d: 0,
  }
}

export type FetchSellerAgenciesParams = {
  page?: number
  size?: number
  search?: string
  is_active?: boolean
  level?: string
  total_debt_gt?: number
}

export async function fetchSellerAgencies(params: FetchSellerAgenciesParams): Promise<{
  content: SellerAgencyRow[]
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
  if (params.level?.trim()) q.set('level', params.level.trim())
  if (params.total_debt_gt !== undefined && Number.isFinite(params.total_debt_gt) && params.total_debt_gt > 0) {
    q.set('total_debt_gt', String(Math.floor(params.total_debt_gt)))
  }

  const res = await fetch(`${API_BASE_URL}/api/seller/agencies?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<AgencyListResponse>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách khách sỉ')
  }
  const data = envelope.data
  return {
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    last: data.last,
    content: data.content.map(mapApiToSellerRow),
  }
}
