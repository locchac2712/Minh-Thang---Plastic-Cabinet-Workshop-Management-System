import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/DashboardLayout'
import { quotationApi } from '../../services/api'
import { PageHeader, DetailGrid, Card, Table, Td, Badge, Btn, LinkBtn, Loading, Icons, fmtCurrency, fmtDate } from '../../components/ui'

const statusVariant = { DRAFT: 'gray', SENT: 'blue', APPROVED: 'green', REJECTED: 'red', EXPIRED: 'yellow' }
const statusLabel = { DRAFT: 'Nháp', SENT: 'Đã gửi', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', EXPIRED: 'Hết hạn' }

export default function QuotationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotation, setQuotation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchQuotation = () => {
    quotationApi.getById(id)
      .then((res) => setQuotation(res.data.data))
      .catch(() => navigate('/quotations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchQuotation() }, [id])

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true)
      await quotationApi.changeStatus(id, newStatus)
      fetchQuotation()
    } catch { /* ignore */ }
    finally { setActionLoading(false) }
  }

  if (loading) {
    return <DashboardLayout><Loading /></DashboardLayout>
  }

  if (!quotation) return null

  return (
    <DashboardLayout>
      <PageHeader title="Chi tiết báo giá">
        <LinkBtn to="/quotations" variant="ghost">{Icons.back} Quay lại</LinkBtn>
        {quotation.status === 'DRAFT' && (
          <>
            <LinkBtn to={`/quotations/${id}/edit`} variant="secondary">{Icons.edit} Sửa</LinkBtn>
            <Btn variant="purple" onClick={() => handleStatusChange('SENT')} disabled={actionLoading}>Gửi báo giá</Btn>
          </>
        )}
        {quotation.status === 'SENT' && (
          <>
            <Btn onClick={() => handleStatusChange('APPROVED')} disabled={actionLoading}>Duyệt</Btn>
            <Btn variant="danger" onClick={() => handleStatusChange('REJECTED')} disabled={actionLoading}>Từ chối</Btn>
          </>
        )}
      </PageHeader>

      <DetailGrid items={[
        { label: 'Số báo giá', value: quotation.quotationNumber },
        { label: 'Trạng thái', value: <Badge variant={statusVariant[quotation.status] || 'gray'}>{statusLabel[quotation.status] || quotation.status}</Badge> },
        { label: 'Khách hàng', value: quotation.customer?.name },
        { label: 'NV bán hàng', value: quotation.salesStaff?.fullName },
        { label: 'Hiệu lực đến', value: fmtDate(quotation.validUntil) },
        { label: 'Ngày tạo', value: fmtDate(quotation.createdAt) },
        ...(quotation.notes ? [{ label: 'Ghi chú', value: quotation.notes }] : []),
      ]} />

      <Card className="mt-6 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Danh sách sản phẩm</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['#', 'Sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền'].map((h, i) => (
                  <th key={i} className="px-5 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 bg-gray-50/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(quotation.items || []).map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-gray-50/50 transition-colors">
                  <Td className="text-gray-500">{idx + 1}</Td>
                  <Td className="font-medium text-gray-900">{item.product?.name || '—'}</Td>
                  <Td className="text-gray-700">{item.quantity}</Td>
                  <Td className="text-gray-700">{fmtCurrency(item.unitPrice)}</Td>
                  <Td className="font-medium text-gray-900">{fmtCurrency(item.totalPrice)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <div className="text-right">
            <span className="text-sm text-gray-500">Tổng cộng: </span>
            <span className="text-lg font-semibold text-gray-900">{fmtCurrency(quotation.totalAmount)}</span>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  )
}
