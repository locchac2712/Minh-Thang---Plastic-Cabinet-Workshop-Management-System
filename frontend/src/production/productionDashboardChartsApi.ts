import { fetchChartJsonGet } from '../dashboards/dashboardChartsClient'
import type { BucketPoint, MaterialConsumptionResponse, NamedValuePoint } from '../dashboards/chartTypes'
import type { ChartGranularity } from '../dashboards/chartFormat'

const P = '/api/production/dashboard/charts' as const

type R = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined }
type RT = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined; top: number | undefined }
type RL = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined; limit: number | undefined }

export async function fetchProductionTaskCompletionTrend(q: R) {
  return fetchChartJsonGet<BucketPoint[]>(`${P}/task-completion-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}

export async function fetchProductionTaskStatusBreakdown() {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/task-status-breakdown`, {})
}

export async function fetchProductionTopWorkersThroughput(q: RL) {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/top-workers-throughput`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    limit: q.limit,
  })
}

export async function fetchProductionMaterialConsumptionTrend(q: RT) {
  return fetchChartJsonGet<MaterialConsumptionResponse>(`${P}/material-consumption-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
    top: q.top,
  })
}

export async function fetchProductionLateTaskTrend(q: R) {
  return fetchChartJsonGet<BucketPoint[]>(`${P}/late-task-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}
