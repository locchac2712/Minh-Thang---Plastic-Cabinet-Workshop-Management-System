import type { ChangeEvent } from 'react'
import { daysInclusive, type ChartGranularity } from './chartFormat'
import './DashboardDateFilter.css'

type GranularityMode = 'auto' | ChartGranularity

type Props = {
  fromDate: string
  toDate: string
  onFromChange: (d: string) => void
  onToChange: (d: string) => void
  granularityMode: GranularityMode
  onGranularityModeChange: (g: GranularityMode) => void
  onReset: () => void
  dayGranularityHeavy: boolean
  invalidRange: boolean
  effectiveGranularity: ChartGranularity
  /** Ẩn dropdown chu kỳ (ngày/tuần/tháng). */
  showGranularity?: boolean
  /** Ẩn nhãn "Kỳ: X ngày" và nút "30 ngày gần nhất". */
  showPeriodActions?: boolean
}

export function DashboardDateFilter({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  granularityMode,
  onGranularityModeChange,
  onReset,
  dayGranularityHeavy,
  invalidRange,
  effectiveGranularity,
  showGranularity = true,
  showPeriodActions = true,
}: Props) {
  const d = fromDate > toDate ? 0 : daysInclusive(fromDate, toDate)
  return (
    <div className="th-dash-date" role="region" aria-label="Bộ lọc kỳ thời gian">
      <div className="th-dash-date__row">
        <label className="th-dash-date__field">
          <span className="th-dash-date__lbl">Từ ngày</span>
          <input
            type="date"
            className="th-dash-date__input"
            value={fromDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onFromChange(e.target.value)}
          />
        </label>
        <label className="th-dash-date__field">
          <span className="th-dash-date__lbl">Đến ngày</span>
          <input
            type="date"
            className="th-dash-date__input"
            value={toDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onToChange(e.target.value)}
          />
        </label>
        {showGranularity ? (
          <label className="th-dash-date__field">
            <span className="th-dash-date__lbl">Chu kỳ</span>
            <select
              className="th-dash-date__input"
              value={granularityMode}
              onChange={(e) => onGranularityModeChange(e.target.value as GranularityMode)}
            >
              <option value="auto">Tự động ({mapGranularityVi(effectiveGranularity)})</option>
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </label>
        ) : null}
        {showPeriodActions ? (
          <div className="th-dash-date__actions">
            <span className="th-dash-date__span">{d > 0 ? `Kỳ: ${d} ngày` : ''}</span>
            <button type="button" className="th-dash-date__reset" onClick={onReset}>
              30 ngày gần nhất
            </button>
          </div>
        ) : null}
      </div>
      {invalidRange ? <p className="th-dash-date__warn">Ngày bắt đầu không được sau ngày kết thúc.</p> : null}
      {dayGranularityHeavy && !invalidRange ? (
        <p className="th-dash-date__warn">
          Kỳ dài: chúng tôi khuyến nghị dùng chu kỳ tự động hoặc theo tuần/tháng.
        </p>
      ) : null}
    </div>
  )
}

function mapGranularityVi(g: ChartGranularity): string {
  if (g === 'day') return 'ngày'
  if (g === 'week') return 'tuần'
  return 'tháng'
}
