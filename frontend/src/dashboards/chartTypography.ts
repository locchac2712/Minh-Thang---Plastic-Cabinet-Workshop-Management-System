import type { CSSProperties } from 'react'

export const CHART_TICK_COMPACT = { fontSize: 10 } as const
export const CHART_TICK_DEFAULT = { fontSize: 11 } as const
export const CHART_TICK_DENSE = { fontSize: 9 } as const

export const CHART_TOOLTIP_SURFACE: CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  padding: 8,
  fontSize: 12,
}

export const CHART_TOOLTIP_SURFACE_WIDE: CSSProperties = {
  ...CHART_TOOLTIP_SURFACE,
  padding: '8px 10px',
}

export const CHART_CENTER_LABEL: CSSProperties = {
  fontSize: 12,
  color: '#64748b',
}

export const CHART_CENTER_TOTAL: CSSProperties = {
  display: 'block',
  fontSize: 18,
  color: '#0f172a',
}
