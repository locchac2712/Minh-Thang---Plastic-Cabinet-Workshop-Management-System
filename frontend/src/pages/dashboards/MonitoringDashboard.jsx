import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, fmtCurrency, fmtDate, fmt } from '../../components/ui'
import { dashboardApi } from '../../services/api'

const STATUS_LABELS = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  IN_PRODUCTION: 'Đang sản xuất',
  READY_FOR_DELIVERY: 'Sẵn sàng giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
}

const ORDER_STATUS_COLORS = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  IN_PRODUCTION: '#8b5cf6',
  READY_FOR_DELIVERY: '#06b6d4',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
}

const PROD_STATUS_LABELS = {
  PLANNED: 'Kế hoạch',
  IN_PROGRESS: 'Đang SX',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
}

const PROD_STATUS_COLORS = {
  PLANNED: '#9ca3af',
  IN_PROGRESS: '#3b82f6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
}

const STATUS_BADGE = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  IN_PRODUCTION: 'purple',
  READY_FOR_DELIVERY: 'cyan',
  DELIVERED: 'green',
  CANCELLED: 'red',
}

function StatusBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3 mb-3">
      <span className="text-xs w-32 text-gray-500">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3">
        <div className="h-3 rounded-full transition-all duration-500" style={{ width: pct + '%', background: color }} />
      </div>
      <span className="text-xs font-semibold w-8">{count}</span>
    </div>
  )
}

export default function MonitoringDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getMonitoring().then(({ data }) => {
      setStats(data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Giám sát KPI"><Loading /></DashboardLayout>

  const orderTotal = stats?.ordersByStatus ? Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0) : 0
  const prodTotal = stats?.productionByStatus ? Object.values(stats.productionByStatus).reduce((a, b) => a + b, 0) : 0

  return (
    <DashboardLayout title="Giám sát KPI">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <StatCard label="Doanh thu" value={fmtCurrency(stats?.totalRevenue)} color="green" />
        <StatCard label="Tổng đơn hàng" value={fmt(stats?.totalSalesOrders)} color="blue" />
        <StatCard label="SX đang chạy" value={fmt(stats?.inProgressProduction)} color="purple" />
        <StatCard label="Tồn kho thấp" value={fmt(stats?.lowStockItems)} color="red" />
        <StatCard label="Phê duyệt chờ" value={fmt(stats?.pendingApprovals)} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Phân bố đơn hàng</h3>
          {stats?.ordersByStatus && Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <StatusBar
              key={status}
              label={STATUS_LABELS[status] || status}
              count={count}
              total={orderTotal}
              color={ORDER_STATUS_COLORS[status] || '#9ca3af'}
            />
          ))}
          {!stats?.ordersByStatus && <p className="text-sm text-gray-400">Không có dữ liệu</p>}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Phân bố sản xuất</h3>
          {stats?.productionByStatus && Object.entries(stats.productionByStatus).map(([status, count]) => (
            <StatusBar
              key={status}
              label={PROD_STATUS_LABELS[status] || status}
              count={count}
              total={prodTotal}
              color={PROD_STATUS_COLORS[status] || '#9ca3af'}
            />
          ))}
          {!stats?.productionByStatus && <p className="text-sm text-gray-400">Không có dữ liệu</p>}
        </Card>
      </div>

      {stats?.lowStockMaterials?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Cảnh báo tồn kho</h3>
          <Table headers={['Tên', 'SKU', 'SL hiện tại', 'SL tối thiểu', 'Trạng thái']}>
            {stats.lowStockMaterials.map((m, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <Td className="font-medium text-gray-900">{m.name}</Td>
                <Td className="text-gray-500">{m.sku}</Td>
                <Td className="text-red-600 font-semibold">{fmt(m.currentStock)}</Td>
                <Td>{fmt(m.minimumStock)}</Td>
                <Td><Badge variant="red">Thiếu hàng</Badge></Td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Đơn hàng gần đây</h3>
        <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo']}>
          {(stats?.recentOrders || []).slice(0, 10).map((o) => (
            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
              <Td>
                <Link to={`/sales-orders/${o.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                  {o.orderNumber}
                </Link>
              </Td>
              <Td>{o.customer?.name || '—'}</Td>
              <Td className="font-semibold">{fmtCurrency(o.totalAmount)}</Td>
              <Td><Badge variant={STATUS_BADGE[o.status] || 'gray'}>{STATUS_LABELS[o.status] || o.status}</Badge></Td>
              <Td className="text-gray-500">{fmtDate(o.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardLayout>
  )
}
