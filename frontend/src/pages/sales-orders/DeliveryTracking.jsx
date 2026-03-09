import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { salesOrderApi } from '../../services/api'
import { PageHeader, FilterTabs, Table, Td, Badge, StatCard, ActionLink, Loading, EmptyState, SearchBar, Icons, fmtCurrency, fmtDate } from '../../components/ui'

const DELIVERY_STATUSES = ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DELIVERY', 'DELIVERED']

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'IN_PRODUCTION', label: 'Đang sản xuất' },
  { value: 'READY_FOR_DELIVERY', label: 'Sẵn giao' },
  { value: 'DELIVERED', label: 'Đã giao' },
]

const statusVariant = {
  CONFIRMED: 'blue', IN_PRODUCTION: 'purple',
  READY_FOR_DELIVERY: 'cyan', DELIVERED: 'green',
}
const statusLabel = {
  CONFIRMED: 'Đã xác nhận', IN_PRODUCTION: 'Đang sản xuất',
  READY_FOR_DELIVERY: 'Sẵn giao', DELIVERED: 'Đã giao',
}

const paymentVariant = { UNPAID: 'red', PARTIAL: 'yellow', PAID: 'green' }
const paymentLabel = { UNPAID: 'Chưa TT', PARTIAL: 'TT một phần', PAID: 'Đã TT' }

function isOverdue(order) {
  if (order.status === 'DELIVERED' || !order.deliveryDate) return false
  return new Date(order.deliveryDate) < new Date()
}

export default function DeliveryTracking() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const res = await salesOrderApi.getAll()
        const items = res.data.data || res.data
        setOrders(Array.isArray(items) ? items.filter(o => DELIVERY_STATUSES.includes(o.status)) : [])
      } catch {
        setError('Không thể tải dữ liệu đơn hàng')
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = orders.filter(o => {
    if (tab && o.status !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return (o.orderNumber?.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q))
    }
    return true
  })

  const inTransitCount = orders.filter(o => ['CONFIRMED', 'IN_PRODUCTION', 'READY_FOR_DELIVERY'].includes(o.status)).length
  const readyCount = orders.filter(o => o.status === 'READY_FOR_DELIVERY').length
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length

  return (
    <DashboardLayout>
      <PageHeader title="Theo dõi giao hàng" desc="Theo dõi đơn hàng từ xác nhận đến giao hàng" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Đang vận chuyển" value={inTransitCount} color="blue" desc="Đã xác nhận + Đang SX + Sẵn giao" />
        <StatCard label="Sẵn giao" value={readyCount} color="cyan" desc="Sẵn sàng giao hàng" />
        <StatCard label="Đã giao" value={deliveredCount} color="green" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm số đơn, khách hàng..." />
      </div>

      <FilterTabs tabs={TABS} active={tab} onChange={setTab} />

      {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm mb-6">{error}</div>}

      {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="Không có đơn hàng nào" /> : (
        <Table headers={['Số đơn', 'Khách hàng', 'Ngày giao dự kiến', 'Địa chỉ giao', 'Trạng thái', 'Thanh toán', 'Thao tác']}>
          {filtered.map((o) => {
            const overdue = isOverdue(o)
            return (
              <tr key={o.id} className={`transition-colors ${overdue ? 'bg-red-50 hover:bg-red-100/60' : 'hover:bg-gray-50/50'}`}>
                <Td className="font-mono text-gray-600">{o.orderNumber}</Td>
                <Td className="font-medium text-gray-900">{o.customer?.name || '—'}</Td>
                <Td className="text-gray-500">
                  {fmtDate(o.deliveryDate)}
                  {overdue && <Badge variant="red">Quá hạn</Badge>}
                </Td>
                <Td className="text-gray-500" title={o.deliveryAddress}>
                  {o.deliveryAddress ? (o.deliveryAddress.length > 30 ? o.deliveryAddress.slice(0, 30) + '…' : o.deliveryAddress) : '—'}
                </Td>
                <Td>
                  <Badge variant={statusVariant[o.status] || 'gray'}>
                    {statusLabel[o.status] || o.status}
                  </Badge>
                </Td>
                <Td>
                  <Badge variant={paymentVariant[o.paymentStatus] || 'gray'}>
                    {paymentLabel[o.paymentStatus] || o.paymentStatus}
                  </Badge>
                </Td>
                <Td>
                  <ActionLink to={`/sales-orders/${o.id}`} icon={Icons.eye} title="Xem chi tiết" />
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
