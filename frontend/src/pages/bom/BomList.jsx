import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { PageHeader, Table, Td, Badge, ActionLink, Icons, Loading, Alert, EmptyState, fmtDate } from '../../components/ui'
import { bomApi } from '../../services/api'

const statusMap = {
  DRAFT: { label: 'Nháp', variant: 'yellow' },
  ACTIVE: { label: 'Hoạt động', variant: 'green' },
  ARCHIVED: { label: 'Lưu trữ', variant: 'gray' },
}

export default function BomList() {
  const [boms, setBoms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBoms = async () => {
      try {
        const { data } = await bomApi.getAll()
        setBoms(data.data || [])
      } catch {
        setError('Không thể tải danh sách BOM')
      } finally {
        setLoading(false)
      }
    }
    fetchBoms()
  }, [])

  return (
    <DashboardLayout title="Danh sách BOM">
      <PageHeader title="Danh sách BOM" desc="Quản lý định mức nguyên vật liệu" actionTo="/bom/new" actionLabel="Tạo BOM mới" />

      <Alert type="error" message={error} />

      {loading ? <Loading /> : boms.length === 0 ? <EmptyState message="Chưa có BOM nào" /> : (
        <Table headers={['Tên', 'Sản phẩm', 'Phiên bản', 'Trạng thái', 'Ngày tạo', 'Thao tác']}>
          {boms.map((b) => {
            const status = statusMap[b.status] || { label: b.status, variant: 'gray' }
            return (
              <tr key={b.id} className="hover:bg-gray-50/50">
                <Td className="font-medium text-gray-900">{b.name}</Td>
                <Td>{b.product?.name || '—'}</Td>
                <Td>{b.version}</Td>
                <Td><Badge variant={status.variant}>{status.label}</Badge></Td>
                <Td>{fmtDate(b.createdAt)}</Td>
                <Td>
                  <div className="flex gap-1">
                    <ActionLink to={`/bom/${b.id}`} icon={Icons.eye} title="Xem" />
                    <ActionLink to={`/bom/${b.id}/edit`} icon={Icons.edit} title="Sửa" />
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
