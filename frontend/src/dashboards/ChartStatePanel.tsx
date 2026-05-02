import type { ReactNode } from 'react'
import './ChartStatePanel.css'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
  height?: string
  isLoading: boolean
  error: string | null
  isEmpty: boolean
  emptyMessage?: string
  /** Optional panel id for aria */
  id?: string
}

export function ChartStatePanel({
  title,
  subtitle,
  children,
  height = '18rem',
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'Không có dữ liệu trong kỳ.',
  id,
}: Props) {
  return (
    <section className="th-chart-panel" aria-labelledby={id ?? 'th-chart-panel-h'}>
      <div className="th-chart-panel__head">
        <h2 className="th-chart-panel__title" id={id ?? 'th-chart-panel-h'}>
          {title}
        </h2>
        {subtitle ? <p className="th-chart-panel__sub">{subtitle}</p> : null}
      </div>
      <div className="th-chart-panel__body" style={{ minHeight: height }}>
        {isLoading ? (
          <div className="th-chart-panel__skeleton" aria-hidden>
            <div className="th-chart-panel__skeleton-bars" />
          </div>
        ) : error ? (
          <p className="th-chart-panel__err" role="alert">
            {error}
          </p>
        ) : isEmpty ? (
          <p className="th-chart-panel__empty">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}
