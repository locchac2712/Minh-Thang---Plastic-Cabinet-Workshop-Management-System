import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Card, DetailGrid, Table, Td, Badge, Btn, LinkBtn, Loading, EmptyState, Icons, fmt, fmtDate } from '../../components/ui'
import { stockCountApi } from '../../services/api'

const STATUS_BADGE = {
  DRAFT: { variant: 'yellow', label: 'Nháp' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

export default function StockCountDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [count, setCount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

  const fetchData = async () => {
    try {
      const res = await stockCountApi.getById(id)
      setCount(res.data.data)
    } catch {
      setCount(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [id])

  const handleComplete = async () => {
    if (!window.confirm('Bạn có chắc muốn hoàn thành phiếu kiểm kê này?')) return
    try {
      setCompleting(true)
      await stockCountApi.complete(id)
      fetchData()
    } catch {
      alert('Hoàn thành kiểm kê thất bại.')
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Chi tiết kiểm kê">
        <Loading />
      </DashboardLayout>
    )
  }

  if (!count) {
    return (
      <DashboardLayout title="Chi tiết kiểm kê">
        <EmptyState message="Không tìm thấy phiếu kiểm kê" />
        <div className="text-center mt-4">
          <LinkBtn to="/stock-counts" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        </div>
      </DashboardLayout>
    )
  }

  const items = count.items || []
  const discrepancies = items.filter((it) => it.difference !== 0)
  const st = STATUS_BADGE[count.status] || { variant: 'gray', label: count.status }

  const detailItems = [
    { label: 'Kho', value: count.warehouse?.name },
    { label: 'Ngày kiểm kê', value: fmtDate(count.countDate) },
    { label: 'Tổng vật tư', value: items.length },
    { label: 'Có chênh lệch', value: <span className={discrepancies.length > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{discrepancies.length}</span> },
    { label: 'Trạng thái', value: <Badge variant={st.variant}>{st.label}</Badge> },
    { label: 'Người tạo', value: count.createdBy?.fullName || count.createdBy },
    ...(count.notes ? [{ label: 'Ghi chú', value: count.notes }] : []),
  ]

  return (
    <DashboardLayout title="Chi tiết kiểm kê">
      <PageHeader title={`Phiếu kiểm kê #${count.countNumber || count.id}`} desc={`Tạo bởi: ${count.createdBy?.fullName || count.createdBy || '—'}`}>
        <LinkBtn to="/stock-counts" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        {count.status === 'DRAFT' && (
          <Btn onClick={handleComplete} disabled={completing}>
            {completing ? 'Đang xử lý...' : 'Hoàn thành kiểm kê'}
          </Btn>
        )}
      </PageHeader>

      <div className="mb-6">
        <DetailGrid items={detailItems} />
      </div>

      <div className="animate-fade-in-up delay-150">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Chi tiết vật tư kiểm kê</h3>
        {items.length === 0 ? <EmptyState message="Không có dữ liệu" /> : (
          <Table headers={['NVL', 'SL hệ thống', 'SL thực tế', 'Chênh lệch', 'Ghi chú']}>
            {items.map((it, idx) => {
              const diff = it.difference ?? 0
              const rowCls = diff < 0 ? 'bg-red-50/50' : diff > 0 ? 'bg-blue-50/50' : ''
              const diffCls = diff < 0 ? 'text-red-600' : diff > 0 ? 'text-blue-600' : 'text-gray-500'
              return (
                <tr key={idx} className={`${rowCls} hover:bg-purple-50/30 transition-colors`}>
                  <Td>{it.rawMaterial?.name || '—'}</Td>
                  <Td className="text-right text-gray-500">{fmt(it.systemQuantity ?? 0)}</Td>
                  <Td className="text-right font-medium">{fmt(it.actualQuantity ?? 0)}</Td>
                  <Td className={`text-right font-semibold ${diffCls}`}>
                    {diff > 0 ? '+' : ''}{fmt(diff)}
                  </Td>
                  <Td className="text-gray-500">{it.notes || '—'}</Td>
                </tr>
              )
            })}
          </Table>
        )}
      </div>
    </DashboardLayout>
  )
}
