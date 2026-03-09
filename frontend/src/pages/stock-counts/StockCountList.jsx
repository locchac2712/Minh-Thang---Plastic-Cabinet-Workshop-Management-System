import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Table, Td, Badge, Loading, EmptyState, ActionLink, Icons, fmtDate } from '../../components/ui'
import { stockCountApi } from '../../services/api'

const STATUS_BADGE = {
  DRAFT: { variant: 'yellow', label: 'Nháp' },
  COMPLETED: { variant: 'green', label: 'Hoàn thành' },
  CANCELLED: { variant: 'red', label: 'Đã hủy' },
}

export default function StockCountList() {
  const [counts, setCounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await stockCountApi.getAll()
        setCounts(Array.isArray(res.data) ? res.data : res.data?.data || [])
      } catch {
        setCounts([])
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <DashboardLayout title="Kiểm kê kho">
      <PageHeader title="Kiểm kê kho" desc="Danh sách phiếu kiểm kê" actionTo="/stock-counts/new" actionLabel="Tạo phiếu kiểm kê" />

      {loading ? <Loading /> : counts.length === 0 ? <EmptyState message="Chưa có phiếu kiểm kê" /> : (
        <Table headers={['Số phiếu', 'Kho', 'Ngày kiểm', 'Trạng thái', 'Người tạo', '']}>
          {counts.map((c) => {
            const st = STATUS_BADGE[c.status] || { variant: 'gray', label: c.status }
            return (
              <tr key={c.id} className="hover:bg-purple-50/30 transition-colors">
                <Td className="font-mono text-gray-600">{c.countNumber || c.id}</Td>
                <Td>{c.warehouse?.name || '—'}</Td>
                <Td className="text-gray-500">{fmtDate(c.countDate)}</Td>
                <Td><Badge variant={st.variant}>{st.label}</Badge></Td>
                <Td className="text-gray-500">{c.createdBy?.fullName || c.createdBy || '—'}</Td>
                <Td>
                  <ActionLink to={`/stock-counts/${c.id}`} icon={Icons.eye} title="Xem" />
                </Td>
              </tr>
            )
          })}
        </Table>
      )}
    </DashboardLayout>
  )
}
