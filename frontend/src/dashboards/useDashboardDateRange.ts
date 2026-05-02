import { useCallback, useMemo, useState } from 'react'
import { daysInclusive, suggestGranularity, type ChartGranularity } from './chartFormat'

function toIso(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function defaultDateRange30Days() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  return { fromDate: toIso(from), toDate: toIso(to) }
}

type GranularityMode = 'auto' | ChartGranularity

export function useDashboardDateRange() {
  const [fromDate, setFromDate] = useState(() => defaultDateRange30Days().fromDate)
  const [toDate, setToDate] = useState(() => defaultDateRange30Days().toDate)
  const [granularityMode, setGranularityMode] = useState<GranularityMode>('auto')

  const effectiveGranularity: ChartGranularity = useMemo(() => {
    if (granularityMode !== 'auto') return granularityMode
    return suggestGranularity(fromDate, toDate)
  }, [fromDate, toDate, granularityMode])

  const daySpan = useMemo(() => daysInclusive(fromDate, toDate), [fromDate, toDate])
  const dayGranularityHeavy = granularityMode === 'day' && daySpan > 180
  const invalidRange = fromDate > toDate

  const reset = useCallback(() => {
    const d = defaultDateRange30Days()
    setFromDate(d.fromDate)
    setToDate(d.toDate)
    setGranularityMode('auto')
  }, [])

  return {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    granularityMode,
    setGranularityMode,
    effectiveGranularity,
    daySpan,
    dayGranularityHeavy,
    invalidRange,
    reset,
  }
}
