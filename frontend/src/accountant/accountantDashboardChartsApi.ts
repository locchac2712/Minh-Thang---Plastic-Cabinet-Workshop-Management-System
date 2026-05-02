import { fetchChartJsonGet } from '../dashboards/dashboardChartsClient'
import type { AgingBucket, CashFlowPoint, InvoiceStatusPoint, NamedValuePoint } from '../dashboards/chartTypes'
import type { ChartGranularity } from '../dashboards/chartFormat'

const P = '/api/accountant/dashboard/charts' as const

type R = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined }

export async function fetchAccountantCashFlowTrend(q: R) {
  return fetchChartJsonGet<CashFlowPoint[]>(`${P}/cash-flow-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}

export async function fetchAccountantReceivablesAging() {
  return fetchChartJsonGet<AgingBucket[]>(`${P}/receivables-aging`, {})
}

export async function fetchAccountantPayablesAging() {
  return fetchChartJsonGet<AgingBucket[]>(`${P}/payables-aging`, {})
}

export async function fetchAccountantInvoiceStatusTrend(q: R) {
  return fetchChartJsonGet<InvoiceStatusPoint[]>(`${P}/invoice-status-trend`, {
    from_date: q.fromDate,
    to_date: q.toDate,
    granularity: q.granularity,
  })
}

export async function fetchAccountantTopSuppliersDebt(limit: number) {
  return fetchChartJsonGet<NamedValuePoint[]>(`${P}/top-suppliers-debt`, { limit })
}
