import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, LinkBtn, fmtCurrency, fmtDate, fmt } from '../../components/ui'
import { dashboardApi } from '../../services/api'

const ORDER_STATUS = {
  PENDING: { label: 'Chờ xử lý', variant: 'yellow' },
  CONFIRMED: { label: 'Đã xác nhận', variant: 'blue' },
  IN_PRODUCTION: { label: 'Đang sản xuất', variant: 'purple' },
  READY_FOR_DELIVERY: { label: 'Sẵn sàng giao', variant: 'cyan' },
  DELIVERED: { label: 'Đã giao', variant: 'green' },
  CANCELLED: { label: 'Đã hủy', variant: 'red' },
}

const QUOTE_STATUS = {
  DRAFT: { label: 'Nháp', variant: 'gray' },
  SENT: { label: 'Đã gửi', variant: 'blue' },
  ACCEPTED: { label: 'Chấp nhận', variant: 'green' },
  REJECTED: { label: 'Từ chối', variant: 'red' },
  EXPIRED: { label: 'Hết hạn', variant: 'yellow' },
}

export default function SalesStaffDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getSalesStaff().then(({ data }) => {
      setStats(data.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <DashboardLayout title="Dashboard Bán hàng"><Loading /></DashboardLayout>

  return (
    <DashboardLayout title="Dashboard Bán hàng">
      <div className="flex flex-wrap gap-3 mb-6">
        <LinkBtn to="/quotations/new" variant="primary">+ Tạo báo giá</LinkBtn>
        <LinkBtn to="/sales-orders/new" variant="secondary">+ Tạo đơn hàng</LinkBtn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard label="Khách hàng của tôi" value={fmt(stats?.totalCustomers)} color="blue" />
        <StatCard label="Báo giá" value={fmt(stats?.totalQuotations)} color="purple" />
        <StatCard label="Đơn hàng" value={fmt(stats?.totalOrders)} color="green" />
        <StatCard label="Doanh thu" value={fmtCurrency(stats?.myRevenue)} color="orange" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Đơn hàng gần đây</h3>
          <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái']}>
            {(stats?.recentOrders || []).map((o) => (
              <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                <Td>
                  <Link to={`/sales-orders/${o.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                    {o.orderNumber}
                  </Link>
                </Td>
                <Td>{o.customer?.name || '—'}</Td>
                <Td className="font-semibold">{fmtCurrency(o.totalAmount)}</Td>
                <Td>
                  <Badge variant={ORDER_STATUS[o.status]?.variant || 'gray'}>
                    {ORDER_STATUS[o.status]?.label || o.status}
                  </Badge>
                </Td>
              </tr>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <tr><Td colSpan={4} className="text-center text-gray-400">Chưa có đơn hàng</Td></tr>
            )}
          </Table>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Báo giá gần đây</h3>
          <Table headers={['Số BG', 'Khách hàng', 'Tổng tiền', 'Trạng thái']}>
            {(stats?.recentQuotations || []).map((q) => (
              <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                <Td>
                  <Link to={`/quotations/${q.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                    {q.quotationNumber}
                  </Link>
                </Td>
                <Td>{q.customer?.name || '—'}</Td>
                <Td className="font-semibold">{fmtCurrency(q.totalAmount)}</Td>
                <Td>
                  <Badge variant={QUOTE_STATUS[q.status]?.variant || 'gray'}>
                    {QUOTE_STATUS[q.status]?.label || q.status}
                  </Badge>
                </Td>
              </tr>
            ))}
            {(!stats?.recentQuotations || stats.recentQuotations.length === 0) && (
              <tr><Td colSpan={4} className="text-center text-gray-400">Chưa có báo giá</Td></tr>
            )}
          </Table>
        </div>
      </div>
    </DashboardLayout>
  )
}
