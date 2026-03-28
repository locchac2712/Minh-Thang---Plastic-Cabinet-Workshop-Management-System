import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, LinkBtn, fmtCurrency, fmtDate, fmt } from '../../components/ui'
import dashboardService from '../../services/dashboardService'

/* ───────────────────── MOCK DATA GENERATOR ───────────────────── */

function generateProgressData(mode) {
  const now = new Date()
  const labels = []
  const inProgress = []
  const completed = []
  const overdue = []

  if (mode === 'day') {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      labels.push(d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }))
      inProgress.push(Math.floor(Math.random() * 8) + 3)
      completed.push(Math.floor(Math.random() * 6) + 1)
      overdue.push(Math.floor(Math.random() * 3))
    }
  } else if (mode === 'week') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i * 7)
      labels.push('T' + (12 - i))
      inProgress.push(Math.floor(Math.random() * 20) + 10)
      completed.push(Math.floor(Math.random() * 15) + 5)
      overdue.push(Math.floor(Math.random() * 6))
    }
  } else {
    const monthNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12']
    for (let i = 0; i < 12; i++) {
      labels.push(monthNames[i])
      inProgress.push(Math.floor(Math.random() * 40) + 15)
      completed.push(Math.floor(Math.random() * 35) + 10)
      overdue.push(Math.floor(Math.random() * 10) + 1)
    }
  }
  return { labels, series: { inProgress, completed, overdue } }
}

// Chart 2 data: 4 priority levels × 4 status zones (stacked)
function generateDelayData(mode) {
  const priorities = ['Khẩn cấp', 'Cao', 'Trung bình', 'Thấp']
  if (mode === 'day') {
    return {
      labels: priorities,
      planned: [1, 3, 5, 7],
      inProgress: [3, 4, 6, 3],
      completed: [2, 2, 4, 5],
      overdue: [4, 2, 1, 0],
    }
  } else if (mode === 'week') {
    return {
      labels: priorities,
      planned: [5, 12, 20, 25],
      inProgress: [10, 18, 30, 15],
      completed: [8, 15, 22, 20],
      overdue: [12, 8, 5, 3],
    }
  } else {
    return {
      labels: priorities,
      planned: [15, 40, 65, 80],
      inProgress: [30, 55, 90, 50],
      completed: [25, 50, 70, 65],
      overdue: [35, 20, 12, 8],
    }
  }
}


/* ───────────────────── LINE CHART (SVG) ───────────────────── */

const LINE_COLORS = {
  inProgress: { stroke: '#8b5cf6', fill: 'rgba(139,92,246,0.10)' },
  completed: { stroke: '#10b981', fill: 'rgba(16,185,129,0.10)' },
  overdue: { stroke: '#ef4444', fill: 'rgba(239,68,68,0.10)' },
}

const LINE_LABELS = {
  inProgress: 'Đang thực hiện',
  completed: 'Hoàn thành',
  overdue: 'Trễ hạn',
}

