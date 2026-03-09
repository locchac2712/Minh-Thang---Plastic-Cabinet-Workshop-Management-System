import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, StatCard, Table, Td, Badge, Loading, EmptyState, fmtCurrency, fmt } from '../../components/ui'
import { dashboardApi, salesOrderApi } from '../../services/api'

const STATUS_BADGE = {
  PENDING: { variant: 'yellow', label: 'Chờ xử lý' },
  CONFIRMED: { variant: 'blue', label: 'Đã xác nhận' },
  PROCESSING: { variant: 'purple', label: 'Đang xử lý' },
  DELIVERED: { variant: 'green', label: 'Đã giao' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

const PAYMENT_BADGE = {
  UNPAID: { variant: 'red', label: 'Chưa TT' },
  PARTIAL: { variant: 'yellow', label: 'TT một phần' },
  PAID: { variant: 'green', label: 'Đã TT' },
}

export default function FinancialOverview() {
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, ordersRes] = await Promise.all([
          dashboardApi.getStats(),
          salesOrderApi.getAll(),
        ])
        setStats(statsRes.data.data || statsRes.data)
        const orderData = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || []
        setOrders(orderData.slice(0, 10))
      } catch {
        setStats(null)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="Tổng quan tài chính">
        <Loading />
      </DashboardLayout>
    )
  }

  const delivered = orders.filter((o) => o.status === 'DELIVERED')
  const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  return (
    <DashboardLayout title="Tổng quan tài chính">
      <PageHeader title="Tổng quan tài chính" desc="Báo cáo tài chính tổng hợp" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <StatCard label="Tổng doanh thu" value={totalRevenue ? fmtCurrency(totalRevenue) : '—'} color="green" />
        <StatCard label="Đơn hàng" value={stats?.totalSalesOrders ?? orders.length ?? '—'} color="blue" />
        <StatCard label="Công nợ" value="—" color="orange" />
        <StatCard label="Sản phẩm" value={stats?.totalProducts ?? '—'} color="purple" />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-4">Đơn hàng gần đây</h3>
      {orders.length === 0 ? <EmptyState message="Chưa có đơn hàng" /> : (
        <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Thanh toán']}>
          {orders.map((o) => {
            const st = STATUS_BADGE[o.status] || { variant: 'gray', label: o.status }
            const pay = PAYMENT_BADGE[o.paymentStatus] || { variant: 'gray', label: o.paymentStatus || '—' }
            return (
              <tr key={o.id} className="hover:bg-purple-50/30 transition-colors">
                <Td className="font-mono text-gray-600">{o.orderNumber || o.id}</Td>
                <Td>{o.customer?.name || '—'}</Td>
                <Td className="text-right font-medium">{o.totalAmount ? fmtCurrency(o.totalAmount) : '—'}</Td>
                <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                <Td><Badge variant={pay.variant}>{pay.label}</Badge></Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
