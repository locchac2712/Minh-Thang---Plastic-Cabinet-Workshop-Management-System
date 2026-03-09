import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, StatCard, Table, Td, Badge, Loading, EmptyState, fmtCurrency, fmtDate } from '../../components/ui'
import { salesOrderApi } from '../../services/api'

const STATUS_BADGE = {
  PENDING: { variant: 'yellow', label: 'Chờ xử lý' },
  CONFIRMED: { variant: 'blue', label: 'Đã xác nhận' },
  PROCESSING: { variant: 'purple', label: 'Đang xử lý' },
  DELIVERED: { variant: 'green', label: 'Đã giao' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

export default function RevenueReport() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await salesOrderApi.getAll()
        const data = Array.isArray(res.data) ? res.data : res.data?.data || []
        setOrders(data)
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <DashboardLayout title="Báo cáo doanh thu">
        <Loading />
      </DashboardLayout>
    )
  }

  const delivered = orders.filter((o) => o.status === 'DELIVERED')
  const pending = orders.filter((o) => o.status === 'PENDING')
  const revenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  const sorted = [...orders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

  return (
    <DashboardLayout title="Báo cáo doanh thu">
      <PageHeader title="Báo cáo doanh thu" desc="Thống kê doanh thu từ đơn hàng" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-fade-in-up">
        <StatCard label="Tổng đơn hàng" value={orders.length} color="blue" />
        <StatCard label="Đã giao" value={delivered.length} color="green" />
        <StatCard label="Doanh thu" value={revenue ? fmtCurrency(revenue) : '—'} color="purple" />
        <StatCard label="Đơn chờ" value={pending.length} color="orange" />
      </div>

      <h3 className="text-base font-semibold text-gray-900 mb-4">Tất cả đơn hàng</h3>
      {sorted.length === 0 ? <EmptyState message="Chưa có đơn hàng" /> : (
        <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo']}>
          {sorted.map((o) => {
            const st = STATUS_BADGE[o.status] || { variant: 'gray', label: o.status }
            return (
              <tr key={o.id} className="hover:bg-purple-50/30 transition-colors">
                <Td className="font-mono text-gray-600">{o.orderNumber || o.id}</Td>
                <Td>{o.customer?.name || '—'}</Td>
                <Td className="text-right font-medium">{o.totalAmount ? fmtCurrency(o.totalAmount) : '—'}</Td>
                <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                <Td className="text-gray-500">{fmtDate(o.createdAt)}</Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
