import { getAccessToken, getTokenType } from '../auth/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export type ShopFloorKpiSummary = {
  doneCompletedInPeriod: number
  doneWithExpectedDate: number
  onTimeCount: number
  lateCount: number
  doneWithoutExpectedCount: number
  onTimePercent: number
  averageDelayDaysLate: number
}

export type WipSnapshot = {
  waitingCount: number
  doingCount: number
  waitingTotalQuantity: number
  doingTotalQuantity: number
}

export type ShopFloorThroughputItem = {
  period: string
  doneTaskCount: number
  totalQuantity: number
}

export type ShopFloorAssigneeStats = {
  userId: string
  fullName: string
  doneCount: number
  withExpectedCount: number
  onTimeCount: number
  onTimePercent: number
  totalDoneQuantity: number
}

export type ShopFloorPerformanceReport = {
  fromDate: string | null
  toDate: string | null
  kpi: ShopFloorKpiSummary
  wip: WipSnapshot
  throughputByMonth: ShopFloorThroughputItem[]
  byAssignee: ShopFloorAssigneeStats[]
}

export type FetchDirectorShopFloorParams = {
  fromDate?: string
  toDate?: string
}

function unwrapReport(raw: unknown): ShopFloorPerformanceReport {
  if (raw && typeof raw === 'object' && 'kpi' in raw && 'byAssignee' in raw) {
    return raw as ShopFloorPerformanceReport
  }
  const w = raw as { success?: boolean; data?: ShopFloorPerformanceReport; message?: string }
  if (w?.success && w.data) return w.data
  throw new Error(w?.message || 'Phản hồi hiệu suất xưởng không hợp lệ')
}

export async function fetchDirectorShopFloorReport(
  params: FetchDirectorShopFloorParams = {},
): Promise<ShopFloorPerformanceReport> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('Thiếu access token')
  const q = new URLSearchParams()
  if (params.fromDate) q.set('from_date', params.fromDate)
  if (params.toDate) q.set('to_date', params.toDate)
  const res = await fetch(
    `${API_BASE_URL}/api/director/reports/shop-floor?${q.toString()}`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const body = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in (body as object)
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được báo cáo hiệu suất xưởng')
  }
  return unwrapReport(body)
}
