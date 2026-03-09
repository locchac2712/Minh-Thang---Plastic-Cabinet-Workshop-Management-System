import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, DetailGrid, Badge, Btn, LinkBtn, Field, Loading, Icons, fmt, fmtDate } from '../../components/ui'
import { workOrderApi } from '../../services/api'

const STATUS_BADGE = {
  PENDING: { variant: 'yellow', label: 'Chờ xử lý' },
  IN_PROGRESS: { variant: 'blue', label: 'Đang thực hiện' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
  PLANNED: { variant: 'gray', label: 'Kế hoạch' },
}

export default function WorkOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [wo, setWo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [progressForm, setProgressForm] = useState({ completedQuantity: 0, scrapQuantity: 0 })
  const [updating, setUpdating] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data } = await workOrderApi.getById(id)
      const item = data.data || data
      setWo(item)
      setProgressForm({
        completedQuantity: item.completedQuantity || 0,
        scrapQuantity: item.scrapQuantity || 0,
      })
    } catch {
      navigate('/work-orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      await workOrderApi.changeStatus(id, newStatus)
      fetchData()
    } catch { /* ignore */ }
  }

  const handleProgressUpdate = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await workOrderApi.updateProgress(id, {
        completedQuantity: Number(progressForm.completedQuantity),
        scrapQuantity: Number(progressForm.scrapQuantity),
      })
      fetchData()
    } catch { /* ignore */ }
    finally { setUpdating(false) }
  }

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết Work Order">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!wo) return null

  const st = STATUS_BADGE[wo.status] || { variant: 'gray', label: wo.status }

  const detailItems = [
    { label: 'Số Work Order', value: wo.workOrderNumber },
    { label: 'Lệnh sản xuất', value: wo.productionOrder ? (
      <Link to={`/production-orders/${wo.productionOrder.id}`} className="text-purple-600 hover:text-purple-800 font-medium">
        {wo.productionOrder.orderNumber}
      </Link>
    ) : '—' },
    { label: 'Trạng thái', value: <Badge variant={st.variant}>{st.label}</Badge> },
    { label: 'Người thực hiện', value: wo.assignedTo?.fullName },
    { label: 'SL hoàn thành', value: <span className="text-green-600">{fmt(wo.completedQuantity || 0)}</span> },
    { label: 'SL phế phẩm', value: <span className="text-red-600">{fmt(wo.scrapQuantity || 0)}</span> },
    { label: 'Ngày bắt đầu', value: fmtDate(wo.startDate) },
    { label: 'Ngày kết thúc', value: fmtDate(wo.endDate) },
    ...(wo.description ? [{ label: 'Mô tả', value: <span className="whitespace-pre-wrap">{wo.description}</span> }] : []),
    ...(wo.notes ? [{ label: 'Ghi chú', value: <span className="whitespace-pre-wrap">{wo.notes}</span> }] : []),
  ]

  return (
    <DashboardLayout title="Chi tiết Work Order">
      <PageHeader title="Chi tiết Work Order" desc={`WO #${wo.workOrderNumber}`}>
        <LinkBtn to="/work-orders" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        <LinkBtn to={`/work-orders/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
        {wo.status === 'PENDING' && (
          <Btn variant="purple" onClick={() => handleStatusChange('IN_PROGRESS')}>Bắt đầu</Btn>
        )}
        {wo.status === 'IN_PROGRESS' && (
          <Btn onClick={() => handleStatusChange('COMPLETED')}>Hoàn thành</Btn>
        )}
      </PageHeader>

      <div className="mb-6">
        <DetailGrid items={detailItems} />
      </div>

      {wo.status === 'IN_PROGRESS' && (
        <Card className="p-6">
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
    </DashboardLayout>
  )
}
