import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { ChartStatePanel } from '../../dashboards/ChartStatePanel'
import { DashboardDateFilter } from '../../dashboards/DashboardDateFilter'
import { formatBucketLabel, formatVndCompact, formatVndFull } from '../../dashboards/chartFormat'
import { useDashboardDateRange } from '../../dashboards/useDashboardDateRange'
import { useQueryChart } from '../../dashboards/useQueryChart'
import { orderStatusLabelVi, taskStatusColor } from '../../dashboards/orderStatusLabels'
import {
  fetchProductionLateTaskTrend,
  fetchProductionMaterialConsumptionTrend,
  fetchProductionTaskCompletionTrend,
  fetchProductionTaskStatusBreakdown,
  fetchProductionTopWorkersThroughput,
} from '../productionDashboardChartsApi'
import type { MaterialConsumptionResponse } from '../../dashboards/chartTypes'
import './ProductionDashboardPage.css'

const CH = 280
const MAT_PALETTE = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#94a3b8']

function materialToStackData(res: MaterialConsumptionResponse | null, g: 'day' | 'week' | 'month') {
  if (!res) return { rows: [] as Record<string, number | string>[], keys: [] as string[], nameMap: {} as Record<string, string> }
  const keys = res.topMaterials.map((m) => m.materialCode)
  if (res.series.some((s) => s.values.others != null)) keys.push('others')
  const nameMap: Record<string, string> = { others: 'Khác' }
  for (const m of res.topMaterials) nameMap[m.materialCode] = m.materialName
  const rows = res.series.map((s) => {
    const label = formatBucketLabel(s.bucket, g)
    const row: Record<string, number | string> = { label }
    for (const k of keys) {
      row[k] = s.values[k] ?? 0
    }
    return row
  })
  return { rows, keys, nameMap }
}

