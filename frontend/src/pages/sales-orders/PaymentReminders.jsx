import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { salesOrderApi } from '../../services/api'
import { PageHeader, FilterTabs, Table, Td, Badge, StatCard, Loading, EmptyState, LinkBtn, SearchBar, Icons, fmtCurrency, fmtDate } from '../../components/ui'

const TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'UNPAID', label: 'Chưa TT' },
  { value: 'PARTIAL', label: 'TT một phần' },
]

const paymentVariant = { UNPAID: 'red', PARTIAL: 'yellow', PAID: 'green' }
const paymentLabel = { UNPAID: 'Chưa thanh toán', PARTIAL: 'TT một phần', PAID: 'Đã thanh toán' }

export default function PaymentReminders() {
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
        const unpaid = Array.isArray(items)
          ? items.filter(o => o.paymentStatus === 'UNPAID' || o.paymentStatus === 'PARTIAL')
          : []
        unpaid.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        setOrders(unpaid)
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
    if (tab && o.paymentStatus !== tab) return false
    if (search) {
      const q = search.toLowerCase()
      return (o.orderNumber?.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q))
    }
    return true
  })

  const unpaidCount = orders.filter(o => o.paymentStatus === 'UNPAID').length
  const partialCount = orders.filter(o => o.paymentStatus === 'PARTIAL').length
  const totalDebt = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)

  return (
    <DashboardLayout>
      <PageHeader title="Nhắc nhở thanh toán" desc="Đơn hàng chưa thanh toán hoặc thanh toán một phần" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Chưa thanh toán" value={unpaidCount} color="red" desc={`${unpaidCount} đơn hàng`} />
        <StatCard label="Thanh toán một phần" value={partialCount} color="orange" desc={`${partialCount} đơn hàng`} />
        <StatCard label="Tổng nợ" value={fmtCurrency(totalDebt)} color="red" desc="Tổng giá trị đơn chưa thanh toán đủ" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Tìm số đơn, khách hàng..." />
      </div>

      <FilterTabs tabs={TABS} active={tab} onChange={setTab} />

      {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm mb-6">{error}</div>}

      {loading ? <Loading /> : filtered.length === 0 ? <EmptyState message="Không có đơn hàng cần nhắc thanh toán" /> : (
        <Table headers={['Số đơn', 'Khách hàng', 'Tổng tiền', 'Ngày đặt', 'Trạng thái TT', 'Thao tác']}>
          {filtered.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
              <Td className="font-mono text-gray-600">{o.orderNumber}</Td>
              <Td className="font-medium text-gray-900">{o.customer?.name || '—'}</Td>
              <Td className="font-medium text-gray-700">{fmtCurrency(o.totalAmount)}</Td>
              <Td className="text-gray-500">{fmtDate(o.createdAt)}</Td>
              <Td>
                <Badge variant={paymentVariant[o.paymentStatus] || 'gray'}>
                  {paymentLabel[o.paymentStatus] || o.paymentStatus}
                </Badge>
              </Td>
              <Td>
                <LinkBtn to={`/sales-orders/${o.id}`} variant="secondary" className="!px-3 !py-1.5 !text-xs">
                  Xem & Ghi nhận TT
                </LinkBtn>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
