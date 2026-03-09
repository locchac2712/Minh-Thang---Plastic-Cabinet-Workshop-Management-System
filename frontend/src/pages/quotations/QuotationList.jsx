import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import { quotationApi } from '../../services/api'
import { PageHeader, FilterTabs, Table, Td, Badge, ActionLink, Loading, EmptyState, Icons, fmtCurrency, fmtDate } from '../../components/ui'

const STATUS_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'SENT', label: 'Đã gửi' },
  { value: 'APPROVED', label: 'Duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
]

const statusVariant = {
  DRAFT: 'gray',
  SENT: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
  EXPIRED: 'yellow',
}

const statusLabel = {
  DRAFT: 'Nháp',
  SENT: 'Đã gửi',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  EXPIRED: 'Hết hạn',
}

export default function QuotationList() {
  const [quotations, setQuotations] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchQuotations = async (status) => {
    try {
      setLoading(true)
      const params = status ? { status } : {}
      const res = await quotationApi.getAll(params)
      setQuotations(res.data.data || [])
    } catch {
      setQuotations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchQuotations(selectedStatus) }, [selectedStatus])

  return (
    <DashboardLayout>
      <PageHeader title="Báo giá" desc="Quản lý báo giá khách hàng" actionTo="/quotations/new" actionLabel="Tạo báo giá" />

      <FilterTabs tabs={STATUS_TABS} active={selectedStatus} onChange={setSelectedStatus} />

      {loading ? <Loading /> : quotations.length === 0 ? <EmptyState message="Không có báo giá nào" /> : (
        <Table headers={['Số báo giá', 'Khách hàng', 'NV bán hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Thao tác']}>
          {quotations.map((q) => (
            <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
              <Td className="font-mono text-gray-600">{q.quotationNumber}</Td>
              <Td className="font-medium text-gray-900">{q.customer?.name || '—'}</Td>
              <Td className="text-gray-500">{q.salesStaff?.fullName || '—'}</Td>
              <Td className="font-medium text-gray-700">{fmtCurrency(q.totalAmount)}</Td>
              <Td>
                <Badge variant={statusVariant[q.status] || 'gray'}>
                  {statusLabel[q.status] || q.status}
                </Badge>
              </Td>
              <Td className="text-gray-500">{fmtDate(q.createdAt)}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  <ActionLink to={`/quotations/${q.id}`} icon={Icons.eye} title="Xem" />
                  {q.status === 'DRAFT' && (
                    <ActionLink to={`/quotations/${q.id}/edit`} icon={Icons.edit} title="Sửa" />
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </DashboardLayout>
  )
}
