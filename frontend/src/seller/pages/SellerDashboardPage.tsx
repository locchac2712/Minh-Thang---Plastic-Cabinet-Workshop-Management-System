import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { ChartStatePanel } from '../../dashboards/ChartStatePanel'
import { DashboardDateFilter } from '../../dashboards/DashboardDateFilter'
import { formatBucketLabel, formatVndCompact, formatVndFull } from '../../dashboards/chartFormat'
import {
  CHART_CENTER_LABEL,
  CHART_CENTER_TOTAL,
  CHART_TICK_COMPACT,
  CHART_TICK_DEFAULT,
  CHART_TOOLTIP_SURFACE,
} from '../../dashboards/chartTypography'
import { useDashboardDateRange } from '../../dashboards/useDashboardDateRange'
import { useQueryChart } from '../../dashboards/useQueryChart'
import { orderStatusColor, orderStatusLabelVi, sortPipelineFunnel } from '../../dashboards/orderStatusLabels'
import {
  fetchSellerMyAgencyDebtRisk,
  fetchSellerMyOrderStatusBreakdown,
  fetchSellerMyPipelineFunnel,
  fetchSellerMyRevenueTrend,
  fetchSellerMyTopAgencies,
} from '../sellerDashboardChartsApi'
import './SellerDashboardPage.css'

const CH = 280

