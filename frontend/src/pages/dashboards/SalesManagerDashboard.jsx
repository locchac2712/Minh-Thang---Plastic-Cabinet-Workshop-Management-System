import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, fmtCurrency, fmtDate, fmt } from '../../components/ui'
import { dashboardApi } from '../../services/api'

const ORDER_STATUS = {
  PENDING: { label: 'Chờ xử lý', variant: 'yellow' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'blue' },
  IN_PRODUCTION: { label: 'Đang sản xuất', variant: 'purple' },
  READY_FOR_DELIVERY: { label: 'Sẵn sàng giao', variant: 'cyan' },
  DELIVERED: { label: 'Đã giao', variant: 'green' },
  CANCELLED: { label: 'Đã hủy', variant: 'red' },
}

export default function SalesManagerDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getSalesManager().then(({ data }) => {
      setStats(data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Dashboard Quản lý bán hàng"><Loading /></DashboardLayout>

  const maxRevenue = stats?.staffPerformance?.length
    ? Math.max(...stats.staffPerformance.map(s => s.revenue || 0))
    : 0

  return (
    <DashboardLayout title="Dashboard Quản lý bán hàng">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Tổng đơn hàng" value={fmt(stats?.totalOrders)} color="blue" />
        <StatCard label="Doanh thu" value={fmtCurrency(stats?.totalRevenue)} color="green" />
        <StatCard label="Khách hàng" value={fmt(stats?.totalCustomers)} color="purple" />
        <StatCard label="Chưa thanh toán" value={fmt(stats?.unpaidOrders)} color="red" />
      </div>

      {stats?.staffPerformance?.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Hiệu suất nhân viên</h3>
          <Table headers={['Họ tên', 'Email', 'Số đơn hàng', 'Doanh thu']}>
            {stats.staffPerformance.map((s, i) => {
              const isTop = s.revenue === maxRevenue && maxRevenue > 0
              return (
                <tr key={i} className={`hover:bg-gray-50/50 transition-colors ${isTop ? 'bg-emerald-50/50' : ''}`}>
                  <Td className="font-medium text-gray-900">
                    {s.fullName}
                    {isTop && <Badge variant="green">Top</Badge>}
                  </Td>
                  <Td className="text-gray-500">{s.email}</Td>
                  <Td>{fmt(s.orderCount)}</Td>
                  <Td className="font-semibold">{fmtCurrency(s.revenue)}</Td>
                </tr>
              )
            })}
          </Table>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tỷ lệ chuyển đổi báo giá</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Tổng báo giá</span>
              <span className="text-lg font-semibold">{fmt(stats?.totalQuotations)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Đã chuyển đổi</span>
              <span className="text-lg font-semibold text-emerald-600">{fmt(stats?.convertedQuotations)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Tỷ lệ chuyển đổi</span>
              <span className="text-lg font-semibold text-purple-600">
                {stats?.totalQuotations > 0
                  ? Math.round((stats.convertedQuotations / stats.totalQuotations) * 100)
                  : 0}%
              </span>
            </div>
            <div className="bg-gray-100 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-purple-500 transition-all duration-500"
                style={{
                  width: (stats?.totalQuotations > 0
                    ? Math.round((stats.convertedQuotations / stats.totalQuotations) * 100)
                    : 0) + '%'
                }}
              />
            </div>
          </div>
        </Card>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Đơn hàng chưa thanh toán</h3>
          <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái']}>
            {(stats?.unpaidOrdersList || []).slice(0, 5).map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                <Td>
                  <Link to={`/sales-orders/${o.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td>{o.customer?.name || '—'}</Td>
                <Td className="font-semibold text-red-600">{fmtCurrency(o.totalAmount)}</Td>
                <Td>
                  <Badge variant={ORDER_STATUS[o.status]?.variant || 'gray'}>
                    {ORDER_STATUS[o.status]?.label || o.status}
                  </Badge>
                </Td>
              </tr>
            ))}
            {(!stats?.unpaidOrdersList || stats.unpaidOrdersList.length === 0) && (
              <tr><Td colSpan={4} className="text-center text-gray-400">Không có đơn chưa thanh toán</Td></tr>
            )}
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