function LineChart({ data }) {
  const padding = { top: 30, right: 20, bottom: 50, left: 50 }
  const width = 700
  const height = 340
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const allValues = [...data.series.inProgress, ...data.series.completed, ...data.series.overdue]
  const maxVal = Math.max(...allValues, 1)
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5

  const n = data.labels.length
  const xStep = chartW / Math.max(n - 1, 1)

  const getX = (i) => padding.left + i * xStep
  const getY = (v) => padding.top + chartH - (v / niceMax) * chartH

  const makePath = (values) => {
    return values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' ')
  }

  const makeArea = (values) => {
    const line = values.map((v, i) => `${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`).join(' L ')
    return `M ${getX(0).toFixed(1)} ${getY(0).toFixed(1)} L ${line} L ${getX(values.length - 1).toFixed(1)} ${(padding.top + chartH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padding.top + chartH).toFixed(1)} Z`
  }

  const gridLines = 5
  const [tooltip, setTooltip] = useState(null)

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padding.top + (chartH / gridLines) * i
          const val = Math.round(niceMax - (niceMax / gridLines) * i)
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="11">{val}</text>
            </g>
          )
        })}

        {/* Area fills */}
        {Object.keys(LINE_COLORS).map((key) => (
          <path key={key} d={makeArea(data.series[key])} fill={LINE_COLORS[key].fill} />
        ))}

        {/* Lines */}
        {Object.keys(LINE_COLORS).map((key) => (
          <path key={key} d={makePath(data.series[key])} fill="none" stroke={LINE_COLORS[key].stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {/* Dots */}
        {Object.keys(LINE_COLORS).map((key) =>
          data.series[key].map((v, i) => (
            <circle
              key={`${key}-${i}`}
              cx={getX(i)}
              cy={getY(v)}
              r="4"
              fill="#fff"
              stroke={LINE_COLORS[key].stroke}
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setTooltip({ x: getX(i), y: getY(v) - 12, label: `${LINE_LABELS[key]}: ${v}` })}
              onMouseLeave={() => setTooltip(null)}
            />
          ))
        )}

        {/* X Axis labels */}
        {data.labels.map((label, i) => (
          <text key={i} x={getX(i)} y={height - 8} textAnchor="middle" fill="#6b7280" fontSize="10" transform={n > 10 ? `rotate(-35, ${getX(i)}, ${height - 8})` : ''}>
            {label}
          </text>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 60} y={tooltip.y - 22} width="120" height="24" rx="6" fill="#1f2937" opacity="0.9" />
            <text x={tooltip.x} y={tooltip.y - 6} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">{tooltip.label}</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '4px' }}>
        {Object.entries(LINE_LABELS).map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: LINE_COLORS[key].stroke, display: 'inline-block' }} />
            <span style={{ fontSize: '12px', color: '#6b7280' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


/* ───────────────────── STACKED BAR CHART (SVG) ───────────────────── */

const STACK_COLORS = {
  planned: '#9ca3af',
  inProgress: '#8b5cf6',
  completed: '#10b981',
  overdue: '#ef4444',
}

const STACK_LABELS = {
  planned: 'Lên kế hoạch',
  inProgress: 'Đang thực hiện',
  completed: 'Đã sản xuất',
  overdue: 'Trễ hạn',
}

const STACK_KEYS = ['planned', 'inProgress', 'completed', 'overdue']

function StackedBarChart({ data, large }) {
  const padding = { top: 30, right: 20, bottom: 55, left: 50 }
  const width = large ? 900 : 700
  const height = large ? 440 : 340
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  // Calculate max stacked value
  const n = data.labels.length
  const stackTotals = data.labels.map((_, gi) =>
    STACK_KEYS.reduce((sum, key) => sum + (data[key]?.[gi] || 0), 0)
  )
  const maxVal = Math.max(...stackTotals, 1)
  const niceMax = Math.ceil(maxVal / 5) * 5 || 5

  const groupW = chartW / n
  const barW = Math.min(groupW * 0.55, large ? 90 : 70)

  const getY = (v) => padding.top + chartH - (v / niceMax) * chartH
  const getBarH = (v) => (v / niceMax) * chartH

  const gridLines = 5
  const [tooltip, setTooltip] = useState(null)

  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const y = padding.top + (chartH / gridLines) * i
          const val = Math.round(niceMax - (niceMax / gridLines) * i)
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize={large ? "12" : "11"}>{val}</text>
            </g>
          )
        })}

        {/* Stacked Bars */}
        {data.labels.map((label, gi) => {
          const groupX = padding.left + gi * groupW + groupW / 2
          const barX = groupX - barW / 2
          let cumY = padding.top + chartH  // bottom of chart

          return (
            <g key={gi}>
              {STACK_KEYS.map((key) => {
                const val = data[key]?.[gi] || 0
                if (val === 0) return null
                const h = getBarH(val)
                cumY -= h
                const y = cumY
                const isFirst = key === 'planned'
                const isLast = key === 'overdue'
                return (
                  <g key={key}>
                    <rect
                      x={barX}
                      y={y}
                      width={barW}
                      height={Math.max(h, 0)}
                      rx={isFirst || isLast ? 4 : 0}
                      fill={STACK_COLORS[key]}
                      opacity="0.88"
                      style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                      onMouseEnter={(e) => {
                        e.target.style.opacity = 1
                        setTooltip({
                          x: groupX,
                          y: y - 8,
                          label: `${label} — ${STACK_LABELS[key]}: ${val}`
                        })
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.opacity = 0.88
                        setTooltip(null)
                      }}
                    />
                    {/* Value label inside segment if tall enough */}
                    {h > (large ? 18 : 16) && (
                      <text
                        x={groupX}
                        y={y + h / 2 + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={large ? "12" : "10"}
                        fontWeight="600"
                      >
                        {val}
                      </text>
                    )}
                  </g>
                )
              })}
              {/* Total on top */}
              <text
                x={groupX}
                y={padding.top + chartH - getBarH(stackTotals[gi]) - 6}
                textAnchor="middle"
                fill="#374151"
                fontSize={large ? "13" : "11"}
                fontWeight="700"
              >
                {stackTotals[gi]}
              </text>
              {/* X label */}
              <text x={groupX} y={height - (large ? 8 : 6)} textAnchor="middle" fill="#6b7280" fontSize={large ? "13" : "11"} fontWeight="500">
                {label}
              </text>
            </g>
          )
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect x={tooltip.x - 80} y={tooltip.y - 24} width="160" height="26" rx="6" fill="#1f2937" opacity="0.92" />
            <text x={tooltip.x} y={tooltip.y - 7} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">{tooltip.label}</text>
          </g>
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: large ? '24px' : '16px', marginTop: '6px', flexWrap: 'wrap' }}>
        {STACK_KEYS.map((key) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 14, height: 14, borderRadius: '3px', background: STACK_COLORS[key], display: 'inline-block' }} />
            <span style={{ fontSize: large ? '13px' : '12px', color: '#4b5563' }}>{STACK_LABELS[key]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}


/* ───────────────────── POPUP MODAL ───────────────────── */

function ChartPopup({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '16px',
          width: '90vw',
          maxWidth: '960px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          animation: 'scaleIn 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px 0 24px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: '#f3f4f6',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#6b7280',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.target.style.background = '#e5e7eb'; e.target.style.color = '#111827' }}
            onMouseLeave={(e) => { e.target.style.background = '#f3f4f6'; e.target.style.color = '#6b7280' }}
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: '20px 24px 28px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95) } to { opacity: 1; transform: scale(1) } }
      `}</style>
    </div>
  )
}


/* ───────────────────── TAB COMPONENT ───────────────────── */

function TabGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'inline-flex', background: '#f3f4f6', borderRadius: '8px', padding: '3px' }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '5px 14px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: value === opt.value ? '600' : '400',
            background: value === opt.value ? '#fff' : 'transparent',
            color: value === opt.value ? '#7c3aed' : '#6b7280',
            boxShadow: value === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}


/* ───────────────────── EXPAND BUTTON ───────────────────── */

function ExpandButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Xem phóng to"
      style={{
        width: 32,
        height: 32,
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        background: '#fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        color: '#6b7280',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f3f4f6'; e.currentTarget.style.color = '#7c3aed'; e.currentTarget.style.borderColor = '#7c3aed' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb' }}
    >
      ⛶
    </button>
  )
}


/* ───────────────────── MAIN DASHBOARD ───────────────────── */

export default function ProductionDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progressMode, setProgressMode] = useState('day')
  const [delayMode, setDelayMode] = useState('day')
  const [popupChart, setPopupChart] = useState(null) // 'line' | 'bar' | null

  useEffect(() => {
    dashboardService.getProduction().then((data) => {
      setStats(data)
    }).catch(() => { }).finally(() => setLoading(false))
  }, [])

  const progressData = useMemo(() => generateProgressData(progressMode), [progressMode])
  const delayData = useMemo(() => generateDelayData(delayMode), [delayMode])

  if (loading) return <DashboardLayout title="Dashboard Sản xuất"><Loading /></DashboardLayout>

  return (
    <DashboardLayout title="Dashboard Sản xuất">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <LinkBtn to="/production-orders/new" variant="primary">+ Tạo lệnh SX</LinkBtn>
        <LinkBtn to="/work-orders/new" variant="secondary">+ Tạo Work Order</LinkBtn>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Tổng lệnh SX" value={fmt(stats?.totalOrders)} color="blue" />
        <StatCard label="Đang SX" value={fmt(stats?.inProgress)} color="purple" />
        <StatCard label="Hoàn thành" value={fmt(stats?.completed)} color="green" />
        <StatCard label="Tỷ lệ hoàn thành" value={stats?.completionRate != null ? stats.completionRate + '%' : '—'} color="orange" />
      </div>

      {/* ──── CHART ROW ──── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">

        {/* Chart 1: Production Progress Trend (Line) */}
        <Card className="p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="text-sm font-semibold text-gray-900" style={{ margin: 0 }}>
              Xu hướng tiến độ sản xuất
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TabGroup
                options={[
                  { value: 'day', label: 'Ngày' },
                  { value: 'week', label: 'Tuần' },
                  { value: 'month', label: 'Tháng' },
                ]}
                value={progressMode}
                onChange={setProgressMode}
              />
              <ExpandButton onClick={() => setPopupChart('line')} />
            </div>
          </div>
          <LineChart data={progressData} />
        </Card>

        {/* Chart 2: Delay Analysis — Stacked Bar */}
        <Card className="p-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 className="text-sm font-semibold text-gray-900" style={{ margin: 0 }}>
              Phân tích đơn hàng theo mức ưu tiên
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TabGroup
                options={[
                  { value: 'day', label: 'Ngày' },
                  { value: 'week', label: 'Tuần' },
                  { value: 'month', label: 'Tháng' },
                ]}
                value={delayMode}
                onChange={setDelayMode}
              />
              <ExpandButton onClick={() => setPopupChart('bar')} />
            </div>
          </div>
          <StackedBarChart data={delayData} />
        </Card>
      </div>

      {/* ──── POPUP MODALS ──── */}
      {popupChart === 'line' && (
        <ChartPopup title=" Xu hướng tiến độ sản xuất" onClose={() => setPopupChart(null)}>
          <div style={{ marginBottom: '16px' }}>
            <TabGroup
              options={[
                { value: 'day', label: 'Ngày' },
                { value: 'week', label: 'Tuần' },
                { value: 'month', label: 'Tháng' },
              ]}
              value={progressMode}
              onChange={setProgressMode}
            />
          </div>
          <LineChart data={progressData} />
        </ChartPopup>
      )}

      {popupChart === 'bar' && (
        <ChartPopup title="Phân tích đơn hàng theo mức ưu tiên" onClose={() => setPopupChart(null)}>
          <div style={{ marginBottom: '16px' }}>
            <TabGroup
              options={[
                { value: 'day', label: 'Ngày' },
                { value: 'week', label: 'Tuần' },
                { value: 'month', label: 'Tháng' },
              ]}
              value={delayMode}
              onChange={setDelayMode}
            />
          </div>
          <StackedBarChart data={delayData} large />
        </ChartPopup>
      )}

      {/* Existing sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tỷ lệ phế phẩm</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-red-600">
                {stats?.scrapRate != null ? stats.scrapRate + '%' : '—'}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tỷ lệ sản phẩm bị lỗi / phế phẩm</p>
              <p className="text-xs text-gray-400 mt-1">Mục tiêu: dưới 5%</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Work Order chờ xử lý</h3>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center">
              <span className="text-2xl font-bold text-amber-600">
                {fmt(stats?.pendingWorkOrders)}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số work order đang chờ thực hiện</p>
              <Link to="/work-orders" className="text-xs text-purple-600 hover:text-purple-800 mt-1 inline-block">
                Xem tất cả →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {stats?.inProgressOrders?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Lệnh SX đang chạy</h3>
          <Table headers={['Số lệnh', 'Sản phẩm', 'SL yêu cầu', 'SL hoàn thành', 'Tiến độ', 'Ngày bắt đầu']}>
            {stats.inProgressOrders.map((o) => {
              const pct = o.requiredQuantity > 0
                ? Math.round((o.completedQuantity / o.requiredQuantity) * 100)
                : 0
              return (
                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                  <Td>
                    <Link to={`/production-orders/${o.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                      {o.orderNumber}
                    </Link>
                  </Td>
                  <Td className="font-medium text-gray-900">{o.product?.name || '—'}</Td>
                  <Td>{fmt(o.requiredQuantity)}</Td>
                  <Td className="font-semibold text-emerald-600">{fmt(o.completedQuantity)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 w-24">
                        <div
                          className="h-2 rounded-full bg-purple-500 transition-all duration-500"
                          style={{ width: Math.min(pct, 100) + '%' }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 w-10">{pct}%</span>
                    </div>
                  </Td>
                  <Td className="text-gray-500">{fmtDate(o.startDate)}</Td>
                </tr>
              )
            })}
          </Table>
        </div>
      )}
    </DashboardLayout>
  )
}
