import { useParams } from 'react-router-dom'
import { SellerOrderDetailInner } from './SellerOrderDetailPage'

/** Chi tiết báo giá NVBH — cùng nội dung đơn, tiến độ 4 bước (Draft / Pending / Approved / Rejected). */
export function SellerQuotationDetailPage() {
  const { quotationId: quotationIdParam } = useParams<{ quotationId: string }>()
  const orderCode = quotationIdParam ? decodeURIComponent(quotationIdParam) : ''
  return <SellerOrderDetailInner variant="quotation" orderCode={orderCode} />
}
