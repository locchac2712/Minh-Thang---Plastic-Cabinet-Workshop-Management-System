import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { quotationApi, customerApi } from '../../services/api'
import { PageHeader, Card, Table, Td, Badge, StatCard, Loading, EmptyState, ActionLink, LinkBtn, Icons, fmtCurrency, fmtDate } from '../../components/ui'

const statusVariant = {
  DRAFT: 'gray', SENT: 'blue', APPROVED: 'green',
  REJECTED: 'red', EXPIRED: 'yellow',
}
const statusLabel = {
  DRAFT: 'Nháp', SENT: 'Đã gửi', APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối', EXPIRED: 'Hết hạn',
}

export default function QuotationHistory() {
  const { customerId } = useParams()
  const [customer, setCustomer] = useState(null)
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true)
        const [custRes, quotRes] = await Promise.all([
          customerApi.getById(customerId),
          quotationApi.getAll({ customerId }),
        ])
        setCustomer(custRes.data.data || custRes.data)
        const items = quotRes.data.data || quotRes.data
        setQuotations(Array.isArray(items) ? items : [])
      } catch {
        setError('Không thể tải dữ liệu')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [customerId])

  const totalCount = quotations.length
  const approvedCount = quotations.filter(q => q.status === 'APPROVED').length
  const rejectedCount = quotations.filter(q => q.status === 'REJECTED').length
  const conversionRate = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <DashboardLayout>
        <Loading text="Đang tải lịch sử báo giá..." />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <PageHeader title="Lịch sử báo giá" desc={customer ? `Khách hàng: ${customer.name}` : ''}>
        <LinkBtn to={customer ? `/customers/${customerId}` : '/quotations'} variant="ghost">
          {Icons.back} Quay lại
        </LinkBtn>
      </PageHeader>

      {error && <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-sm mb-6">{error}</div>}

      {customer && (
        <Card className="p-6 mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Thông tin khách hàng</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Tên</p>
              <p className="text-sm font-medium text-gray-900">{customer.name || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Mã KH</p>
              <p className="text-sm font-medium text-gray-900">{customer.code || customer.customerCode || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Email</p>
              <p className="text-sm font-medium text-gray-900">{customer.email || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Điện thoại</p>
              <p className="text-sm font-medium text-gray-900">{customer.phone || '—'}</p>
            </div>
          </div>
        </Card>
      )}

      {quotations.length === 0 ? <EmptyState message="Chưa có báo giá nào cho khách hàng này" /> : (
        <>
          <Table headers={['Số BG', 'Tổng tiền', 'Trạng thái', 'Hiệu lực đến', 'Ngày tạo', 'Thao tác']}>
            {quotations.map((q) => (
              <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                <Td className="font-mono text-gray-600">{q.quotationNumber}</Td>
                <Td className="font-medium text-gray-700">{fmtCurrency(q.totalAmount)}</Td>
                <Td>
                  <Badge variant={statusVariant[q.status] || 'gray'}>
                    {statusLabel[q.status] || q.status}
                  </Badge>
                </Td>
                <Td className="text-gray-500">{fmtDate(q.validUntil)}</Td>
                <Td className="text-gray-500">{fmtDate(q.createdAt)}</Td>
                <Td>
                  <ActionLink to={`/quotations/${q.id}`} icon={Icons.eye} title="Xem chi tiết" />
                </Td>
              </tr>
            ))}
          </Table>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard label="Tổng báo giá" value={totalCount} color="blue" />
            <StatCard label="Đã duyệt" value={approvedCount} color="green" />
            <StatCard label="Đã từ chối" value={rejectedCount} color="red" />
            <StatCard label="Tỷ lệ chuyển đổi" value={`${conversionRate}%`} color="purple" />
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
