import { Fragment, useId, type CSSProperties } from 'react'
import type {
  DonutSlice,
  GroupedQuarterRow,
  ProductByCategoryRow,
  RadarAxisRow,
  StaffByRoleRow,
  StockBandRow,
  TrendPoint,
} from './adminDashboardMock'

const ROLE_BAR = '#38bdf8'
const WARN = '#f59e0b'
const CRIT = '#ef4444'
const OK = '#22c55e'

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/** Cung vành khuyên (donut) — góc đo từ trục +x, tăng theo chiều kim đồng hồ trên mặt phẳng SVG. */
function annularSectorPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startDeg: number,
  endDeg: number,
): string {
  const delta = endDeg - startDeg
  // Một cung SVG không thể là đủ 360° (điểm đầu = điểm cuối → không vẽ). Chia đôi cung.
  if (delta >= 359.999) {
    const mid = startDeg + 180
    return `${annularSectorPath(cx, cy, rOut, rIn, startDeg, mid)} ${annularSectorPath(cx, cy, rOut, rIn, mid, endDeg)}`
  }
  const large = delta > 180 ? 1 : 0
  const sr = toRad(startDeg)
  const er = toRad(endDeg)
  const x1 = cx + rOut * Math.cos(sr)
  const y1 = cy + rOut * Math.sin(sr)
  const x2 = cx + rOut * Math.cos(er)
  const y2 = cy + rOut * Math.sin(er)
  const x3 = cx + rIn * Math.cos(er)
  const y3 = cy + rIn * Math.sin(er)
  const x4 = cx + rIn * Math.cos(sr)
  const y4 = cy + rIn * Math.sin(sr)
  return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${large} 0 ${x4} ${y4} Z`
}

type HorizontalBarsProps = {
  title: string
  subtitle?: string
  rows: StaffByRoleRow[]
  footnote?: string
}

export function AdminDashStaffRoleBars({ title, subtitle, rows, footnote }: HorizontalBarsProps) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  const summary = rows.map((r) => `${r.role} ${r.count}`).join(', ')

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-staff-role-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-staff-role-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div
        className="th-admin-dash-hbar"
        role="img"
        aria-label={`Phân bổ nhân sự theo vai trò: ${summary}`}
      >
        <ul className="th-admin-dash-hbar__list">
          {rows.map((r) => (
            <li key={r.role} className="th-admin-dash-hbar__row">
              <span className="th-admin-dash-hbar__label">{r.role}</span>
              <div className="th-admin-dash-hbar__track" aria-hidden>
                <div
                  className="th-admin-dash-hbar__fill"
                  style={{
                    width: `${(r.count / max) * 100}%`,
                    background: ROLE_BAR,
                  }}
                />
              </div>
              <span className="th-admin-dash-hbar__value">{r.count}</span>
            </li>
          ))}
        </ul>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type StackedProps = {
  title: string
  subtitle?: string
  bands: StockBandRow[]
  footnote?: string
}

export function AdminDashMaterialStockStack({ title, subtitle, bands, footnote }: StackedProps) {
  const total = bands.reduce((s, b) => s + b.count, 0) || 1
  const colors: Record<StockBandRow['key'], string> = {
    ok: OK,
    warn: WARN,
    crit: CRIT,
  }
  const summary = bands.map((b) => `${b.label} ${b.count}`).join('; ')

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-mat-stack-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-mat-stack-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div
        className="th-admin-dash-stack"
        role="img"
        aria-label={`Tồn kho vật tư phân bổ: ${summary}. Tổng ${total} mã hàng.`}
      >
        <div className="th-admin-dash-stack__bar" aria-hidden>
          {bands.map((b) => (
            <div
              key={b.key}
              className="th-admin-dash-stack__seg"
              style={{
                flex: b.count,
                background: colors[b.key],
              }}
              title={`${b.label}: ${b.count}`}
            />
          ))}
        </div>
        <ul className="th-admin-dash-stack__legend">
          {bands.map((b) => (
            <li key={b.key} className="th-admin-dash-stack__legend-item">
              <span className="th-admin-dash-stack__dot" style={{ background: colors[b.key] }} />
              <span className="th-admin-dash-stack__legend-text">
                {b.label}
                <strong className="th-admin-dash-stack__legend-num">{b.count}</strong>
              </span>
            </li>
          ))}
        </ul>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type LineProps = {
  title: string
  subtitle?: string
  points: TrendPoint[]
  footnote?: string
}

/** Đường + vùng tô (area) — xu hướng cảnh báo */
export function AdminDashAlertTrendLine({ title, subtitle, points, footnote }: LineProps) {
  const gradId = `dash-area-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  if (!points.length) {
    return (
      <section className="th-admin-dash-panel" aria-labelledby="dash-trend-title">
        <div className="th-admin-dash-panel__head">
          <h2 id="dash-trend-title" className="th-admin-dash-panel__title">
            {title}
          </h2>
          {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
        </div>
        <p className="th-admin-dash-panel__foot" role="status">
          Chưa có điểm dữ liệu cho khoảng thời gian này.
        </p>
        {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
      </section>
    )
  }
  const values = points.map((p) => p.alertCount)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const pad = 8
  const w = 320
  const h = 120
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const span = maxV - minV || 1
  const norm = (v: number) => innerH - ((v - minV) / span) * innerH
  const baseY = pad + innerH
  const coords = points.map((p, i) => {
    const x = pad + (i / Math.max(1, points.length - 1)) * innerW
    const y = pad + norm(p.alertCount)
    return { x, y, label: p.label }
  })
  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ')
  const areaPath = `M ${coords[0].x} ${baseY} L ${coords.map((c) => `${c.x} ${c.y}`).join(' L ')} L ${coords[coords.length - 1].x} ${baseY} Z`
  const last = values[values.length - 1]
  const summary = `Xu hướng cảnh báo tồn kho 7 ngày; hiện tại ${last} mã hàng dưới hoặc gần ngưỡng tối thiểu.`

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-trend-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-trend-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div className="th-admin-dash-line-wrap">
        <svg
          className="th-admin-dash-line"
          viewBox={`0 0 ${w} ${h}`}
          role="img"
          aria-label={summary}
        >
          <title>{summary}</title>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <line
            x1={pad}
            y1={baseY}
            x2={w - pad}
            y2={baseY}
            className="th-admin-dash-line__axis"
          />
          <path d={areaPath} className="th-admin-dash-area__fill" fill={`url(#${gradId})`} />
          <polyline className="th-admin-dash-line__stroke" points={polyline} fill="none" />
          {coords.map((c, i) => (
            <circle key={`${i}-${c.x}`} cx={c.x} cy={c.y} r={3.5} className="th-admin-dash-line__dot" />
          ))}
        </svg>
        <ul className="th-admin-dash-line__labels" aria-hidden>
          {points.map((p, i) => (
            <li key={`${i}-${p.label}`}>{p.label}</li>
          ))}
        </ul>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type CatProps = {
  title: string
  subtitle?: string
  rows: ProductByCategoryRow[]
  footnote?: string
}

export function AdminDashCategoryBars({ title, subtitle, rows, footnote }: CatProps) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  const accent = '#0ea5e9'

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-cat-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-cat-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div className="th-admin-dash-vbar" role="presentation">
        <div className="th-admin-dash-vbar__chart" aria-hidden>
          {rows.map((r) => (
            <div key={r.category} className="th-admin-dash-vbar__col">
              <div
                className="th-admin-dash-vbar__fill"
                style={{
                  height: `${(r.count / max) * 100}%`,
                  background: `linear-gradient(180deg, ${accent}, #0369a1)`,
                }}
                title={`${r.category}: ${r.count}`}
              />
              <span className="th-admin-dash-vbar__num">{r.count}</span>
            </div>
          ))}
        </div>
        <ul className="th-admin-dash-vbar__cats">
          {rows.map((r) => (
            <li key={r.category}>{r.category}</li>
          ))}
        </ul>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type DonutProps = {
  title: string
  subtitle?: string
  slices: DonutSlice[]
  footnote?: string
}

export function AdminDashDonutChart({ title, subtitle, slices, footnote }: DonutProps) {
  const cx = 50
  const cy = 50
  const rOut = 38
  const rIn = 22
  const total = slices.reduce((s, x) => s + x.value, 0) || 1
  let cursor = -90
  const paths = slices.map((sl) => {
    const sweep = (sl.value / total) * 360
    const start = cursor
    const end = cursor + sweep
    cursor = end
    return {
      ...sl,
      d: annularSectorPath(cx, cy, rOut, rIn, start, end),
    }
  })
  const summary = slices.map((s) => `${s.label} ${s.value}`).join(', ')

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-donut-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-donut-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div className="th-admin-dash-donut">
        <svg
          className="th-admin-dash-donut__svg"
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Trạng thái BOM: ${summary}`}
        >
          <title>{summary}</title>
          {paths.map((p) => (
            <path key={p.key} d={p.d} fill={p.color} className="th-admin-dash-donut__slice" />
          ))}
        </svg>
        <ul className="th-admin-dash-donut__legend">
          {slices.map((s) => (
            <li key={s.key} className="th-admin-dash-donut__legend-item">
              <span className="th-admin-dash-donut__dot" style={{ background: s.color }} />
              <span className="th-admin-dash-donut__lbl">{s.label}</span>
              <strong className="th-admin-dash-donut__num">{s.value}</strong>
            </li>
          ))}
        </ul>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type GaugeProps = {
  title: string
  subtitle?: string
  /** 0–100 */
  value: number
  footnote?: string
}

/** Gauge nửa vòng — độ phủ BOM hoặc chỉ số đơn */
export function AdminDashGauge({ title, subtitle, value, footnote }: GaugeProps) {
  const pct = Math.min(100, Math.max(0, value))
  const r = 36
  const c = Math.PI * r
  const dash = (pct / 100) * c
  const pctLabel = Number.isInteger(pct) ? String(pct) : pct.toFixed(1)
  const summary = `Độ phủ định mức khoảng ${pctLabel} phần trăm.`

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-gauge-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-gauge-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div className="th-admin-dash-gauge" role="img" aria-label={summary}>
        <svg className="th-admin-dash-gauge__svg" viewBox="0 0 100 56" aria-hidden>
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            className="th-admin-dash-gauge__track"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 14 50 A 36 36 0 0 1 86 50"
            fill="none"
            className="th-admin-dash-gauge__value"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="th-admin-dash-gauge__label">
          <span className="th-admin-dash-gauge__pct">{pctLabel}</span>
          <span className="th-admin-dash-gauge__unit">%</span>
        </div>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type RadarProps = {
  title: string
  subtitle?: string
  axes: RadarAxisRow[]
  footnote?: string
}

export function AdminDashRadarChart({ title, subtitle, axes, footnote }: RadarProps) {
  const n = axes.length
  const cx = 50
  const cy = 52
  const R = 38
  const toPoint = (i: number, score: number) => {
    const angle = toRad(-90 + (360 / n) * i)
    const r = (score / 100) * R
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }
  const poly = axes.map((a, i) => toPoint(i, a.score))
  const pointsStr = poly.map((p) => `${p.x},${p.y}`).join(' ')
  const grid = Array.from({ length: n }, (_, i) => {
    const angle = toRad(-90 + (360 / n) * i)
    const x2 = cx + R * Math.cos(angle)
    const y2 = cy + R * Math.sin(angle)
    return (
      <line
        key={axes[i].label}
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        className="th-admin-dash-radar__axis"
      />
    )
  })
  const summary = axes.map((a) => `${a.label} ${a.score}`).join('; ')

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-radar-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-radar-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div className="th-admin-dash-radar-wrap">
        <svg
          className="th-admin-dash-radar"
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Chỉ số cấu hình: ${summary}`}
        >
          <title>{summary}</title>
          <polygon
            className="th-admin-dash-radar__grid-outer"
            points={Array.from({ length: n }, (_, i) => {
              const angle = toRad(-90 + (360 / n) * i)
              const x = cx + R * Math.cos(angle)
              const y = cy + R * Math.sin(angle)
              return `${x},${y}`
            }).join(' ')}
          />
          <polygon
            className="th-admin-dash-radar__grid-mid"
            points={Array.from({ length: n }, (_, i) => {
              const angle = toRad(-90 + (360 / n) * i)
              const x = cx + (R * 0.55) * Math.cos(angle)
              const y = cy + (R * 0.55) * Math.sin(angle)
              return `${x},${y}`
            }).join(' ')}
          />
          {grid}
          <polygon className="th-admin-dash-radar__data" points={pointsStr} />
        </svg>
        <ul className="th-admin-dash-radar__legend">
          {axes.map((a) => (
            <li key={a.label}>
              <span className="th-admin-dash-radar__legend-lbl">{a.label}</span>
              <strong className="th-admin-dash-radar__legend-val">{a.score}</strong>
            </li>
          ))}
        </ul>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type HeatProps = {
  title: string
  subtitle?: string
  colLabels: string[]
  rowLabels: string[]
  values: number[][]
  footnote?: string
}

export function AdminDashHeatmap({ title, subtitle, colLabels, rowLabels, values, footnote }: HeatProps) {
  const flat = values.flat()
  const vmax = Math.max(1, ...flat)
  const heat = (v: number) => {
    const t = v / vmax
    const bg =
      t < 0.34
        ? 'rgba(34, 197, 94, 0.22)'
        : t < 0.67
          ? 'rgba(245, 158, 11, 0.35)'
          : 'rgba(239, 68, 68, 0.4)'
    return bg
  }
  const summary = `Ma trận cảnh báo theo loại vật tư và ngày; tối đa ${vmax} điểm nóng.`
  const gridCols = `minmax(4.5rem, auto) repeat(${colLabels.length}, minmax(0, 1fr))`

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-heat-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-heat-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div
        className="th-admin-dash-heat"
        role="img"
        aria-label={summary}
        style={{ gridTemplateColumns: gridCols } as CSSProperties}
      >
        <div className="th-admin-dash-heat__cell th-admin-dash-heat__cell--corner" aria-hidden />
        {colLabels.map((c, ci) => (
          <span key={`heat-col-${ci}-${c}`} className="th-admin-dash-heat__head th-admin-dash-heat__head--col">
            {c}
          </span>
        ))}
        {rowLabels.map((row, ri) => (
          <Fragment key={row}>
            <span className="th-admin-dash-heat__head th-admin-dash-heat__head--row">{row}</span>
            {values[ri]?.map((cell, ci) => (
              <span
                key={`${ri}-${ci}`}
                className="th-admin-dash-heat__cell"
                style={{ background: heat(cell) }}
                title={`${row} · ${colLabels[ci]}: ${cell}`}
              >
                {cell}
              </span>
            ))}
          </Fragment>
        ))}
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}

type GroupProps = {
  title: string
  subtitle?: string
  rows: GroupedQuarterRow[]
  labelA: string
  labelB: string
  footnote?: string
}

export function AdminDashGroupedBars({
  title,
  subtitle,
  rows,
  labelA,
  labelB,
  footnote,
}: GroupProps) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.agencies, r.suppliers]))
  const barA = '#7c3aed'
  const barB = '#0d9488'

  return (
    <section className="th-admin-dash-panel" aria-labelledby="dash-group-title">
      <div className="th-admin-dash-panel__head">
        <h2 id="dash-group-title" className="th-admin-dash-panel__title">
          {title}
        </h2>
        {subtitle ? <p className="th-admin-dash-panel__sub">{subtitle}</p> : null}
      </div>
      <div className="th-admin-dash-group" role="img" aria-label="So sánh bổ sung đại lý và NCC theo quý">
        <ul className="th-admin-dash-group__legend" aria-hidden>
          <li>
            <span className="th-admin-dash-group__lg" style={{ background: barA }} />
            {labelA}
          </li>
          <li>
            <span className="th-admin-dash-group__lg" style={{ background: barB }} />
            {labelB}
          </li>
        </ul>
        <div className="th-admin-dash-group__chart">
          {rows.map((r) => (
            <div key={r.period} className="th-admin-dash-group__period">
              <span className="th-admin-dash-group__p-label">{r.period}</span>
              <div className="th-admin-dash-group__pair">
                <div className="th-admin-dash-group__track">
                  <div
                    className="th-admin-dash-group__fill"
                    style={{
                      width: `${(r.agencies / max) * 100}%`,
                      background: barA,
                    }}
                  />
                </div>
                <div className="th-admin-dash-group__track">
                  <div
                    className="th-admin-dash-group__fill"
                    style={{
                      width: `${(r.suppliers / max) * 100}%`,
                      background: barB,
                    }}
                  />
                </div>
              </div>
              <span className="th-admin-dash-group__nums">
                {r.agencies}/{r.suppliers}
              </span>
            </div>
          ))}
        </div>
      </div>
      {footnote ? <p className="th-admin-dash-panel__foot">{footnote}</p> : null}
    </section>
  )
}
