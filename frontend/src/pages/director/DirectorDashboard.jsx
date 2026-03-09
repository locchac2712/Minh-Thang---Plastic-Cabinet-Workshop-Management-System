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
      <span className="text-xs font-semibold w-12 text-right">{count} ({pct}%)</span>
    </div>
  )
}

const QUICK_LINKS = [
  { to: '/monitoring', label: 'Giám sát KPI', icon: '📊' },
  { to: '/reports/financial', label: 'Tài chính', icon: '💵' },
  { to: '/reports/revenue', label: 'Doanh thu', icon: '💰' },
  { to: '/approvals', label: 'Phê duyệt', icon: '✅' },
]

export default function DirectorDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await dashboardApi.getMonitoring()
        setStats(data.data || data)
      } catch {
        setError('Không thể tải dữ liệu thống kê')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <DashboardLayout title="Dashboard Giám đốc"><Loading /></DashboardLayout>

  if (error) {
    return (
      <DashboardLayout title="Dashboard Giám đốc">
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm mb-4">{error}</div>
      </DashboardLayout>
    )
  }

  const orderTotal = stats?.ordersByStatus ? Object.values(stats.ordersByStatus).reduce((a, b) => a + b, 0) : 0
  const prodTotal = stats?.productionByStatus ? Object.values(stats.productionByStatus).reduce((a, b) => a + b, 0) : 0

  return (
    <DashboardLayout title="Dashboard Giám đốc">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        <StatCard label="Doanh thu" value={fmtCurrency(stats?.totalRevenue)} color="green" />
        <StatCard label="Đơn hàng" value={fmt(stats?.totalSalesOrders)} color="blue" />
        <StatCard label="Sản xuất" value={fmt(stats?.totalProductionOrders || stats?.inProgressProduction)} color="purple" />
        <StatCard label="Tồn kho thấp" value={fmt(stats?.lowStockItems)} color="red" />
        <StatCard label="Phê duyệt" value={fmt(stats?.pendingApprovals)} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Đơn hàng theo trạng thái</h3>
          {stats?.ordersByStatus ? Object.entries(stats.ordersByStatus).map(([status, count]) => (
            <StatusBar
              key={status}
              label={STATUS_LABELS[status] || status}
              count={count}
              total={orderTotal}
              color={ORDER_STATUS_COLORS[status] || '#9ca3af'}
            />
          )) : <p className="text-sm text-gray-400">Không có dữ liệu</p>}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sản xuất theo trạng thái</h3>
          {stats?.productionByStatus ? Object.entries(stats.productionByStatus).map(([status, count]) => (
            <StatusBar
              key={status}
              label={PROD_STATUS_LABELS[status] || status}
              count={count}
              total={prodTotal}
              color={PROD_STATUS_COLORS[status] || '#9ca3af'}
            />
          )) : <p className="text-sm text-gray-400">Không có dữ liệu</p>}
        </Card>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Đơn hàng gần đây</h3>
        {(stats?.recentOrders?.length > 0) ? (
          <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo']}>
            {stats.recentOrders.slice(0, 10).map((o) => (
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
        ) : (
          <Card className="p-10 text-center">
            <p className="text-gray-400 text-sm">Chưa có đơn hàng</p>
          </Card>
        )}
      </div>

      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Truy cập nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-purple-50 hover:shadow-md transition-all group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">{link.label}</span>
            </Link>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  )
}
