import type { ChartGranularity } from './chartFormat'

export type { ChartGranularity }
export type { ChartRangeParams, DateRangeQuery } from './chartQuery'

export type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message?: string
  data: T
  errors?: unknown
  timestamp?: string
}

/** 1.3 single-series */
export type BucketPoint = { bucket: string; value: number; count: number }
export type NamedValuePoint = { name: string; value: number; count: number }
export type AgingBucket = { range: '0-30' | '31-60' | '61-90' | '>90'; amount: number; count: number }

export type DirectorGrossMarginPoint = {
  bucket: string
  revenue: number
  cost: number
  grossMargin: number
  marginPercent: number | null
}

export type MaterialTopEntry = { materialCode: string; materialName: string }

export type MaterialConsumptionResponse = {
  topMaterials: MaterialTopEntry[]
  series: { bucket: string; values: Record<string, number> }[]
}

export type CashFlowPoint = {
  bucket: string
  inflow: number
  outflow: number
  net: number
}

export type InvoiceStatusPoint = {
  bucket: string
  draft: number
  issued: number
  canceled: number
  totalAmountIssued: number
}

export type AgencyDebtRow = {
  agencyId: string
  agencyName: string
  totalDebt: number
  maxDebtLimit: number
  debtRatioPercent: number
}
