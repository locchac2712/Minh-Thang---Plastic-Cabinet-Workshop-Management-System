import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, FilterTabs, Table, Td, Badge, Loading, EmptyState, ActionLink, Icons, fmt, fmtDate } from '../../components/ui'
import { productionOrderApi } from '../../services/api'

const STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Kế hoạch', value: 'PLANNED' },
  { label: 'Đang SX', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
]

const STATUS_BADGE = {
  PLANNED: { variant: 'gray', label: 'Kế hoạch' },
  IN_PROGRESS: { variant: 'blue', label: 'Đang SX' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

export default function ProductionOrderList() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = {}
      if (status) params.status = status
      if (search) params.q = search
      const { data } = await productionOrderApi.getAll(params)
      setOrders(data.data || data)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [status])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchOrders()
  }

  return (
    <DashboardLayout title="Lệnh sản xuất">
      <PageHeader title="Lệnh sản xuất" desc="Quản lý các lệnh sản xuất" actionTo="/production-orders/new" actionLabel="Tạo lệnh SX">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-white border border-gray-200 rounded-full pl-4 pr-4 py-2.5 text-sm focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
          />
        </form>
      </PageHeader>

      <FilterTabs tabs={STATUS_TABS} active={status} onChange={setStatus} />

      {loading ? <Loading /> : orders.length === 0 ? <EmptyState message="Không có lệnh sản xuất nào" /> : (
        <Table headers={['Số lệnh', 'Sản phẩm', 'SL yêu cầu', 'Tiến độ', 'SL phế phẩm', 'Trạng thái', 'Ngày bắt đầu', '']}>
          {orders.map((o) => {
            const pct = o.quantity > 0 ? Math.min(100, Math.round((o.completedQuantity || 0) / o.quantity * 100)) : 0
            const st = STATUS_BADGE[o.status] || { variant: 'gray', label: o.status }
            return (
              <tr key={o.id} className="hover:bg-purple-50/30 transition-colors">
                <Td className="font-medium text-gray-900">{o.orderNumber}</Td>
                <Td>{o.product?.name || '—'}</Td>
                <Td>{fmt(o.quantity)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: pct + '%' }} />
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {fmt(o.completedQuantity || 0)}/{fmt(o.quantity)} ({pct}%)
                    </span>
                  </div>
                </Td>
                <Td>{fmt(o.scrapQuantity || 0)}</Td>
                <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                <Td>{fmtDate(o.startDate)}</Td>
                <Td>
                  <ActionLink to={`/production-orders/${o.id}`} icon={Icons.eye} title="Xem chi tiết" />
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
