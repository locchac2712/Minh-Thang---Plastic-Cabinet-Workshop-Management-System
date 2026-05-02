/**
 * API đại lý cho role DIRECTOR — theo document/guidelineUI/director/agencies.md
 * + PATCH hạn mức: document/guidelineUI/director/approvals.md
 * Thành công: thân JSON trực tiếp; lỗi: ApiResponse.
 */
import { getAccessToken, getTokenType } from '../auth/storage'
import type { AgencyResponse, PageResponse } from '../admin/partners/adminAgenciesApi'
import type { AgencyLevel } from '../admin/partners/agencyModel'
import type { DirectorDebtApprovalRow } from './data/directorDebtApprovalsMock'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type ApiErrorJson = {
  success?: boolean
  message?: string
  statusCode?: number
  errors?: Record<string, string>
}

/** BE có thể bọc thân thành công trong `data` (cùng pattern `directorApprovalsApi` / `adminAgenciesApi`). */
type ApiEnvelope<T> = {
  success: boolean
  message?: string
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

function isPageShape<T>(x: unknown): x is PageResponse<T> {
  return (
    x !== null &&
    typeof x === 'object' &&
    Array.isArray((x as PageResponse<T>).content) &&
    'totalElements' in (x as object)
  )
}

function unwrapPage<T>(raw: unknown): PageResponse<T> {
  if (isPageShape<T>(raw)) {
    return raw
  }
  const w = raw as ApiEnvelope<PageResponse<T>>
  if (w?.success && w.data && isPageShape<T>(w.data)) {
    return w.data
  }
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (isPageShape<T>(d)) return d
  }
  throw new Error('Phản hồi danh sách đại lý (Giám đốc) không hợp lệ')
}

function isAgencyEntity(raw: unknown): raw is { id: string } {
  return raw !== null && typeof raw === 'object' && 'id' in raw
}

function unwrapEntity<T extends { id: string }>(raw: unknown): T {
  if (isAgencyEntity(raw)) {
    return raw as T
  }
  const w = raw as ApiEnvelope<T>
  if (w?.success && w.data) return w.data
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (isAgencyEntity(d)) return d as T
  }
  throw new Error('Phản hồi đại lý (Giám đốc) không hợp lệ')
}

function apiLevelToAgencyLevel(level: string): AgencyLevel {
  const x = level.trim().toLowerCase()
  if (x === 'gold') return 'gold'
  if (x === 'vip') return 'vip'
  return 'standard'
}

/** Dùng cho bảng phê duyệt hạn mức: map từ dữ liệu đại lý (không có hàng “chờ” riêng trên BE). */
export function mapAgencyResponseToDirectorDebtRow(d: AgencyResponse): DirectorDebtApprovalRow {
  const level = apiLevelToAgencyLevel(d.level)
  const agencyCode = d.taxCode?.trim() || `KS-${d.id.replace(/-/g, '').slice(0, 8)}`
  const cap = d.maxDebtLimit
  const ratio = cap > 0 ? d.totalDebt / cap : 1
  return {
    id: d.id,
    agencyId: d.id,
    agencyCode,
    shortName: d.name,
    legalName: d.legalCompanyName?.trim() || d.name,
    level,
    sellerName: d.assignedSellerName || '—',
    submittedAt: d.createdAt.slice(0, 10),
    totalDebtVnd: d.totalDebt,
    currentCreditLimitVnd: d.maxDebtLimit,
    requestedCreditLimitVnd: d.maxDebtLimit,
    reasonSummary:
      d.totalDebt > d.maxDebtLimit
        ? 'Vượt hạn mức công nợ — cần điều chỉnh từ Giám đốc (DIR-A03).'
        : ratio >= 0.8
          ? 'Dư nợ gần hoặc tại trần hạn mức (≥80% HM).'
          : 'Theo số liệu từ hệ thống; Giám đốc có thể nới/chỉnh hạn mức.',
    isOrderingBlocked: d.isActive && d.totalDebt > d.maxDebtLimit,
    priority: ratio >= 0.9 || d.totalDebt > d.maxDebtLimit ? 'high' : 'normal',
    slaDueAt: '—',
  }
}

export type FetchDirectorAgenciesParams = {
  page?: number
  size?: number
  search?: string
  isActive?: boolean
  signal?: AbortSignal
}

export async function fetchDirectorAgencies(
  params: FetchDirectorAgenciesParams = {},
): Promise<PageResponse<AgencyResponse>> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (params.isActive === true) q.set('is_active', 'true')
  if (params.isActive === false) q.set('is_active', 'false')
  const res = await fetch(`${API_BASE_URL}/api/director/agencies?${q.toString()}`, {
    headers: { accept: '*/*', ...authHeader() },
    signal: params.signal,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, body))
  }
  return unwrapPage<AgencyResponse>(body)
}

export type OverrideDirectorAgencyDebtPayload = {
  /** Số dương, đơn vị đồng — field BE: maxDebtLimit */
  maxDebtLimit: number
}

/**
 * PATCH /api/director/approvals/agencies/{id}/override-debt — cập nhật AGENCIES.max_debt_limit.
 * Body: { maxDebtLimit }.
 */
export async function overrideDirectorAgencyDebt(
  agencyId: string,
  payload: OverrideDirectorAgencyDebtPayload,
): Promise<AgencyResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/director/approvals/agencies/${encodeURIComponent(agencyId)}/override-debt`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        ...authHeader(),
      },
      body: JSON.stringify({ maxDebtLimit: payload.maxDebtLimit }),
    },
  )
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, body))
  }
  return unwrapEntity<AgencyResponse>(body)
}
