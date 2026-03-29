import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import { PageHeader, Card, DetailGrid, Table, Td, Badge, Btn, LinkBtn, Field, Loading, Icons, ActionLink, fmt, fmtDate } from '../../components/ui'

/* ─── MOCK DATA (same as list) ─── */
const MOCK_ORDERS = [
  { id: 1, orderNumber: 'LSX-2026-001', product: { name: 'Bàn làm việc Gỗ Sồi' }, quantity: 50, completedQuantity: 50, scrapQuantity: 2, status: 'COMPLETED', startDate: '2026-01-10', dueDate: '2026-02-10', priority: 'HIGH', notes: 'Đơn hàng cho khách VIP' },
  { id: 2, orderNumber: 'LSX-2026-002', product: { name: 'Ghế xoay văn phòng cao cấp' }, quantity: 100, completedQuantity: 65, scrapQuantity: 3, status: 'IN_PROGRESS', startDate: '2026-02-01', dueDate: '2026-03-15', priority: 'URGENT', notes: '' },
  { id: 3, orderNumber: 'LSX-2026-003', product: { name: 'Tủ hồ sơ 3 buồng Gỗ Công Nghiệp' }, quantity: 30, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-03-20', dueDate: '2026-04-20', priority: 'MEDIUM', notes: '' },
  { id: 4, orderNumber: 'LSX-2026-004', product: { name: 'Kệ sách gỗ tự nhiên' }, quantity: 20, completedQuantity: 20, scrapQuantity: 1, status: 'COMPLETED', startDate: '2026-01-15', dueDate: '2026-02-28', priority: 'LOW', notes: '' },
  { id: 5, orderNumber: 'LSX-2026-005', product: { name: 'Bàn họp oval 10 chỗ' }, quantity: 5, completedQuantity: 3, scrapQuantity: 0, status: 'IN_PROGRESS', startDate: '2026-03-01', dueDate: '2026-03-30', priority: 'HIGH', notes: 'Đang chờ vật tư' },
  { id: 6, orderNumber: 'LSX-2026-006', product: { name: 'Tủ quần áo 4 cánh' }, quantity: 15, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-04-01', dueDate: '2026-05-01', priority: 'MEDIUM', notes: '' },
  { id: 7, orderNumber: 'LSX-2026-007', product: { name: 'Giường ngủ King Size' }, quantity: 10, completedQuantity: 10, scrapQuantity: 0, status: 'COMPLETED', startDate: '2026-02-10', dueDate: '2026-03-10', priority: 'HIGH', notes: '' },
  { id: 8, orderNumber: 'LSX-2026-008', product: { name: 'Bàn làm việc Gỗ Sồi' }, quantity: 80, completedQuantity: 40, scrapQuantity: 5, status: 'IN_PROGRESS', startDate: '2026-03-05', dueDate: '2026-04-15', priority: 'URGENT', notes: 'Ưu tiên hoàn thành sớm' },
  { id: 9, orderNumber: 'LSX-2026-009', product: { name: 'Ghế xoay văn phòng cao cấp' }, quantity: 200, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-04-10', dueDate: '2026-06-10', priority: 'LOW', notes: '' },
  { id: 10, orderNumber: 'LSX-2026-010', product: { name: 'Tủ bếp modular' }, quantity: 25, completedQuantity: 25, scrapQuantity: 1, status: 'COMPLETED', startDate: '2026-01-20', dueDate: '2026-02-20', priority: 'MEDIUM', notes: '' },
  { id: 11, orderNumber: 'LSX-2026-011', product: { name: 'Bàn ăn 6 chỗ' }, quantity: 40, completedQuantity: 15, scrapQuantity: 2, status: 'IN_PROGRESS', startDate: '2026-03-10', dueDate: '2026-04-10', priority: 'HIGH', notes: '' },
  { id: 12, orderNumber: 'LSX-2026-012', product: { name: 'Kệ tivi gỗ công nghiệp' }, quantity: 60, completedQuantity: 0, scrapQuantity: 0, status: 'CANCELLED', startDate: '2026-02-15', dueDate: '2026-03-15', priority: 'LOW', notes: 'Đã hủy do thiếu NVL' },
  { id: 13, orderNumber: 'LSX-2026-013', product: { name: 'Bàn trang điểm' }, quantity: 35, completedQuantity: 35, scrapQuantity: 0, status: 'COMPLETED', startDate: '2026-02-01', dueDate: '2026-03-01', priority: 'MEDIUM', notes: '' },
  { id: 14, orderNumber: 'LSX-2026-014', product: { name: 'Ghế bar chân cao' }, quantity: 50, completedQuantity: 20, scrapQuantity: 1, status: 'IN_PROGRESS', startDate: '2026-03-15', dueDate: '2026-04-30', priority: 'URGENT', notes: '' },
  { id: 15, orderNumber: 'LSX-2026-015', product: { name: 'Tủ hồ sơ 3 buồng Gỗ Công Nghiệp' }, quantity: 45, completedQuantity: 0, scrapQuantity: 0, status: 'PLANNED', startDate: '2026-05-01', dueDate: '2026-06-15', priority: 'HIGH', notes: '' },
]

const MOCK_WORK_ORDERS = [
  { id: 1, workOrderNumber: 'WO-001', description: 'Cắt gỗ', assignedTo: { fullName: 'Nguyễn Văn A' }, status: 'COMPLETED', completedQuantity: 50 },
  { id: 2, workOrderNumber: 'WO-002', description: 'Lắp ráp', assignedTo: { fullName: 'Trần Văn B' }, status: 'IN_PROGRESS', completedQuantity: 30 },
]

const STATUS_BADGE = {
  PLANNED: { variant: 'gray', label: 'Kế hoạch' },
  IN_PROGRESS: { variant: 'blue', label: 'Đang SX' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
  PENDING: { variant: 'yellow', label: 'Chờ xử lý' },
}

const PRIORITY_LABELS = {
  URGENT: 'Cần gấp',
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
}

export default function ProductionOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [progressForm, setProgressForm] = useState({ completedQuantity: 0, scrapQuantity: 0 })
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    setLoading(true)
    // Use mock data - find by id
    setTimeout(() => {
      const found = MOCK_ORDERS.find(o => o.id === Number(id))
      if (found) {
        setOrder(found)
        setProgressForm({
          completedQuantity: found.completedQuantity || 0,
          scrapQuantity: found.scrapQuantity || 0,
        })
        // Mock work orders for orders that are IN_PROGRESS or COMPLETED
        if (found.status === 'IN_PROGRESS' || found.status === 'COMPLETED') {
          setWorkOrders(MOCK_WORK_ORDERS)
        } else {
          setWorkOrders([])
        }
      } else {
        navigate('/production-orders')
      }
      setLoading(false)
    }, 300)
  }, [id])

  const handleStatusChange = (newStatus) => {
    if (order) {
      setOrder({ ...order, status: newStatus })
    }
  }

  const handleProgressUpdate = (e) => {
    e.preventDefault()
    setUpdating(true)
    setTimeout(() => {
      setOrder({
        ...order,
        completedQuantity: Number(progressForm.completedQuantity),
        scrapQuantity: Number(progressForm.scrapQuantity),
      })
      setUpdating(false)
    }, 500)
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
    { label: 'Mức độ ưu tiên', value: <Badge variant={order.priority === 'URGENT' ? 'red' : 'gray'}>{PRIORITY_LABELS[order.priority] || order.priority}</Badge> },
    { label: 'SL yêu cầu', value: fmt(order.quantity) },
    { label: 'SL hoàn thành', value: <span className="text-green-600">{fmt(order.completedQuantity || 0)}</span> },
    { label: 'SL phế phẩm', value: <span className="text-red-600">{fmt(order.scrapQuantity || 0)}</span> },
    { label: 'Ngày bắt đầu', value: fmtDate(order.startDate) },
    { label: 'Ngày hoàn thành', value: fmtDate(order.dueDate) },
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
