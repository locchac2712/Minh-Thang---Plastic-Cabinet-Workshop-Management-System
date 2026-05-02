import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { ChartStatePanel } from '../../dashboards/ChartStatePanel'
import {
  CHART_TICK_COMPACT,
  CHART_TICK_DEFAULT,
  CHART_TICK_DENSE,
  CHART_TOOLTIP_SURFACE,
} from '../../dashboards/chartTypography'
import { DashboardDateFilter } from '../../dashboards/DashboardDateFilter'
import { formatBucketLabel, formatVndCompact, formatVndFull } from '../../dashboards/chartFormat'
import { useDashboardDateRange } from '../../dashboards/useDashboardDateRange'
import { useQueryChart } from '../../dashboards/useQueryChart'
import {
  fetchAccountantCashFlowTrend,
  fetchAccountantInvoiceStatusTrend,
  fetchAccountantPayablesAging,
  fetchAccountantReceivablesAging,
  fetchAccountantTopSuppliersDebt,
} from '../accountantDashboardChartsApi'
import type { AgingBucket } from '../../dashboards/chartTypes'
import './AccountantDashboardPage.css'

const CH = 280
const RANGES: (AgingBucket['range'] | string)[] = ['0-30', '31-60', '61-90', '>90']

function agingToChartData(rows: AgingBucket[] | null) {
  if (!rows) return []
  const m = new Map(rows.map((r) => [r.range, r]))
  return RANGES.map((r) => {
    const b = m.get(r as AgingBucket['range']) ?? { range: r as AgingBucket['range'], amount: 0, count: 0 }
    return {
      name: r,
      amount: b.amount,
      count: b.count,
    }
  })
}