export function ProductionDashboardPage() {
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
  const rangeB = { fromDate, toDate, granularity: effectiveGranularity, limit: 10 }
  const rangeT = { fromDate, toDate, granularity: effectiveGranularity, top: 5 }
  const rangeS = { fromDate, toDate, granularity: effectiveGranularity }
  const qk = `${fromDate}|${toDate}|${effectiveGranularity}`

  const compQ = useQueryChart(
    `pct-${qk}`,
    () => fetchProductionTaskCompletionTrend(rangeS),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const stQ = useQueryChart('pts', () => fetchProductionTaskStatusBreakdown(), {
    enabled: true,
    isEmpty: (d) => d.length === 0,
  })
  const workQ = useQueryChart(
    `ptw-${qk}`,
    () => fetchProductionTopWorkersThroughput(rangeB),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )
  const matQ = useQueryChart(
    `mct-${qk}`,
    () => fetchProductionMaterialConsumptionTrend(rangeT),
    { enabled: en, isEmpty: (d) => d.series.length === 0 },
  )
  const lateQ = useQueryChart(
    `ltt-${qk}`,
    () => fetchProductionLateTaskTrend(rangeS),
    { enabled: en, isEmpty: (d) => d.length === 0 },
  )

  const mat = useMemo(
    () => materialToStackData(matQ.data ?? null, effectiveGranularity),
    [matQ.data, effectiveGranularity],
  )

  return (
    <div className="th-prod-dashboard">
      <header className="th-prod-dashboard__header">
        <h1 className="th-prod-dashboard__title">Tổng quan xưởng</h1>
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

      <div className="th-prod-dashboard__charts">
        <div className="th-prod-dashboard__row th-prod-dashboard__row--2">
          <ChartStatePanel
            title="Sản lượng hoàn thành theo mốc"
            subtitle="value = tổng sản phẩm; count = số task"
            isLoading={compQ.isLoading}
            error={compQ.error}
            isEmpty={compQ.isEmpty}
            height={`${CH}px`}
          >
            <ResponsiveContainer width="100%" height={CH}>
              <AreaChart
                data={(compQ.data ?? []).map((p) => ({
                  label: formatBucketLabel(p.bucket, effectiveGranularity),
                  value: p.value,
                }))}
                margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as { value: number; count: number } | undefined
                    if (!p) return null
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, fontSize: 12 }}>
                        <p style={{ margin: 0, color: '#64748b' }}>{String(label)}</p>
                        <p style={{ margin: 4, fontWeight: 700 }}>Sản lượng: {p.value}</p>
                        <p style={{ margin: 0, color: '#64748b' }}>Số task: {p.count}</p>
                      </div>
                    )
                  }}
                />
                <Area dataKey="value" type="monotone" stroke="#0d9488" fill="#5eead4" fillOpacity={0.3} name="Sản lượng" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Cơ cấu trạng thái lệnh (toàn bộ tồn tại)"
            isLoading={stQ.isLoading}
            error={stQ.error}
            isEmpty={stQ.isEmpty}
            height={`${CH}px`}
          >
            {stQ.data ? <ProdStatusDonut data={stQ.data} /> : null}
          </ChartStatePanel>
        </div>

        <div className="th-prod-dashboard__row th-prod-dashboard__row--2">
          <ChartStatePanel
            title="Top công suất công nhân theo sản lượng"
            isLoading={workQ.isLoading}
            error={workQ.error}
            isEmpty={workQ.isEmpty}
            height={`${CH}px`}
          >
            <ResponsiveContainer width="100%" height={CH}>
              <BarChart
                data={[...(workQ.data ?? [])]
                  .map((r) => ({ name: r.name, value: r.value, count: r.count }))
                  .sort((a, b) => b.value - a.value)}
                layout="vertical"
                margin={{ top: 6, right: 6, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const p = payload[0].payload as { name: string; value: number; count: number }
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, fontSize: 12 }}>
                        <strong>{p.name}</strong>
                        <p style={{ margin: 4 }}>Số SP: {p.value}</p>
                        <p style={{ margin: 0, color: '#64748b' }}>Số lệnh: {p.count}</p>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="value" name="v" fill="#0d9488" maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </ChartStatePanel>

          <ChartStatePanel
            title="Task trễ hạn"
            isLoading={lateQ.isLoading}
            error={lateQ.error}
            isEmpty={lateQ.isEmpty}
            height={`${CH}px`}
          >
            <ResponsiveContainer width="100%" height={CH}>
              <LineChart
                data={(lateQ.data ?? []).map((p) => ({
                  label: formatBucketLabel(p.bucket, effectiveGranularity),
                  value: p.value,
                }))}
                margin={{ top: 6, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} width={32} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    const p = parseFloat(String(payload[0].value))
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, fontSize: 12 }}>
                        <p style={{ margin: 0, color: '#64748b' }}>{String(label)}</p>
                        <p style={{ margin: 0 }}>Tồn: {p} sản phẩm</p>
                      </div>
                    )
                  }}
                />
                <Line dataKey="value" type="monotone" name="Tồn trễ" stroke="#ef4444" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartStatePanel>
        </div>

        <ChartStatePanel
          title="Giá trị tiêu hao vật tư theo mốc (cộng dồn cột)"
          subtitle="Các cột cùng mã NVL; «Khác» hợp ngoài top N"
          isLoading={matQ.isLoading}
          error={matQ.error}
            isEmpty={matQ.isEmpty}
          height={`${CH + 32}px`}
        >
          {mat.keys.length > 0 ? (
            <ResponsiveContainer width="100%" height={CH + 32}>
              <BarChart data={mat.rows} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} width={68} tickFormatter={(v) => formatVndCompact(Number(v))} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, fontSize: 12 }}>
                        <p style={{ margin: 0, color: '#64748b' }}>{String(label)}</p>
                        {payload
                          .filter((p) => p.value && Number(p.value) > 0)
                          .map((p) => (
                            <p key={p.name} style={{ margin: '2px 0' }}>
                              {p.name}: {formatVndFull(Number(p.value))}
                            </p>
                          ))}
                      </div>
                    )
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 10 }}
                  formatter={(v) => (typeof v === 'string' ? (mat.nameMap[v] ?? v) : v)}
                />
                {mat.keys.map((k, i) => (
                  <Bar
                    key={k}
                    stackId="a"
                    dataKey={k}
                    name={k}
                    fill={MAT_PALETTE[i % MAT_PALETTE.length]}
                    maxBarSize={32}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </ChartStatePanel>
      </div>
    </div>
  )
}

function ProdStatusDonut({ data }: { data: { name: string; value: number; count: number }[] }) {
  const tot = data.reduce((s, x) => s + x.count, 0)
  const pie = data.map((d) => ({ ...d, k: d.name }))

  return (
    <div className="th-prod-donut-wrap" style={{ position: 'relative', minHeight: CH }}>
      <ResponsiveContainer width="100%" height={CH}>
        <PieChart>
          <Pie
            data={pie}
            dataKey="value"
            nameKey="k"
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="75%"
            paddingAngle={1}
            label={false}
          >
            {pie.map((d, i) => (
              <Cell key={d.name + i} fill={taskStatusColor(d.name)} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as { name: string; value: number; count: number }
              return (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8, fontSize: 12 }}>
                  <strong>{orderStatusLabelVi(p.name)}</strong>
                  <p style={{ margin: 4 }}>Sản lượng (value): {p.value}</p>
                  <p style={{ margin: 0 }}>Task: {p.count}</p>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <p
        className="th-prod-donut-center"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          margin: 0,
          textAlign: 'center',
          fontSize: 12,
          color: '#64748b',
        }}
        aria-hidden
      >
        Tổng
        <strong style={{ display: 'block', fontSize: 18, color: '#0f172a' }}>{tot}</strong>
        task
      </p>
    </div>
  )
}

