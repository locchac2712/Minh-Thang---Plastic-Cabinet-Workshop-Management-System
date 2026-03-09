import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Loading, LinkBtn, fmt } from '../../components/ui'
import { dashboardApi } from '../../services/api'

const STATUS_ITEMS = [
  { key: 'pendingSalesOrders', label: 'Đơn hàng chờ xử lý', color: 'bg-amber-400' },
  { key: 'deliveredOrders', label: 'Đơn hàng đã giao', color: 'bg-emerald-400' },
  { key: 'inProgressProduction', label: 'SX đang chạy', color: 'bg-blue-400' },
  { key: 'completedProduction', label: 'SX hoàn thành', color: 'bg-green-400' },
  { key: 'lowStockItems', label: 'Tồn kho thấp', color: 'bg-red-400' },
]

const QUICK_LINKS = [
  { to: '/customers', label: 'Khách hàng', icon: '👥' },
  { to: '/quotations', label: 'Báo giá', icon: '📋' },
  { to: '/sales-orders', label: 'Đơn hàng', icon: '📦' },
  { to: '/products', label: 'Sản phẩm', icon: '🏷️' },
  { to: '/materials', label: 'Nguyên vật liệu', icon: '🧱' },
  { to: '/production-orders', label: 'Lệnh SX', icon: '🏭' },
  { to: '/work-orders', label: 'Work Order', icon: '⚙️' },
  { to: '/inventory', label: 'Tồn kho', icon: '📊' },
  { to: '/stock/in', label: 'Nhập kho', icon: '📥' },
  { to: '/stock/out', label: 'Xuất kho', icon: '📤' },
  { to: '/suppliers', label: 'Nhà cung cấp', icon: '🚚' },
  { to: '/approvals', label: 'Phê duyệt', icon: '✅' },
]

export default function OperationalDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getStats().then(({ data }) => {
      setStats(data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Dashboard Vận hành"><Loading /></DashboardLayout>

  return (
    <DashboardLayout title="Dashboard Vận hành">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        <StatCard label="Sản phẩm" value={fmt(stats?.totalProducts)} color="blue" />
        <StatCard label="Nhà cung cấp" value={fmt(stats?.totalSuppliers)} color="purple" />
        <StatCard label="Nguyên vật liệu" value={fmt(stats?.totalMaterials)} color="green" />
        <StatCard label="Đơn hàng" value={fmt(stats?.totalSalesOrders)} color="orange" />
        <StatCard label="Lệnh SX" value={fmt(stats?.totalProductionOrders)} color="cyan" />
        <StatCard label="Work Order" value={fmt(stats?.totalWorkOrders)} color="red" />
      </div>

      <Card className="p-6 mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-5">Tổng quan trạng thái</h3>
        <div className="space-y-4">
          {STATUS_ITEMS.map((item) => (
            <div key={item.key} className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
              <span className="text-sm text-gray-600 flex-1">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">{fmt(stats?.[item.key])}</span>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Truy cập nhanh</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <LinkBtn key={link.to} to={link.to} variant="secondary" className="justify-center py-4 rounded-2xl">
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </LinkBtn>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