export function SellerDashboardPage() {
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
  const rangeL = { fromDate, toDate, granularity: effectiveGranularity, limit: 10 }
  const qk = `${fromDate}|${toDate}|${effectiveGranularity}`

  const revQ = useQueryChart(
    `srv-${qk}`,
    () => fetchSellerMyRevenueTrend(rangeQ),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const statusQ = useQueryChart(
    `sos-${qk}`,
    () => fetchSellerMyOrderStatusBreakdown(fromDate, toDate),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const funQ = useQueryChart('spf', () => fetchSellerMyPipelineFunnel(), {
    enabled: true,
    isEmpty: (d) => d.length === 0,
  })
  const topQ = useQueryChart(
    `sta-${qk}`,
    () => fetchSellerMyTopAgencies(rangeL),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const debtQ = useQueryChart('sdr', () => fetchSellerMyAgencyDebtRisk(), {
    enabled: true,
    isEmpty: (d) => d.length === 0 },
  )

  const funnelData = useMemo(() => {
    if (!funQ.data) return []
    return sortPipelineFunnel(funQ.data).map((p) => ({
      stage: orderStatusLabelVi(p.name),
      name: p.name,
      count: p.count,
      value: p.value,
    }))
  }, [funQ.data])

  const kpi = useMemo(() => {
    const totRev = revQ.data ? revQ.data.reduce((s, p) => s + p.value, 0) : null
    const openOrders = funQ.data ? funQ.data.filter((f) => f.name !== 'Done').reduce((s, f) => s + f.count, 0) : null
    const highDebt = debtQ.data ? debtQ.data.filter((r) => r.debtRatioPercent >= 80).length : null
    return { totRev, openOrders, highDebt }
  }, [revQ.data, funQ.data, debtQ.data])

  return (
    <div className="th-seller-dashboard">
      <header className="th-seller-dashboard__header">
        <h1 className="th-seller-dashboard__title">Dashboard Kinh doanh</h1>
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

      <ul className="th-seller-dashboard__cards" aria-label="Chỉ số Sale">
        <li className="th-seller-stat-card">
          <span className="th-seller-stat-card__label">Doanh thu (kỳ chọn)</span>
          <span className="th-seller-stat-card__value">
            {kpi.totRev == null ? '—' : formatVndFull(kpi.totRev)}
          </span>
        </li>
        <li className="th-seller-stat-card">
          <span className="th-seller-stat-card__label">Đơn mở (funnel, trừ Hoàn tất)</span>
          <span className="th-seller-stat-card__value">{kpi.openOrders == null ? '—' : kpi.openOrders}</span>
        </li>
        <li className="th-seller-stat-card th-seller-stat-card--alert">
          <span className="th-seller-stat-card__label">Đại lý cận/ vượt hạn mức (≥80% nợ)</span>
          <span className="th-seller-stat-card__value">{kpi.highDebt == null ? '—' : kpi.highDebt}</span>
        </li>
      </ul>

      <div className="th-seller-dashboard__charts">
        <div className="th-seller-dashboard__row th-seller-dashboard__row--2">
          <ChartStatePanel
            title="Doanh thu cá nhân theo mốc"
            subtitle="Đơn hoàn tất theo thời gian"
            isLoading={revQ.isLoading}
            error={revQ.error}
            isEmpty={revQ.isEmpty}
            height={`${CH}px`}
          >
            <ResponsiveContainer width="100%" height={CH}>
              <AreaChart
                data={(revQ.data ?? []).map((p) => ({
                  label: formatBucketLabel(p.bucket, effectiveGranularity),
                  value: p.value,
                }))}
                margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={CHART_TICK_DEFAULT} />
                <YAxis width={64} tick={CHART_TICK_DEFAULT} tickFormatter={(v) => formatVndCompact(Number(v))} />
                <Tooltip
                  formatter={(value) => [formatVndFull(Number(value)), 'Doanh thu'] as [string, string]}
                />
                <Area type="monotone" dataKey="value" name="value" stroke="#0ea5e9" fill="#7dd3fc" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Cơ cấu trạng thái đơn (giá trị VND)"
            isLoading={statusQ.isLoading}
            error={statusQ.error}
            isEmpty={statusQ.isEmpty}
            height={`${CH}px`}
          >
            {statusQ.data ? <SellerStatusDonut data={statusQ.data} /> : null}
          </ChartStatePanel>
        </div>

        <ChartStatePanel
          title="Funnel pipeline (cả vòng đời)"
          subtitle="Draft → … → Done — theo số lượng đơn (count)"
          isLoading={funQ.isLoading}
          error={funQ.error}
          isEmpty={funQ.isEmpty}
          height={`${CH}px`}
        >
          <ResponsiveContainer width="100%" height={CH}>
            <BarChart
              data={funnelData}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" dataKey="count" tick={CHART_TICK_DEFAULT} />
              <YAxis
                type="category"
                dataKey="stage"
                width={110}
                tick={CHART_TICK_DEFAULT}
              />
                <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as { count: number; value: number; stage: string }
                  return (
                    <div
                      style={CHART_TOOLTIP_SURFACE}
                    >
                      <strong>{row.stage}</strong>
                      <p style={{ margin: '4px 0 0' }}>Số đơn: {row.count}</p>
                      <p style={{ margin: 0, color: '#64748b' }}>{formatVndFull(row.value)}</p>
                    </div>
                  )
                }}
              />
                <Bar dataKey="count" name="count" fill="#0ea5e9" maxBarSize={32}>
                {funnelData.map((e) => (
                  <Cell key={e.name} fill={orderStatusColor(e.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartStatePanel>

        <div className="th-seller-dashboard__row th-seller-dashboard__row--2">
          <ChartStatePanel
            title="Top đại lý theo doanh thu"
            isLoading={topQ.isLoading}
            error={topQ.error}
            isEmpty={topQ.isEmpty}
            height={`${CH}px`}
          >
            <ResponsiveContainer width="100%" height={CH}>
              <BarChart
                data={[...(topQ.data ?? [])]
                  .map((r) => ({ name: r.name, value: r.value, count: r.count }))
                  .sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ top: 6, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  type="number"
                  tick={CHART_TICK_DEFAULT}
                  tickFormatter={(v) => formatVndCompact(Number(v))}
                />
                <YAxis dataKey="name" type="category" width={120} tick={CHART_TICK_COMPACT} />
                <Tooltip
                  formatter={(value) => [formatVndFull(Number(value)), 'Doanh thu'] as [string, string]}
                />
                <Bar dataKey="value" name="v" fill="#8b5cf6" maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Công nợ vs hạn mức theo đại lý (snapshot)"
            isLoading={debtQ.isLoading}
            error={debtQ.error}
            isEmpty={debtQ.isEmpty}
            height={`${CH + 100}px`}
          >
            {debtQ.data ? (
              <ul className="th-seller-debt-list" aria-label="Công nợ đại lý">
                {debtQ.data.map((r) => (
                  <li
                    key={r.agencyId}
                    className={`th-seller-debt-row${r.debtRatioPercent >= 80 ? ' th-seller-debt-row--hi' : ''}`}
                  >
                    <div className="th-seller-debt-row__name">{r.agencyName}</div>
                    <div className="th-seller-debt-meters">
                      <div className="th-seller-debt-meters__row">
                        <span>Nợ</span>
                        <div
                          className="th-seller-debt-bar"
                          style={{
                            width: Math.min(100, (r.totalDebt / r.maxDebtLimit) * 100) + '%',
                            background: r.debtRatioPercent >= 80 ? '#ef4444' : '#0ea5e9',
                          }}
                        />
                        <span>{r.debtRatioPercent.toFixed(1)}% / {formatVndFull(r.totalDebt)}</span>
                      </div>
                      <p className="th-seller-debt-cap">Hạn mức: {formatVndFull(r.maxDebtLimit)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : null}
          </ChartStatePanel>
        </div>
      </div>
    </div>
  )
}

function SellerStatusDonut({ data }: { data: { name: string; value: number; count: number }[] }) {
  const total = data.reduce((s, x) => s + x.count, 0)
  const pieData = data.map((d) => ({ ...d, key: d.name }))

  return (
    <div className="th-seller-donut-wrap" style={{ position: 'relative', minHeight: CH }}>
      <ResponsiveContainer width="100%" height={CH}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="75%"
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
              const name = (p.payload as { name: string })?.name
              return (
                <div
                  style={CHART_TOOLTIP_SURFACE}
                >
                  <strong>{orderStatusLabelVi(String(name))}</strong>
                  <p style={{ margin: 4 }}>{formatVndFull(Number(p.value))}</p>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p
        className="th-seller-donut-center"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          textAlign: 'center',
          margin: 0,
          ...CHART_CENTER_LABEL,
        }}
        aria-hidden
      >
        Tổng
        <strong style={CHART_CENTER_TOTAL}>{total}</strong>
        đơn
      </p>
    </div>
  )
}
