/**
 * GET /api/director/reports/receivable-warnings/* — document/guidelineUI/director/warning.md
 * Envelope: ApiResponse.data; query/JSON camelCase.
 */
import { getAccessToken, getTokenType } from '../auth/storage'
import type { PageResponse } from '../admin/partners/adminAgenciesApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type ApiEnvelope<T> = {
  success: boolean
  statusCode?: number
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
    const j = body as { message?: string; errors?: Record<string, string> }
    if (j.message) return j.message
    if (j.errors) {
      const first = Object.values(j.errors).find(Boolean)
      if (first) return first
    }
  }
  return res.statusText || 'Lỗi không xác định'
}

function unwrapData<T>(raw: unknown, errLabel: string): T {
  if (raw !== null && typeof raw === 'object' && !('success' in raw && 'data' in raw)) {
    return raw as T
  }
  const w = raw as ApiEnvelope<T>
  if (w?.success === true && w.data !== undefined && w.data !== null) {
    return w.data
  }
  if (raw !== null && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (d !== undefined && d !== null) return d as T
  }
  throw new Error(errLabel)
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
  if (isPageShape<T>(raw)) return raw
  const inner = unwrapData<PageResponse<T> | unknown>(raw, 'Phản hồi danh sách cảnh báo nợ không hợp lệ')
  if (isPageShape<T>(inner)) return inner
  throw new Error('Phản hồi danh sách cảnh báo nợ không hợp lệ')
}

export type ReceivableRiskBand = 'SERIOUS' | 'HIGH' | 'MONITOR'
export type ReceivableAgingBucketApi =
  | 'CURRENT'
  | 'DAYS_1_30'
  | 'DAYS_31_60'
  | 'DAYS_61_90'
  | 'DAYS_OVER_90'

export type ReceivableWarningsSummaryDto = {
  summaryDate: string
  dueGraceDaysApplied: number
  cohortAgencyCount: number
  topLimitUsed: number
  totalReceivableRecorded: number
  totalComputedFromOrders?: number
  reconciliationMismatchCount?: number
  estimatedOverdueFromOrders: number
  urgentAgencyCount: number
  riskCounts: { riskBand: string; count: number }[]
  averageAgencyMaxOverdueDays: number
  cohortMaxOverdueDays: number
}

export type ReceivableWarningsAgencyRowDto = {
  agencyId: string
  name: string
  legalCompanyName?: string | null
  address?: string | null
  taxCode?: string | null
  assignedSellerId?: string | null
  assignedSellerName?: string | null
  totalDebt: number
  computedDebtFromOrders?: number | null
  debtReconciliationDelta?: number | null
  maxDebtLimit?: number | null
  utilizationPercent?: number | null
  estimatedOverdueAmount: number
  primaryAgingBucket: string
  maxOverdueDays: number
  riskBand: string
  isActive: boolean
}

export type ReceivableWarningContributingOrder = {
  orderId: string
  remainingAmount: number
  anchorDate: string
  dueDate: string
  overdueDays: number
  agingBucket: string
}

export type ReceivableWarningsAgencyDetailDto = {
  agencyId: string
  name: string
  legalCompanyName?: string | null
  totalDebtRecorded: number
  computedDebtFromOrders?: number | null
  debtReconciliationDelta?: number | null
  maxDebtLimit?: number | null
  utilizationPercent?: number | null
  riskBand: string
  oldestAnchorDateAmongOrders?: string | null
  overdueRatioVsRecordedDebt?: number | null
  agingBuckets: Record<string, number>
  agingBucketPercents: Record<string, number>
  maxOverdueDays: number
  contributingOrders: ReceivableWarningContributingOrder[]
}

const BUCKET_ORDER: ReceivableAgingBucketApi[] = [
  'CURRENT',
  'DAYS_1_30',
  'DAYS_31_60',
  'DAYS_61_90',
  'DAYS_OVER_90',
]

