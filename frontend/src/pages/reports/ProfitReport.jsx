import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { Card, StatCard, Table, Td, Badge, Loading, PageHeader, fmt, fmtCurrency, fmtDate } from '../../components/ui'
import { salesOrderApi } from '../../services/api'

export default function ProfitReport() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await salesOrderApi.getAll()
        const items = Array.isArray(data) ? data : data?.data || []
        setOrders(items)
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <DashboardLayout title="Báo cáo lợi nhuận"><Loading /></DashboardLayout>

  const delivered = orders.filter((o) => o.status === 'DELIVERED')
  const totalRevenue = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const avgRevenue = delivered.length > 0 ? totalRevenue / delivered.length : 0

  const sorted = [...delivered].sort((a, b) => new Date(b.deliveryDate || b.updatedAt || 0) - new Date(a.deliveryDate || a.updatedAt || 0))

  return (
    <DashboardLayout title="Báo cáo lợi nhuận">
      <PageHeader title="Báo cáo lợi nhuận" desc="Phân tích doanh thu và lợi nhuận từ đơn hàng đã giao" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatCard label="Tổng doanh thu" value={fmtCurrency(totalRevenue)} color="green" />
        <StatCard label="Tổng đơn đã giao" value={fmt(delivered.length)} color="blue" />
        <StatCard label="Doanh thu trung bình/đơn" value={fmtCurrency(Math.round(avgRevenue))} color="purple" />
      </div>

      {sorted.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-gray-400 text-sm">Chưa có đơn hàng đã giao</p>
        </Card>
      ) : (
        <Table headers={['Số đơn', 'Khách hàng', 'Doanh thu', 'Ngày giao', 'NV bán hàng']}>
          {sorted.map((o) => (
            <tr key={o.id} className="hover:bg-purple-50/30 transition-colors">
              <Td className="font-mono text-gray-600">{o.orderNumber || o.id}</Td>
              <Td className="font-medium text-gray-900">{o.customer?.name || '—'}</Td>
              <Td className="text-right font-semibold text-emerald-600">{fmtCurrency(o.totalAmount)}</Td>
              <Td className="text-gray-500">{fmtDate(o.deliveryDate || o.updatedAt)}</Td>
              <Td className="text-gray-500">{o.salesPerson?.fullName || o.createdBy?.fullName || '—'}</Td>
            </tr>
          ))}
        </Table>
      )}

      <Card className="p-5 mt-6">
        <div className="flex items-start gap-3">
          <span className="text-lg">ℹ️</span>
          <p className="text-sm text-gray-500">
            Chi phí sản xuất sẽ được tính toán khi module kế toán hoàn thiện.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  )
}
