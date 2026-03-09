import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, DetailGrid, Table, Td, Badge, Btn, LinkBtn, Field, Loading, Icons, ActionLink, fmt, fmtDate } from '../../components/ui'
import { productionOrderApi, workOrderApi } from '../../services/api'

const STATUS_BADGE = {
  PLANNED: { variant: 'gray', label: 'Kế hoạch' },
  IN_PROGRESS: { variant: 'blue', label: 'Đang SX' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
  PENDING: { variant: 'yellow', label: 'Chờ xử lý' },
}

export default function ProductionOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [progressForm, setProgressForm] = useState({ completedQuantity: 0, scrapQuantity: 0 })
  const [updating, setUpdating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data } = await productionOrderApi.getById(id)
      const o = data.data || data
      setOrder(o)
      setProgressForm({
        completedQuantity: o.completedQuantity || 0,
        scrapQuantity: o.scrapQuantity || 0,
      })
      try {
        const woRes = await workOrderApi.getAll({ productionOrderId: id })
        setWorkOrders(woRes.data.data || woRes.data)
      } catch {
        setWorkOrders([])
      }
    } catch {
      navigate('/production-orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      await productionOrderApi.changeStatus(id, newStatus)
      fetchData()
    } catch { /* ignore */ }
  }

  const handleProgressUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await productionOrderApi.updateProgress(id, {
        completedQuantity: Number(progressForm.completedQuantity),
        scrapQuantity: Number(progressForm.scrapQuantity),
      })
      fetchData()
    } catch { /* ignore */ }
    finally { setUpdating(false) }
  }

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết lệnh sản xuất">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!order) return null

  const pct = order.quantity > 0 ? Math.min(100, Math.round((order.completedQuantity || 0) / order.quantity * 100)) : 0
  const st = STATUS_BADGE[order.status] || { variant: 'gray', label: order.status }

  const detailItems = [
    { label: 'Số lệnh', value: order.orderNumber },
    { label: 'Sản phẩm', value: order.product?.name },
    { label: 'Trạng thái', value: <Badge variant={st.variant}>{st.label}</Badge> },
    { label: 'SL yêu cầu', value: fmt(order.quantity) },
    { label: 'SL hoàn thành', value: <span className="text-green-600">{fmt(order.completedQuantity || 0)}</span> },
    { label: 'SL phế phẩm', value: <span className="text-red-600">{fmt(order.scrapQuantity || 0)}</span> },
    { label: 'Độ ưu tiên', value: order.priority ?? '—' },
    { label: 'Ngày bắt đầu', value: fmtDate(order.startDate) },
    { label: 'Ngày kết thúc', value: fmtDate(order.endDate) },
    ...(order.salesOrder ? [{ label: 'Đơn hàng', value: <span className="text-purple-600">{order.salesOrder.orderNumber}</span> }] : []),
    ...(order.bom ? [{ label: 'BOM', value: order.bom.name || order.bom.bomCode || `#${order.bom.id}` }] : []),
    ...(order.notes ? [{ label: 'Ghi chú', value: <span className="whitespace-pre-wrap">{order.notes}</span> }] : []),
  ]

  return (
    <DashboardLayout title="Chi tiết lệnh sản xuất">
      <PageHeader title="Chi tiết lệnh sản xuất" desc={`Lệnh #${order.orderNumber}`}>
        <LinkBtn to="/production-orders" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        {order.status === 'PLANNED' && (
          <Btn variant="purple" onClick={() => handleStatusChange('IN_PROGRESS')}>Bắt đầu SX</Btn>
        )}
        {order.status === 'IN_PROGRESS' && (
          <Btn onClick={() => handleStatusChange('COMPLETED')}>Hoàn thành</Btn>
        )}
        <LinkBtn to="/stock/out" variant="secondary">Yêu cầu xuất vật tư</LinkBtn>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DetailGrid items={detailItems} />
        </div>
        <Card className="p-6 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="#a855f7" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${pct * 3.267} 326.7`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">{pct}%</span>
              <span className="text-xs text-gray-500">hoàn thành</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            {fmt(order.completedQuantity || 0)} / {fmt(order.quantity)}
          </p>
        </Card>
      </div>

      {order.status === 'IN_PROGRESS' && (
        <Card className="p-6 mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Cập nhật tiến độ</h3>
          <form onSubmit={handleProgressUpdate} className="flex flex-wrap items-end gap-4">
            <Field label="SL hoàn thành" type="number" min="0" value={progressForm.completedQuantity}
              onChange={(e) => setProgressForm((prev) => ({ ...prev, completedQuantity: e.target.value }))} />
            <Field label="SL phế phẩm" type="number" min="0" value={progressForm.scrapQuantity}
              onChange={(e) => setProgressForm((prev) => ({ ...prev, scrapQuantity: e.target.value }))} />
            <Btn type="submit" disabled={updating}>
              {updating ? 'Đang cập nhật...' : 'Cập nhật'}
            </Btn>
          </form>
        </Card>
      )}

      <div className="animate-fade-in-up delay-150">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Work Orders</h3>
          <LinkBtn to={`/work-orders/new?productionOrderId=${id}`} variant="primary">
            {Icons.plus} Tạo WO
          </LinkBtn>
        </div>
        <Table headers={['Số WO', 'Mô tả', 'Người thực hiện', 'Trạng thái', 'SL hoàn thành', '']}>
          {workOrders.length === 0 ? (
            <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Chưa có Work Order nào</td></tr>
          ) : (
            workOrders.map((wo) => {
              const woSt = STATUS_BADGE[wo.status] || { variant: 'gray', label: wo.status }
              return (
                <tr key={wo.id} className="hover:bg-purple-50/30 transition-colors">
                  <Td className="font-medium text-gray-900">{wo.workOrderNumber}</Td>
                  <Td className="max-w-xs truncate">{wo.description || '—'}</Td>
                  <Td>{wo.assignedTo?.fullName || '—'}</Td>
                  <Td><Badge variant={woSt.variant}>{woSt.label}</Badge></Td>
                  <Td>{fmt(wo.completedQuantity || 0)}</Td>
                  <Td>
                    <ActionLink to={`/work-orders/${wo.id}`} icon={Icons.eye} title="Xem" />
                  </Td>
                </tr>
              )
            })
          )}
        </Table>
      </div>
    </DashboardLayout>
  )
}
