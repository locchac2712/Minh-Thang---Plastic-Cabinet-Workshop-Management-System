import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { accountantPaths } from '../config/accountantPaths'
import './AccountantPurchaseOrderDetailPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type PurchaseStatus = 'Pending' | 'Recieved' | 'Canceled'
type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial'

type PurchaseItem = {
  id: string
  materialId: string
  materialCode: string
  materialName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

type PurchaseDetail = {
  id: string
  supplierId: string
  supplierName: string
  totalAmount: number
  paidAmount: number
  paymentStatus: PaymentStatus
  status: PurchaseStatus
  items: PurchaseItem[]
  createdAt: string
  updatedAt: string
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

function statusLabel(s: PurchaseStatus): string {
  if (s === 'Pending') return 'Chờ xử lý'
  if (s === 'Recieved') return 'Đã nhận'
  return 'Đã hủy'
}

function paymentLabel(s: PaymentStatus): string {
  if (s === 'Unpaid') return 'Chưa thanh toán'
  if (s === 'Partial') return 'Thanh toán một phần'
  return 'Đã thanh toán'
}

function pillClass(kind: 'status' | 'payment', value: PurchaseStatus | PaymentStatus): string {
  const base = 'th-acc-po-detail__pill'
  if (kind === 'status') {
    if (value === 'Pending') return `${base} ${base}--wait`
    if (value === 'Recieved') return `${base} ${base}--ok`
    return `${base} ${base}--bad`
  }
  if (value === 'Paid') return `${base} ${base}--ok`
  if (value === 'Partial') return `${base} ${base}--part`
  return `${base} ${base}--bad`
}

export function AccountantPurchaseOrderDetailPage() {
  const { purchaseId } = useParams<{ purchaseId: string }>()
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [detail, setDetail] = useState<PurchaseDetail | null>(null)

  const loadDetail = useCallback(async () => {
    if (!purchaseId) {
      setDetail(null)
      setLoadError('Thiếu mã đơn mua.')
      return
    }
    const accessToken = getAccessToken()
    if (!accessToken) {
      setDetail(null)
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/accountant/purchases/${purchaseId}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<PurchaseDetail>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được chi tiết đơn mua')
      }
      setDetail({
        ...envelope.data,
        items: envelope.data.items ?? [],
      })
    } catch (e) {
      setDetail(null)
      setLoadError(e instanceof Error ? e.message : 'Không tải được chi tiết đơn mua')
    } finally {
      setLoading(false)
    }
  }, [purchaseId])

  useEffect(() => {
    void loadDetail()
  }, [loadDetail])

  const remaining = useMemo(() => {
    if (!detail) return 0
    return Math.max(0, detail.totalAmount - detail.paidAmount)
  }, [detail])

  return (
    <div className="th-acc-po-detail">
      <nav className="th-acc-po-detail__breadcrumb" aria-label="Breadcrumb">
        <Link to={accountantPaths.root}>Kế toán</Link>
        <span aria-hidden>/</span>
        <Link to={accountantPaths.purchasing.root}>Mua hàng</Link>
        <span aria-hidden>/</span>
        <Link to={accountantPaths.purchasing.orders}>Đơn mua (PO)</Link>
        <span aria-hidden>/</span>
        <span>Chi tiết</span>
      </nav>

      <header className="th-acc-po-detail__head">
        <Link className="th-acc-po-detail__back" to={accountantPaths.purchasing.orders}>
          <span className="material-symbols-outlined" aria-hidden>
            arrow_back
          </span>
          Quay lại danh sách PO
        </Link>
        <h1>Chi tiết đơn mua</h1>
      </header>

      {loading ? <p className="th-acc-po-detail__loading">Đang tải dữ liệu…</p> : null}
      {loadError ? (
        <p className="th-acc-po-detail__error" role="alert">
          {loadError}
        </p>
      ) : null}

      {detail ? (
        <>
          <section className="th-acc-po-detail__summary">
            <article className="th-acc-po-detail__card">
              <span>Mã PO</span>
              <code>{detail.id}</code>
            </article>
            <article className="th-acc-po-detail__card">
              <span>Nhà cung cấp</span>
              <strong>{detail.supplierName}</strong>
              <code>{detail.supplierId}</code>
            </article>
            <article className="th-acc-po-detail__card">
              <span>Trạng thái PO</span>
              <span className={pillClass('status', detail.status)}>{statusLabel(detail.status)}</span>
            </article>
            <article className="th-acc-po-detail__card">
              <span>Thanh toán</span>
              <span className={pillClass('payment', detail.paymentStatus)}>{paymentLabel(detail.paymentStatus)}</span>
            </article>
            <article className="th-acc-po-detail__card">
              <span>Tổng tiền</span>
              <strong>{formatVND(detail.totalAmount)}</strong>
            </article>
            <article className="th-acc-po-detail__card">
              <span>Đã trả / Còn lại</span>
              <strong>
                {formatVND(detail.paidAmount)} / {formatVND(remaining)}
              </strong>
            </article>
            <article className="th-acc-po-detail__card">
              <span>Tạo lúc</span>
              <strong>{new Date(detail.createdAt).toLocaleString('vi-VN')}</strong>
            </article>
            <article className="th-acc-po-detail__card">
              <span>Cập nhật</span>
              <strong>{new Date(detail.updatedAt).toLocaleString('vi-VN')}</strong>
            </article>
          </section>

          <section className="th-acc-po-detail__items-wrap">
            <h2>Danh sách vật tư</h2>
            <div className="th-acc-table-shell">
              <table className="th-acc-data-table">
                <thead>
                  <tr>
                    <th scope="col">Mã dòng</th>
                    <th scope="col">Mã vật tư</th>
                    <th scope="col">Tên vật tư</th>
                    <th scope="col" className="th-acc-data-table__num">
                      SL
                    </th>
                    <th scope="col" className="th-acc-data-table__num">
                      Đơn giá
                    </th>
                    <th scope="col" className="th-acc-data-table__num">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="th-acc-data-table__empty">
                        Đơn mua chưa có dòng vật tư.
                      </td>
                    </tr>
                  ) : (
                    detail.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <code>{item.id}</code>
                        </td>
                        <td>
                          <code>{item.materialCode}</code>
                          <div className="th-acc-po-detail__subcode">{item.materialId}</div>
                        </td>
                        <td>{item.materialName}</td>
                        <td className="th-acc-data-table__num">{item.quantity}</td>
                        <td className="th-acc-data-table__num">{formatVND(item.unitPrice)}</td>
                        <td className="th-acc-data-table__num th-acc-data-table__money">{formatVND(item.lineTotal)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}

