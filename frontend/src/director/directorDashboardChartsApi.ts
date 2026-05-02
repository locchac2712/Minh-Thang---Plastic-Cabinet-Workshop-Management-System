import { fetchChartJsonGet } from '../dashboards/dashboardChartsClient'
import type { BucketPoint, DirectorGrossMarginPoint, NamedValuePoint } from '../dashboards/chartTypes'
import type { ChartGranularity } from '../dashboards/chartFormat'

const P = '/api/director/dashboard/charts' as const

type RangeQ = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined }
type RangeG = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined; limit: number | undefined }

export async function fetchDirectorRevenueTrend(q: RangeQ) {
  return fetchChartJsonGet<BucketPoint[]>(`${P}/revenue-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}

export async function fetchDirectorOrderStatusBreakdown(fromDate: string, toDate: string) {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/order-status-breakdown`, {
    from_date: fromDate,
    to_date: toDate,
  })
}

export async function fetchDirectorGrossMarginTrend(q: RangeQ) {
  return fetchChartJsonGet<DirectorGrossMarginPoint[]>(`${P}/gross-margin-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}

export async function fetchDirectorTopAgenciesRevenue(q: RangeG) {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/top-agencies-revenue`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    limit: q.limit,
  })
}

export async function fetchDirectorCashCollectionTrend(q: RangeQ) {
  return fetchChartJsonGet<BucketPoint[]>(`${P}/cash-collection-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}
