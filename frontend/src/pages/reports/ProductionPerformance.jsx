import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, PageHeader, fmt, fmtDate } from '../../components/ui'
import { productionOrderApi, dashboardApi } from '../../services/api'

const STATUS_LABELS = {
  PLANNED: 'Kế hoạch',
  IN_PROGRESS: 'Đang SX',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const STATUS_BADGE = {
  PLANNED: 'gray',
  IN_PROGRESS: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
}

const STATUS_COLORS = {
  PLANNED: '#9ca3af',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
}

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs w-28 text-gray-500">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="text-xs font-semibold w-12 text-right">{count} ({pct}%)</span>
    </div>
  )
}

export default function ProductionPerformance() {
  const [prodOrders, setProdOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await productionOrderApi.getAll({})
        const items = Array.isArray(data) ? data : data?.data || []
        setProdOrders(items)
      } catch {
        setProdOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <DashboardLayout title="Hiệu suất sản xuất"><Loading /></DashboardLayout>

  const total = prodOrders.length
  const completed = prodOrders.filter((o) => o.status === 'COMPLETED')
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0

  const totalScrap = prodOrders.reduce((sum, o) => sum + (o.scrapQuantity || o.defectQuantity || 0), 0)
  const totalProduced = prodOrders.reduce((sum, o) => sum + (o.completedQuantity || 0), 0)
  const scrapRate = totalProduced > 0 ? Math.round((totalScrap / totalProduced) * 100) : 0

  const statusCounts = {}
  prodOrders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  })

  const sorted = [...prodOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  return (
    <DashboardLayout title="Hiệu suất sản xuất">
      <PageHeader title="Hiệu suất sản xuất" desc="Phân tích tiến độ và chất lượng sản xuất" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Tổng lệnh SX" value={fmt(total)} color="blue" />
        <StatCard label="Hoàn thành" value={fmt(completed.length)} color="green" />
        <StatCard label="Tỷ lệ hoàn thành" value={completionRate + '%'} color="purple" />
        <StatCard label="Tỷ lệ phế phẩm" value={scrapRate + '%'} color="red" />
      </div>

      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Lệnh SX theo trạng thái</h3>
        {['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => (
          <StatusBar
            key={status}
            label={STATUS_LABELS[status]}
            count={statusCounts[status] || 0}
            total={total}
            color={STATUS_COLORS[status]}
          />
        ))}
      </Card>

      <h3 className="text-sm font-semibold text-gray-900 mb-3">Chi tiết lệnh SX</h3>
      {sorted.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-gray-400 text-sm">Chưa có lệnh sản xuất</p>
        </Card>
      ) : (
        <Table headers={['Số lệnh', 'Sản phẩm', 'SL yêu cầu', 'SL hoàn thành', 'SL phế phẩm', 'Tiến độ', 'Trạng thái', 'Ngày']}>
          {sorted.map((o) => {
            const qty = o.quantity || 0
            const done = o.completedQuantity || 0
            const scrap = o.scrapQuantity || o.defectQuantity || 0
            const pct = qty > 0 ? Math.round((done / qty) * 100) : 0
            const highScrap = qty > 0 && scrap > qty * 0.1
            return (
              <tr key={o.id} className={`transition-colors ${highScrap ? 'bg-yellow-50 hover:bg-yellow-100/60' : 'hover:bg-purple-50/30'}`}>
                <Td className="font-mono text-gray-600">{o.orderNumber || o.productionOrderNumber || o.id}</Td>
                <Td className="font-medium text-gray-900">{o.product?.name || '—'}</Td>
                <Td className="text-right">{fmt(qty)}</Td>
                <Td className="text-right text-emerald-600 font-semibold">{fmt(done)}</Td>
                <Td className={`text-right font-semibold ${highScrap ? 'text-red-600' : 'text-gray-500'}`}>{fmt(scrap)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 w-20">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: Math.min(pct, 100) + '%',
                          background: pct >= 100 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-500 w-10 text-right">{pct}%</span>
                  </div>
                </Td>
                <Td><Badge variant={STATUS_BADGE[o.status] || 'gray'}>{STATUS_LABELS[o.status] || o.status}</Badge></Td>
                <Td className="text-gray-500">{fmtDate(o.createdAt)}</Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
