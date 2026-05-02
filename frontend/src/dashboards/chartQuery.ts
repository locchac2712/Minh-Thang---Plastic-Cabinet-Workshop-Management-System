import type { ChartGranularity } from './chartFormat'

export type ChartRangeParams = {
  fromDate: string
  toDate: string
  /** Nếu bỏ qua, server có quy ước; FE cũng có suggestGranularity. */
  granularity?: ChartGranularity
  limit?: number
  top?: number
}

export type DateRangeQuery = { fromDate: string; toDate: string; granularity: ChartGranularity | undefined }