export function receivableBucketLabel(b: string): string {
  const m: Record<string, string> = {
    CURRENT: 'Chưa quá hạn',
    DAYS_1_30: '1–30 ngày',
    DAYS_31_60: '31–60 ngày',
    DAYS_61_90: '61–90 ngày',
    DAYS_OVER_90: '>90 ngày',
  }
  return m[b] ?? b
}

export function receivableRiskLabel(band: string): string {
  if (band === 'SERIOUS') return 'Nghiêm trọng'
  if (band === 'HIGH') return 'Cao'
  if (band === 'MONITOR') return 'Theo dõi'
  return band
}

/** Mã hiển thị KS-xxxxxxxx — ưu tiên mã số thuế nếu có (warning.md). */
export function formatReceivableAgencyCode(d: { agencyId: string; taxCode?: string | null }): string {
  const tc = d.taxCode?.trim()
  if (tc) return tc
  return `KS-${d.agencyId.replace(/-/g, '').slice(0, 8)}`
}

export function orderedAgingBuckets(
  map: Record<string, number> | undefined,
): { key: ReceivableAgingBucketApi; amount: number }[] {
  const m = map ?? {}
  return BUCKET_ORDER.map((key) => ({ key, amount: Number(m[key] ?? 0) }))
}

export type FetchReceivableWarningsSummaryParams = {
  limit?: number
  risk?: ReceivableRiskBand | 'ALL'
  today?: string
  onlyActive?: boolean
  signal?: AbortSignal
}

export async function fetchReceivableWarningsSummary(
  params: FetchReceivableWarningsSummaryParams = {},
): Promise<ReceivableWarningsSummaryDto> {
  const q = new URLSearchParams()
  if (params.limit != null) q.set('limit', String(params.limit))
  if (params.risk && params.risk !== 'ALL') q.set('risk', params.risk)
  if (params.today) q.set('today', params.today)
  if (params.onlyActive === false) q.set('only_active', 'false')
  const qs = q.toString()
  const url = `${API_BASE_URL}/api/director/reports/receivable-warnings/summary${qs ? `?${qs}` : ''}`
  const res = await fetch(url, { headers: { Accept: 'application/json', ...authHeader() }, signal: params.signal })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, body))
  }
  return unwrapData<ReceivableWarningsSummaryDto>(body, 'Phản hồi tổng quan cảnh báo nợ không hợp lệ')
}

export type FetchReceivableWarningsAgenciesParams = {
  search?: string
  risk?: ReceivableRiskBand | 'ALL'
  bucket?: ReceivableAgingBucketApi
  minOverdueDays?: number
  today?: string
  onlyActive?: boolean
  page?: number
  size?: number
  signal?: AbortSignal
}

export async function fetchReceivableWarningsAgencies(
  params: FetchReceivableWarningsAgenciesParams = {},
): Promise<PageResponse<ReceivableWarningsAgencyRowDto>> {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.risk && params.risk !== 'ALL') q.set('risk', params.risk)
  if (params.bucket) q.set('bucket', params.bucket)
  if (params.minOverdueDays != null) q.set('min_overdue_days', String(params.minOverdueDays))
  if (params.today) q.set('today', params.today)
  if (params.onlyActive === false) q.set('only_active', 'false')
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  const url = `${API_BASE_URL}/api/director/reports/receivable-warnings/agencies?${q.toString()}`
  const res = await fetch(url, { headers: { Accept: 'application/json', ...authHeader() }, signal: params.signal })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, body))
  }
  return unwrapPage<ReceivableWarningsAgencyRowDto>(body)
}

export async function fetchReceivableWarningsAgencyDetail(
  agencyId: string,
  params: { today?: string; signal?: AbortSignal } = {},
): Promise<ReceivableWarningsAgencyDetailDto> {
  const q = new URLSearchParams()
  if (params.today) q.set('today', params.today)
  const qs = q.toString()
  const url = `${API_BASE_URL}/api/director/reports/receivable-warnings/agencies/${encodeURIComponent(agencyId)}${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json', ...authHeader() },
    signal: params.signal,
  })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, body))
  }
  return unwrapData<ReceivableWarningsAgencyDetailDto>(body, 'Phản hồi chi tiết cảnh báo nợ không hợp lệ')
}
