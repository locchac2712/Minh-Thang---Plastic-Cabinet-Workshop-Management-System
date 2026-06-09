import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { ChartStatePanel } from '../../dashboards/ChartStatePanel'
import { DashboardDateFilter } from '../../dashboards/DashboardDateFilter'
import { formatBucketLabel, formatVndCompact, formatVndFull } from '../../dashboards/chartFormat'
import {
  CHART_TICK_COMPACT,
  CHART_TICK_DEFAULT,
} from '../../dashboards/chartTypography'
import { useDashboardDateRange } from '../../dashboards/useDashboardDateRange'
import { useQueryChart } from '../../dashboards/useQueryChart'
import {
  fetchSellerMyAgencyDebtRisk,
  fetchSellerMyOpenOrdersCount,
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
  const openQ = useQueryChart('soc', () => fetchSellerMyOpenOrdersCount(), {
    enabled: true,
    isEmpty: (d) => d.count === 0,
  })
  const topQ = useQueryChart(
    `sta-${qk}`,
    () => fetchSellerMyTopAgencies(rangeL),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const debtQ = useQueryChart('sdr', () => fetchSellerMyAgencyDebtRisk(), {
    enabled: true,
    isEmpty: (d) => d.length === 0,
  })

  const kpi = useMemo(() => {
    const totRev = revQ.data ? revQ.data.reduce((s, p) => s + p.value, 0) : null
    const openOrders = openQ.data ? openQ.data.count : null
    const highDebt = debtQ.data ? debtQ.data.filter((r) => r.debtRatioPercent >= 80).length : null
    return { totRev, openOrders, highDebt }
  }, [revQ.data, openQ.data, debtQ.data])

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
        showGranularity={false}
        showPeriodActions={false}
      />

      <ul className="th-seller-dashboard__cards" aria-label="Chỉ số Sale">
        <li className="th-seller-stat-card">
          <span className="th-seller-stat-card__label">Doanh thu (kỳ chọn)</span>
          <span className="th-seller-stat-card__value">
            {kpi.totRev == null ? '—' : formatVndFull(kpi.totRev)}
          </span>
        </li>
        <li className="th-seller-stat-card">
          <span className="th-seller-stat-card__label">Đơn đang mở (chờ SX + SX)</span>
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
        </div>
      </div>
    </div>
  )
}
