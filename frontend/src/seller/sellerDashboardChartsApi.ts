import { fetchChartJsonGet } from '../dashboards/dashboardChartsClient'
import type { AgencyDebtRow, BucketPoint, NamedValuePoint } from '../dashboards/chartTypes'
import type { ChartGranularity } from '../dashboards/chartFormat'

const P = '/api/seller/dashboard/charts' as const

type RangeG = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined; limit: number | undefined }
type R2 = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined }

export async function fetchSellerMyRevenueTrend(q: R2) {
  return fetchChartJsonGet<BucketPoint[]>(`${P}/my-revenue-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}

export async function fetchSellerMyOrderStatusBreakdown(fromDate: string, toDate: string) {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/my-order-status-breakdown`, {
    from_date: fromDate,
    to_date: toDate,
  })
}

export async function fetchSellerMyOpenOrdersCount() {
  return fetchChartJsonGet<{ count: number; approvedCount: number; producingCount: number }>(
    `${P}/my-open-orders-count`,
    {},
  )
}

export async function fetchSellerMyPipelineFunnel() {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/my-pipeline-funnel`, {})
}

export async function fetchSellerMyTopAgencies(q: RangeG) {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/my-top-agencies`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    limit: q.limit,
  })
}

export async function fetchSellerMyAgencyDebtRisk() {
  return fetchChartJsonGet<AgencyDebtRow[]>(`${P}/my-agency-debt-risk`, {})
}
