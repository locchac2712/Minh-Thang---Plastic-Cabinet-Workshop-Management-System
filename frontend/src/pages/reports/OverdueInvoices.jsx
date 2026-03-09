import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { StatCard, Table, Td, Badge, Loading, PageHeader, fmt, fmtCurrency, fmtDate } from '../../components/ui'
import { salesOrderApi } from '../../services/api'

const PAYMENT_BADGE = {
  UNPAID: { variant: 'red', label: 'Chưa thanh toán' },
  PARTIAL: { variant: 'yellow', label: 'TT một phần' },
  PAID: { variant: 'green', label: 'Đã thanh toán' },
}

function daysBetween(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  return Math.max(0, Math.floor((d2 - d1) / (1000 * 60 * 60 * 24)))
}

export default function OverdueInvoices() {
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

  if (loading) return <DashboardLayout title="Đơn hàng nợ quá hạn"><Loading /></DashboardLayout>

  const now = new Date()
  const overdue = orders.filter((o) => {
    if (o.paymentStatus === 'PAID') return false
    if (o.status === 'DELIVERED') return true
    if (o.deliveryDate && new Date(o.deliveryDate) < now) return true
    return false
  })

  const totalOverdueAmount = overdue.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const unpaid = overdue.filter((o) => o.paymentStatus === 'UNPAID')
  const partial = overdue.filter((o) => o.paymentStatus === 'PARTIAL')

  const sorted = [...overdue].sort((a, b) => {
    const daysA = daysBetween(a.deliveryDate || a.updatedAt || a.createdAt, now)
    const daysB = daysBetween(b.deliveryDate || b.updatedAt || b.createdAt, now)
    return daysB - daysA
  })

  return (
    <DashboardLayout title="Đơn hàng nợ quá hạn">
      <PageHeader title="Đơn hàng nợ quá hạn" desc="Các đơn hàng đã giao nhưng chưa thanh toán đầy đủ" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard label="Tổng đơn quá hạn" value={fmt(overdue.length)} color="red" />
        <StatCard label="Tổng nợ quá hạn" value={fmtCurrency(totalOverdueAmount)} color="orange" />
        <StatCard label="Đơn chưa TT" value={fmt(unpaid.length)} color="red" />
        <StatCard label="Đơn TT một phần" value={fmt(partial.length)} color="orange" />
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">Không có đơn hàng nợ quá hạn</div>
      ) : (
        <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Thanh toán', 'Ngày giao', 'Số ngày quá hạn']}>
          {sorted.map((o) => {
            const ps = PAYMENT_BADGE[o.paymentStatus] || { variant: 'gray', label: o.paymentStatus }
            const daysOverdue = daysBetween(o.deliveryDate || o.updatedAt || o.createdAt, now)
            return (
              <tr key={o.id} className="bg-red-50 hover:bg-red-100/60 transition-colors">
                <Td className="font-mono text-gray-600">{o.orderNumber || o.id}</Td>
                <Td className="font-medium text-gray-900">{o.customer?.name || '—'}</Td>
                <Td className="text-right font-semibold">{fmtCurrency(o.totalAmount)}</Td>
                <Td><Badge variant={ps.variant}>{ps.label}</Badge></Td>
                <Td className="text-gray-500">{fmtDate(o.deliveryDate || o.updatedAt)}</Td>
                <Td className="text-right font-semibold text-red-600">{daysOverdue} ngày</Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
