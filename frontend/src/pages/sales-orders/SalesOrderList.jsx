import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { salesOrderApi } from '../../services/api'
import { PageHeader, FilterTabs, Table, Td, Badge, ActionLink, Loading, EmptyState, Icons, fmtCurrency, fmtDate } from '../../components/ui'

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'IN_PRODUCTION', label: 'Đang sản xuất' },
  { value: 'READY_FOR_DELIVERY', label: 'Sẵn giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
  { value: 'CANCELLED', label: 'Đã hủy' },
]

const orderStatusVariant = {
  PENDING: 'yellow', CONFIRMED: 'blue', IN_PRODUCTION: 'purple',
  READY_FOR_DELIVERY: 'cyan', DELIVERED: 'green', CANCELLED: 'red',
}
const orderStatusLabel = {
  PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận', IN_PRODUCTION: 'Đang sản xuất',
  READY_FOR_DELIVERY: 'Sẵn giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy',
}

const paymentVariant = { UNPAID: 'red', PARTIAL: 'yellow', PAID: 'green' }
const paymentLabel = { UNPAID: 'Chưa TT', PARTIAL: 'TT một phần', PAID: 'Đã TT' }

export default function SalesOrderList() {
  const [orders, setOrders] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchOrders = async (status) => {
    try {
      setLoading(true)
      const params = status ? { status } : {}
      const res = await salesOrderApi.getAll(params)
      setOrders(res.data.data || [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders(selectedStatus) }, [selectedStatus])

  return (
    <DashboardLayout>
      <PageHeader title="Đơn hàng" desc="Quản lý đơn hàng bán" actionTo="/sales-orders/new" actionLabel="Tạo đơn hàng" />

      <FilterTabs tabs={STATUS_TABS} active={selectedStatus} onChange={setSelectedStatus} />

      {loading ? <Loading /> : orders.length === 0 ? <EmptyState message="Không có đơn hàng nào" /> : (
        <Table headers={['Số đơn', 'Khách hàng', 'NV bán hàng', 'Tổng tiền', 'Trạng thái', 'Thanh toán', 'Ngày giao', 'Thao tác']}>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
              <Td className="font-mono text-gray-600">{o.orderNumber}</Td>
              <Td className="font-medium text-gray-900">{o.customer?.name || '—'}</Td>
              <Td className="text-gray-500">{o.salesStaff?.fullName || '—'}</Td>
              <Td className="font-medium text-gray-700">{fmtCurrency(o.totalAmount)}</Td>
              <Td>
                <Badge variant={orderStatusVariant[o.status] || 'gray'}>
                  {orderStatusLabel[o.status] || o.status}
                </Badge>
              </Td>
              <Td>
                <Badge variant={paymentVariant[o.paymentStatus] || 'gray'}>
                  {paymentLabel[o.paymentStatus] || o.paymentStatus}
                </Badge>
              </Td>
              <Td className="text-gray-500">{fmtDate(o.deliveryDate)}</Td>
              <Td>
                <ActionLink to={`/sales-orders/${o.id}`} icon={Icons.eye} title="Xem" />
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
