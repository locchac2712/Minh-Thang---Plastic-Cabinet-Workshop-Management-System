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
  CHART_TOOLTIP_SURFACE,
} from '../../dashboards/chartTypography'
import { DashboardDateFilter } from '../../dashboards/DashboardDateFilter'
import {
  agingBucketsToChartData,
  formatBucketLabel,
  formatVndCompact,
  formatVndFull,
} from '../../dashboards/chartFormat'
import { useDashboardDateRange } from '../../dashboards/useDashboardDateRange'
import { useQueryChart } from '../../dashboards/useQueryChart'
import {
  fetchAccountantCashFlowTrend,
  fetchAccountantPayablesAging,
  fetchAccountantReceivablesAging,
} from '../accountantDashboardChartsApi'
import './AccountantDashboardPage.css'

const CH = 280

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
          <span className="th-acc-stat-card__label">Tổng thu</span>
          <span className="th-acc-stat-card__value">
            {kpi.inSum == null ? '—' : formatVndFull(kpi.inSum)}
          </span>
        </li>
        <li className="th-acc-stat-card">
          <span className="th-acc-stat-card__label">Tổng chi</span>
          <span className="th-acc-stat-card__value">
            {kpi.outSum == null ? '—' : formatVndFull(kpi.outSum)}
          </span>
        </li>
        <li className="th-acc-stat-card th-acc-stat-card--warn">
          <span className="th-acc-stat-card__label">Công nợ phải thu</span>
          <span className="th-acc-stat-card__value">
            {kpi.ar == null ? '—' : formatVndFull(kpi.ar)}
          </span>
        </li>
        <li className="th-acc-stat-card th-acc-stat-card--warn">
          <span className="th-acc-stat-card__label">Công nợ phải trả</span>
          <span className="th-acc-stat-card__value">
            {kpi.ap == null ? '—' : formatVndFull(kpi.ap)}
          </span>
        </li>
      </ul>

      <div className="th-acc-dashboard__charts">
        <ChartStatePanel
          title="Thu – Chi theo kỳ"
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
              <Bar yAxisId="left" dataKey="inflow" name="Thu" fill="#22c55e" maxBarSize={20} />
              <Bar yAxisId="left" dataKey="outflow" name="Chi" fill="#f97316" maxBarSize={20} />
              <Line yAxisId="right" type="monotone" dataKey="net" name="Chênh lệch" stroke="#8b5cf6" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartStatePanel>

        <div className="th-acc-dashboard__row th-acc-dashboard__row--2">
          <ChartStatePanel
            title="Công nợ phải thu theo thời gian"
            isLoading={arQ.isLoading}
            error={arQ.error}
            isEmpty={arQ.isEmpty}
            height={`${CH - 20}px`}
          >
            <ResponsiveContainer width="100%" height={CH - 20}>
              <BarChart
                data={agingBucketsToChartData(arQ.data ?? null)}
                margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={CHART_TICK_COMPACT} interval={0} />
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
                        <p style={{ fontWeight: 600, margin: 0 }}>{p.name}</p>
                        <p style={{ margin: '4px 0 0' }}>Số tiền: {formatVndFull(p.amount)}</p>
                        <p style={{ margin: '2px 0 0', color: '#64748b' }}>Số đơn: {p.count}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="amount" name="Số tiền" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Công nợ phải trả NCC theo thời gian"
            isLoading={apQ.isLoading}
            error={apQ.error}
            isEmpty={apQ.isEmpty}
            height={`${CH - 20}px`}
          >
            <ResponsiveContainer width="100%" height={CH - 20}>
              <BarChart
                data={agingBucketsToChartData(apQ.data ?? null)}
                margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={CHART_TICK_COMPACT} interval={0} />
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
                        <p style={{ fontWeight: 600, margin: 0 }}>{p.name}</p>
                        <p style={{ margin: '4px 0 0' }}>Số tiền: {formatVndFull(p.amount)}</p>
                        <p style={{ margin: '2px 0 0', color: '#64748b' }}>Số đơn mua: {p.count}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="amount" name="Số tiền" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>
        </div>
      </div>
    </div>
  )
}