export function AccountantDashboardPage() {
  const {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    granularityMode,
    setGranularityMode,
    effectiveGranularity,
    dayGranularityHeavy,
    invalidRange,
    reset,
  } = useDashboardDateRange()

  const en = !invalidRange
  const rangeQ = { fromDate, toDate, granularity: effectiveGranularity }
  const qk = `${fromDate}|${toDate}|${effectiveGranularity}`

  const cashQ = useQueryChart(
    `cft-${qk}`,
    () => fetchAccountantCashFlowTrend(rangeQ),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const arQ = useQueryChart('ara', () => fetchAccountantReceivablesAging(), {
    enabled: true,
    isEmpty: (d) => d.length === 0,
  })
  const apQ = useQueryChart('apa', () => fetchAccountantPayablesAging(), {
    enabled: true,
    isEmpty: (d) => d.length === 0,
  })
  const invQ = useQueryChart(
    `inv-${qk}`,
    () => fetchAccountantInvoiceStatusTrend(rangeQ),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const supQ = useQueryChart('tps', () => fetchAccountantTopSuppliersDebt(10), {
    enabled: true,
    isEmpty: (d) => d.length === 0 },
  )

  const kpi = useMemo(() => {
    const inSum = cashQ.data ? cashQ.data.reduce((s, p) => s + p.inflow, 0) : null
    const outSum = cashQ.data ? cashQ.data.reduce((s, p) => s + p.outflow, 0) : null
    const ar = arQ.data ? arQ.data.reduce((s, p) => s + p.amount, 0) : null
    const ap = apQ.data ? apQ.data.reduce((s, p) => s + p.amount, 0) : null
    return { inSum, outSum, ar, ap }
  }, [cashQ.data, arQ.data, apQ.data])

  return (
    <div className="th-acc-dashboard">
      <header className="th-acc-dashboard__header">
        <h1 className="th-acc-dashboard__title">Dashboard Kế toán</h1>
      </header>

      <DashboardDateFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
        granularityMode={granularityMode}
        onGranularityModeChange={setGranularityMode}
        onReset={reset}
        dayGranularityHeavy={dayGranularityHeavy}
        invalidRange={invalidRange}
        effectiveGranularity={effectiveGranularity}
      />

      <ul className="th-acc-dashboard__cards" aria-label="Chỉ số nhanh">
        <li className="th-acc-stat-card">
          <span className="th-acc-stat-card__label">Tổng dòng vào (kỳ)</span>
          <span className="th-acc-stat-card__value">
            {kpi.inSum == null ? '—' : formatVndFull(kpi.inSum)}
          </span>
        </li>
        <li className="th-acc-stat-card">
          <span className="th-acc-stat-card__label">Tổng dòng ra (kỳ)</span>
          <span className="th-acc-stat-card__value">
            {kpi.outSum == null ? '—' : formatVndFull(kpi.outSum)}
          </span>
        </li>
        <li className="th-acc-stat-card th-acc-stat-card--warn">
          <span className="th-acc-stat-card__label">Công nợ phải thu (aging)</span>
          <span className="th-acc-stat-card__value">
            {kpi.ar == null ? '—' : formatVndFull(kpi.ar)}
          </span>
        </li>
        <li className="th-acc-stat-card th-acc-stat-card--warn">
          <span className="th-acc-stat-card__label">Công nợ phải trả (aging)</span>
          <span className="th-acc-stat-card__value">
            {kpi.ap == null ? '—' : formatVndFull(kpi.ap)}
          </span>
        </li>
      </ul>

      <div className="th-acc-dashboard__charts">
        <ChartStatePanel
          title="Dòng tiền (từng mốc)"
          subtitle="Vào · ra · thặng dư thuần (net)"
          isLoading={cashQ.isLoading}
          error={cashQ.error}
          isEmpty={cashQ.isEmpty}
          height={`${CH + 20}px`}
        >
          <ResponsiveContainer width="100%" height={CH + 20}>
            <ComposedChart
              data={(cashQ.data ?? []).map((c) => ({
                label: formatBucketLabel(c.bucket, effectiveGranularity),
                inflow: c.inflow,
                outflow: c.outflow,
                net: c.net,
              }))}
              margin={{ top: 6, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={CHART_TICK_DEFAULT} />
              <YAxis
                yAxisId="left"
                width={64}
                tick={CHART_TICK_DEFAULT}
                tickFormatter={(v) => formatVndCompact(Number(v))}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={50}
                tick={CHART_TICK_DEFAULT}
                tickFormatter={(v) => formatVndCompact(Number(v))}
              />
              <Tooltip
                content={({ active, label, payload }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div style={CHART_TOOLTIP_SURFACE}>
                      <p style={{ margin: 0, color: '#64748b' }}>{String(label)}</p>
                      {payload.map((p) => (
                        <p key={p.name} style={{ margin: '2px 0 0' }}>
                          <span style={{ color: p.color }}>●</span> {p.name}: {formatVndFull(Number(p.value))}
                        </p>
                      ))}
                    </div>
                  )
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="inflow" name="Dòng vào" fill="#22c55e" maxBarSize={20} />
              <Bar yAxisId="left" dataKey="outflow" name="Dòng ra" fill="#f97316" maxBarSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="net" name="Net" stroke="#8b5cf6" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartStatePanel>

        <div className="th-acc-dashboard__row th-acc-dashboard__row--2">
          <ChartStatePanel
            title="Aging phải thu"
            isLoading={arQ.isLoading}
            error={arQ.error}
            isEmpty={arQ.isEmpty}
            height={`${CH - 20}px`}
          >
            <ResponsiveContainer width="100%" height={CH - 20}>
              <BarChart
                data={agingToChartData(arQ.data ?? null)}
                margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={CHART_TICK_COMPACT} tickFormatter={(v) => (v + ' ng') as string} />
                <YAxis
                  tick={CHART_TICK_DEFAULT}
                  width={64}
                  tickFormatter={(v) => formatVndCompact(Number(v))}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as { name: string; amount: number; count: number }
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                        <p style={{ fontWeight: 600 }}>Bucket {p.name} ngày</p>
                        <p style={{ margin: 0 }}>{formatVndFull(p.amount)}</p>
                        <p style={{ margin: 0, color: '#64748b' }}>Số đơn: {p.count}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="amount" name="amount" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Aging phải trả (NCC)"
            isLoading={apQ.isLoading}
            error={apQ.error}
            isEmpty={apQ.isEmpty}
            height={`${CH - 20}px`}
          >
            <ResponsiveContainer width="100%" height={CH - 20}>
              <BarChart
                data={agingToChartData(apQ.data ?? null)}
                margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={CHART_TICK_COMPACT} tickFormatter={(v) => (v + ' ng') as string} />
                <YAxis
                  tick={CHART_TICK_DEFAULT}
                  width={64}
                  tickFormatter={(v) => formatVndCompact(Number(v))}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as { name: string; amount: number; count: number }
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                        <p style={{ fontWeight: 600 }}>Bucket {p.name} ngày</p>
                        <p style={{ margin: 0 }}>{formatVndFull(p.amount)}</p>
                        <p style={{ margin: 0, color: '#64748b' }}>Số giao dịch: {p.count}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="amount" name="a" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>
        </div>

        <ChartStatePanel
          title="Hóa đơn: draft / phát hành / hủy + giá trị xuất"
          isLoading={invQ.isLoading}
          error={invQ.error}
          isEmpty={invQ.isEmpty}
          height={`${CH + 20}px`}
        >
          <ResponsiveContainer width="100%" height={CH + 20}>
            <ComposedChart
              data={(invQ.data ?? []).map((b) => ({
                label: formatBucketLabel(b.bucket, effectiveGranularity),
                draft: b.draft,
                issued: b.issued,
                canceled: b.canceled,
                totalAmountIssued: b.totalAmountIssued,
              }))}
              margin={{ top: 6, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={CHART_TICK_COMPACT} />
              <YAxis
                yAxisId="c"
                width={36}
                tick={CHART_TICK_DEFAULT}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="vnd"
                orientation="right"
                width={64}
                tick={CHART_TICK_DEFAULT}
                tickFormatter={(v) => formatVndCompact(Number(v))}
              />
              <Tooltip />
              <Legend />
              <Bar yAxisId="c" dataKey="draft" name="Nháp" stackId="s" fill="#94a3b8" maxBarSize={20} />
              <Bar yAxisId="c" dataKey="issued" name="Đã xuất" stackId="s" fill="#22c55e" maxBarSize={20} />
              <Bar yAxisId="c" dataKey="canceled" name="Hủy" stackId="s" fill="#f97316" maxBarSize={20} />
              <Line
                yAxisId="vnd"
                type="monotone"
                dataKey="totalAmountIssued"
                name="Giá trị xuất"
                stroke="#7c3aed"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartStatePanel>

        <div className="th-acc-dashboard__row th-acc-dashboard__row--2">
          <ChartStatePanel
            title="Nợ cần trả tại NCC (Top)"
            isLoading={supQ.isLoading}
            error={supQ.error}
            isEmpty={supQ.isEmpty}
            height={`${CH}px`}
          >
            <ResponsiveContainer width="100%" height={CH}>
              <BarChart
                data={[...(supQ.data ?? [])]
                  .map((r) => ({ name: r.name, value: r.value, count: r.count }))
                  .sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={CHART_TICK_DEFAULT} tickFormatter={(v) => formatVndCompact(Number(v))} />
                <YAxis dataKey="name" type="category" width={130} tick={CHART_TICK_DENSE} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as { name: string; value: number; count: number }
                    return (
                      <div style={CHART_TOOLTIP_SURFACE}>
                        <strong>{p.name}</strong>
                        <p style={{ margin: 4 }}>{formatVndFull(p.value)}</p>
                        <p style={{ margin: 0, color: '#64748b' }}>Số: {p.count}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="value" fill="#dc2626" name="Nợ" maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>
        </div>
      </div>
    </div>
  )
}
