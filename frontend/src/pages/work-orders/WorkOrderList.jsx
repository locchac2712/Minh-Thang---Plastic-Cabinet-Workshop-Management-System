import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, FilterTabs, Table, Td, Badge, Loading, EmptyState, ActionLink, Icons, fmt, fmtDate } from '../../components/ui'
import { workOrderApi } from '../../services/api'

const STATUS_TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xử lý', value: 'PENDING' },
  { label: 'Đang thực hiện', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
]

const STATUS_BADGE = {
  PENDING: { variant: 'yellow', label: 'Chờ xử lý' },
  IN_PROGRESS: { variant: 'blue', label: 'Đang thực hiện' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
  PLANNED: { variant: 'gray', label: 'Kế hoạch' },
}

export default function WorkOrderList() {
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
      const { data } = await workOrderApi.getAll(params)
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
    <DashboardLayout title="Work Order">
      <PageHeader title="Work Order" desc="Quản lý các work order" actionTo="/work-orders/new" actionLabel="Tạo Work Order">
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

      {loading ? <Loading /> : orders.length === 0 ? <EmptyState message="Không có work order nào" /> : (
        <Table headers={['Số WO', 'Lệnh SX', 'Mô tả', 'Người thực hiện', 'Trạng thái', 'SL hoàn thành', 'Ngày bắt đầu', '']}>
          {orders.map((wo) => {
            const st = STATUS_BADGE[wo.status] || { variant: 'gray', label: wo.status }
            return (
              <tr key={wo.id} className="hover:bg-purple-50/30 transition-colors">
                <Td className="font-medium text-gray-900">{wo.workOrderNumber}</Td>
                <Td>
                  {wo.productionOrder ? (
                    <Link to={`/production-orders/${wo.productionOrder.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
                      {wo.productionOrder.orderNumber}
                    </Link>
                  ) : '—'}
                </Td>
                <Td className="max-w-xs truncate">{wo.description || '—'}</Td>
                <Td>{wo.assignedTo?.fullName || '—'}</Td>
                <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                <Td>{fmt(wo.completedQuantity || 0)}</Td>
                <Td>{fmtDate(wo.startDate)}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <ActionLink to={`/work-orders/${wo.id}`} icon={Icons.eye} title="Xem" />
                    <ActionLink to={`/work-orders/${wo.id}/edit`} icon={Icons.edit} title="Sửa" />
                  </div>
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
