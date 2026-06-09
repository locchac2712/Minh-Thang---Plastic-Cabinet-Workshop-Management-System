import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { DashboardDateFilter } from '../../dashboards/DashboardDateFilter'
import {
  CHART_TICK_COMPACT,
  CHART_TICK_DEFAULT,
  CHART_TOOLTIP_SURFACE_WIDE,
} from '../../dashboards/chartTypography'
import { useDashboardDateRange } from '../../dashboards/useDashboardDateRange'
import { useQueryChart } from '../../dashboards/useQueryChart'
import { ChartStatePanel } from '../../dashboards/ChartStatePanel'
import { formatBucketLabel, formatVndCompact, formatVndFull } from '../../dashboards/chartFormat'
import { orderStatusColor, orderStatusLabelVi } from '../../dashboards/orderStatusLabels'
import {
  fetchDirectorCashCollectionTrend,
  fetchDirectorGrossMarginTrend,
  fetchDirectorOrderStatusBreakdown,
  fetchDirectorRevenueTrend,
  fetchDirectorTopAgenciesRevenue,
} from '../directorDashboardChartsApi'
import './DirectorDashboardPage.css'

const CH_H = 280

export function DirectorDashboardPage() {
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

  const rangeQ = { fromDate, toDate, granularity: effectiveGranularity }
  const rangeL = { fromDate, toDate, granularity: effectiveGranularity, limit: 10 }
  const qk = `${fromDate}|${toDate}|${effectiveGranularity}`

  const en = !invalidRange

  const revQ = useQueryChart(
    `rev-${qk}`,
    () => fetchDirectorRevenueTrend(rangeQ),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const statusQ = useQueryChart(
    `os-${qk}`,
    () => fetchDirectorOrderStatusBreakdown(fromDate, toDate),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const gmQ = useQueryChart(
    `gm-${qk}`,
    () => fetchDirectorGrossMarginTrend(rangeQ),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const topQ = useQueryChart(
    `ta-${qk}`,
    () => fetchDirectorTopAgenciesRevenue(rangeL),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const cashQ = useQueryChart(
    `cs-${qk}`,
    () => fetchDirectorCashCollectionTrend(rangeQ),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )

  const mergedRevCash = useMemo(() => {
    if (!revQ.data || !cashQ.data) return null
    const m = new Map<string, { bucket: string; rev: number; cash: number }>()
    for (const p of revQ.data) {
      m.set(p.bucket, { bucket: p.bucket, rev: p.value, cash: 0 })
    }
    for (const p of cashQ.data) {
      const o = m.get(p.bucket) ?? { bucket: p.bucket, rev: 0, cash: 0 }
      o.cash = p.value
      m.set(p.bucket, o)
    }
    return Array.from(m.values()).sort((a, b) => a.bucket.localeCompare(b.bucket))
  }, [revQ.data, cashQ.data])

  const grossChartData = useMemo(() => {
    if (!gmQ.data) return []
    return gmQ.data.map((r) => ({
      label: formatBucketLabel(r.bucket, effectiveGranularity),
      revenue: r.revenue,
      cost: r.cost,
      marginPercent: r.marginPercent == null ? undefined : r.marginPercent,
    }))
  }, [gmQ.data, effectiveGranularity])

  return (
    <div className="th-director-dashboard">
      <header className="th-director-dashboard__header">
        <h1 className="th-director-dashboard__title">Dashboard Giám đốc</h1>
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

      <div className="th-director-dashboard__charts">
        <div className="th-director-dashboard__row th-director-dashboard__row--2">
          <ChartStatePanel
            title="Doanh thu"
            isLoading={revQ.isLoading}
            error={revQ.error}
            isEmpty={revQ.isEmpty}
            height={`${CH_H}px`}
          >
            <ResponsiveContainer width="100%" height={CH_H}>
              <AreaChart
                data={(revQ.data ?? []).map((p) => ({
                  label: formatBucketLabel(p.bucket, effectiveGranularity),
                  value: p.value,
                  count: p.count,
                }))}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={CHART_TICK_DEFAULT} />
                <YAxis tick={CHART_TICK_DEFAULT} tickFormatter={(v) => formatVndCompact(Number(v))} width={64} />
                <Tooltip content={<DirectorRevenueTooltip />} />
                <Area type="monotone" dataKey="value" name="value" stroke="#0ea5e9" fill="#7dd3fc" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Trạng thái đơn"
            isLoading={statusQ.isLoading}
            error={statusQ.error}
            isEmpty={statusQ.isEmpty}
            height={`${CH_H}px`}
          >
            {statusQ.data ? (
              <DirectorOrderDonut data={statusQ.data} />
            ) : null}
          </ChartStatePanel>
        </div>

        <ChartStatePanel
          title="Biên độ lợi nhuận"
          isLoading={gmQ.isLoading}
          error={gmQ.error}
          isEmpty={gmQ.isEmpty}
          height={`${CH_H + 20}px`}
        >
          <ResponsiveContainer width="100%" height={CH_H + 20}>
            <ComposedChart data={grossChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={CHART_TICK_DEFAULT} />
              <YAxis
                yAxisId="left"
                tick={CHART_TICK_DEFAULT}
                tickFormatter={(v) => formatVndCompact(Number(v))}
                width={68}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={CHART_TICK_DEFAULT}
                unit="%"
                width={40}
              />
              <Tooltip
                formatter={(value, name) => {
                  const n = String(name)
                  if (n === 'Biên %') {
                    if (value == null || (typeof value === 'number' && Number.isNaN(value))) {
                      return ['—', 'Biên %'] as [string, string]
                    }
                    return [`${Number(value).toFixed(1)}%`, 'Biên %'] as [string, string]
                  }
                  if (n === 'Doanh thu') {
                    return [formatVndFull(Number(value)), 'Doanh thu'] as [string, string]
                  }
                  if (n === 'Giá vốn') {
                    return [formatVndFull(Number(value)), 'Giá vốn'] as [string, string]
                  }
                  return [String(value), n] as [string, string]
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" name="Doanh thu" fill="#22c55e" maxBarSize={32} />
              <Bar yAxisId="left" dataKey="cost" name="Giá vốn" fill="#fb923c" maxBarSize={32} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="marginPercent"
                name="Biên %"
                stroke="#7c3aed"
                dot={false}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartStatePanel>

        <div className="th-director-dashboard__row th-director-dashboard__row--2">
          <ChartStatePanel
            title="Top đại lý theo doanh thu"
            subtitle="Theo kỳ đã chọn"
            isLoading={topQ.isLoading}
            error={topQ.error}
            isEmpty={topQ.isEmpty}
            height={`${CH_H}px`}
          >
            <ResponsiveContainer width="100%" height={CH_H}>
              <BarChart
                data={[...(topQ.data ?? [])]
                  .map((r) => ({ name: r.name, value: r.value, count: r.count }))
                  .sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={CHART_TICK_DEFAULT} tickFormatter={(v) => formatVndCompact(Number(v))} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={CHART_TICK_COMPACT}
                />
                <Tooltip
                  formatter={(value) => [formatVndFull(Number(value)), 'Doanh thu'] as [string, string]}
                  labelFormatter={(_l, p) => {
                    const c = p?.[0]?.payload as { count?: number } | undefined
                    return c?.count != null ? `Số đơn: ${c.count}` : ''
                  }}
                />
                <Bar dataKey="value" name="value" fill="#0ea5e9" maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Doanh thu vs Tiền thu thực tế"
            subtitle="Hai đường cùng mốc thời gian"
            isLoading={revQ.isLoading || cashQ.isLoading}
            error={revQ.error || cashQ.error}
            isEmpty={!mergedRevCash || mergedRevCash.length === 0}
            height={`${CH_H}px`}
          >
            {mergedRevCash && mergedRevCash.length > 0 ? (
              <ResponsiveContainer width="100%" height={CH_H}>
                <LineChart
                  data={mergedRevCash.map((r) => ({
                    label: formatBucketLabel(r.bucket, effectiveGranularity),
                    rev: r.rev,
                    cash: r.cash,
                  }))}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={CHART_TICK_DEFAULT} />
                  <YAxis tick={CHART_TICK_DEFAULT} tickFormatter={(v) => formatVndCompact(Number(v))} width={64} />
                  <Tooltip
                    formatter={(value, name) =>
                      [
                        formatVndFull(Number(value)),
                        (String(name) === 'Doanh thu' || String(name) === 'rev' ? 'Doanh thu' : 'Tiền thu') as string,
                      ] as [string, string]
                    }
                  />
                  <Legend />
                  <Line type="monotone" dataKey="rev" name="Doanh thu" stroke="#0ea5e9" dot={false} />
                  <Line type="monotone" dataKey="cash" name="Tiền thu" stroke="#16a34a" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </ChartStatePanel>
        </div>
      </div>
    </div>
  )
}

function DirectorRevenueTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload?: { value: number; count: number; label: string } }[]
}) {
  if (!active || !payload?.length) return null
  const pl = payload[0].payload as { value: number; count: number; label: string }
  return (
    <div
      className="th-recharts-tooltip"
      style={CHART_TOOLTIP_SURFACE_WIDE}
    >
      <p style={{ margin: 0, color: '#64748b' }}>{pl.label}</p>
      <p style={{ margin: '4px 0 0', fontWeight: 700, color: '#0f172a' }}>{formatVndFull(pl.value)}</p>
      <p style={{ margin: '2px 0 0', color: '#64748b' }}>Số đơn: {pl.count}</p>
    </div>
  )
}

function DirectorOrderDonut({ data }: { data: { name: string; value: number; count: number }[] }) {
  const total = data.reduce((s, x) => s + x.count, 0)
  const pieData = data.map((d) => ({ name: d.name, value: d.value, count: d.count, key: d.name }))

  return (
    <div className="th-dir-donut-wrap">
      <ResponsiveContainer width="100%" height={CH_H}>
        <PieChart>
          <Pie
            data={pieData as { name: string; value: number; count: number; key: string }[]}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="78%"
            paddingAngle={1}
            label={false}
          >
            {pieData.map((e, i) => (
              <Cell key={e.key + i} fill={orderStatusColor(e.name)} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0]
              const name = (p.payload as { name?: string })?.name ?? p.name
              const value = p.value
              const count = (p.payload as { count?: number })?.count
              return (
                <div
                  className="th-recharts-tooltip"
                  style={CHART_TOOLTIP_SURFACE_WIDE}
                >
                  <p style={{ margin: 0, fontWeight: 600 }}>{orderStatusLabelVi(String(name))}</p>
                  <p style={{ margin: '4px 0 0' }}>{formatVndFull(Number(value))}</p>
                  {count != null ? (
                    <p style={{ margin: '2px 0 0', color: '#64748b' }}>Số đơn: {count}</p>
                  ) : null}
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p className="th-dir-donut-center" aria-hidden>
        Tổng
        <strong>{total}</strong>
        đơn
      </p>
    </div>
  )
}
