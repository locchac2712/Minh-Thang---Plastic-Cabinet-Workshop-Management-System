import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import {
  createSellerOrderPayment,
  fetchSellerOrderPayments,
  fetchSellerOrdersRaw,
  type CreateSellerOrderPaymentPayload,
  type SellerApiOrderStatus,
  type SellerOrderListDto,
  type SellerOrderPaymentDto,
} from '../sellerOrdersApi'
import {
  formatSellerPaymentRef,
  SellerPaymentProofThumb,
  sellerPaymentMethodLabel,
  sellerPaymentStatusClass,
  sellerPaymentStatusLabel,
} from '../sellerPaymentDisplay'
import { AppFilterBar, AppFilterField, AppFilterSelect, AppPagination } from '../../shared/ui/listing'
import '../../admin/pages/AdminUsersPage.css'
import './SellerPaymentsPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type OrderStatusFilter = 'all' | SellerApiOrderStatus

export function SellerPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState<SellerOrderListDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [activeOrder, setActiveOrder] = useState<SellerOrderListDto | null>(null)
  const [paymentTab, setPaymentTab] = useState<'history' | 'new'>('history')
  const [historyRows, setHistoryRows] = useState<SellerOrderPaymentDto[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [note, setNote] = useState('')
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [proofImageFile, setProofImageFile] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchSellerOrdersRaw({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page: pageIndex,
        size: pageSize,
      })
      setRows(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách đơn')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, statusFilter])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const loadHistory = useCallback(async (orderId: string) => {
    setHistoryLoading(true)
    setHistoryError(null)
    try {
      const items = await fetchSellerOrderPayments(orderId)
      setHistoryRows(items)
    } catch (e) {
      setHistoryRows([])
      setHistoryError(e instanceof Error ? e.message : 'Không tải được lịch sử thanh toán')
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!activeOrder || paymentTab !== 'history') return
    void loadHistory(activeOrder.id)
  }, [activeOrder, loadHistory, paymentTab])

  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.totalPayable, 0)
    const paid = rows.reduce((s, r) => s + r.paidAmount, 0)
    return { count: rows.length, total, paid, remaining: Math.max(0, total - paid) }
  }, [rows])

  const submitNewPayment = useCallback(async () => {
    if (!activeOrder) return
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      setSubmitError('Số tiền phải lớn hơn 0.')
      return
    }
    if (!paymentMethod.trim()) {
      setSubmitError('Vui lòng nhập phương thức thanh toán.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      let proof = proofImageUrl.trim() || null
      if (proofImageFile) {
        const accessToken = getAccessToken()
        if (!accessToken) throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        const uploadBody = new FormData()
        uploadBody.append('file', proofImageFile)
        const uploadRes = await fetch(`${API_BASE_URL}/api/uploadable/image`, {
          method: 'POST',
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: uploadBody,
        })
        const uploadEnvelope = (await uploadRes.json()) as {
          success: boolean
          message: string
          data?: { url?: string }
        }
        if (!uploadRes.ok || !uploadEnvelope.success || !uploadEnvelope.data?.url) {
          throw new Error(uploadEnvelope.message || 'Upload ảnh thất bại')
        }
        proof = uploadEnvelope.data.url
      }

      const payload: CreateSellerOrderPaymentPayload = {
        orderId: activeOrder.id,
        agencyId: activeOrder.agencyId,
        amount: amt,
        paymentMethod: paymentMethod.trim(),
        proofImage: proof,
        note: note.trim() || null,
      }
      await createSellerOrderPayment(payload)
      setAmount('')
      setPaymentMethod('')
      setNote('')
      setProofImageUrl('')
      setProofImageFile(null)
      setPaymentTab('history')
      await loadHistory(activeOrder.id)
      await loadOrders()
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Không tạo được thanh toán')
    } finally {
      setSubmitting(false)
    }
  }, [activeOrder, amount, loadHistory, loadOrders, note, paymentMethod, proofImageFile, proofImageUrl])

  return (
    <div className="th-seller-pay">
      <header className="th-seller-pay__head">
        <h1>Thanh toán & đối soát</h1>
        {loadError ? (
          <p className="th-seller-pay__error" role="alert">
            {loadError}
          </p>
        ) : null}
      </header>

      <ul className="th-seller-pay__stats">
        <li><span>Đơn (trang)</span><strong>{stats.count}</strong></li>
        <li><span>Tổng phải thu</span><strong>{formatVND(stats.total)}</strong></li>
        <li><span>Đã thu</span><strong>{formatVND(stats.paid)}</strong></li>
        <li><span>Còn lại</span><strong>{formatVND(stats.remaining)}</strong></li>
      </ul>

      <div className="th-seller-pay__toolbar">
        <AppFilterBar>
          <AppFilterField label="Trạng thái đơn">
            <AppFilterSelect
              value={statusFilter}
              onChangeValue={(value) => {
                setStatusFilter(value as OrderStatusFilter)
                setPageIndex(0)
              }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'Approved', label: 'Đã duyệt' },
                { value: 'Producing', label: 'Đang sản xuất' },
                { value: 'Done', label: 'Hoàn tất' },
                { value: 'Canceled', label: 'Đã huỷ' },
                { value: 'Pending', label: 'Chờ duyệt' },
                { value: 'Draft', label: 'Nháp' },
              ]}
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-seller-pay__loading">Đang tải dữ liệu…</p> : null}

      <div className="th-seller-pay__table-wrap">
        <table className="th-seller-pay-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Đại lý</th>
              <th>Trạng thái</th>
              <th className="th-seller-pay-table__num">Tổng phải thu</th>
              <th className="th-seller-pay-table__num">Đã thu</th>
              <th className="th-seller-pay-table__num">Còn lại</th>
              <th>Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr><td colSpan={7} className="th-seller-pay-table__empty">Không có đơn phù hợp.</td></tr>
            ) : rows.map((r) => (
              <tr
                key={r.id}
                className="th-seller-pay-table__row"
                onClick={() => {
                  setActiveOrder(r)
                  setPaymentTab('history')
                  setSubmitError(null)
                }}
              >
                <td><code>{r.id}</code></td>
                <td>{r.agencyName}</td>
                <td>{r.status}</td>
                <td className="th-seller-pay-table__num">{formatVND(r.totalPayable)}</td>
                <td className="th-seller-pay-table__num">{formatVND(r.paidAmount)}</td>
                <td className="th-seller-pay-table__num">{formatVND(Math.max(0, r.totalPayable - r.paidAmount))}</td>
                <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-seller-pay__pager"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          simple
          showSizeChanger={false}
          onPageIndexChange={setPageIndex}
        />
      ) : null}

      {activeOrder ? (
        <dialog open className="th-dlg" onClick={() => setActiveOrder(null)}>
          <section className="th-dlg__panel th-admin-users th-seller-pay__dlg" onClick={(e) => e.stopPropagation()}>
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon"><span className="material-symbols-outlined">payments</span></div>
              <h3 className="th-dlg__title">Thanh toán đơn {activeOrder.id}</h3>
              <button type="button" className="th-dlg__close" onClick={() => setActiveOrder(null)}><span className="material-symbols-outlined">close</span></button>
            </header>
            <div className="th-dlg__body">
              <div className="th-seller-pay__tabs">
                <button type="button" className={paymentTab === 'history' ? 'th-seller-pay__tab is-active' : 'th-seller-pay__tab'} onClick={() => setPaymentTab('history')}>Lịch sử</button>
                <button type="button" className={paymentTab === 'new' ? 'th-seller-pay__tab is-active' : 'th-seller-pay__tab'} onClick={() => setPaymentTab('new')}>Thanh toán mới</button>
              </div>

              {paymentTab === 'history' ? (
                <>
                  {historyError ? <p className="th-admin-users__api-error">{historyError}</p> : null}
                  {historyLoading ? <p className="th-seller-pay__loading">Đang tải lịch sử thanh toán…</p> : (
                    <div className="th-seller-pay__hist-wrap">
                      <table className="th-seller-pay__hist-table">
                        <thead><tr><th>Mã</th><th>Số tiền</th><th>Phương thức</th><th>Trạng thái</th><th>Ảnh</th><th>Ghi chú</th><th>Tạo lúc</th></tr></thead>
                        <tbody>
                          {historyRows.length === 0 ? <tr><td colSpan={7} className="th-seller-pay__hist-empty">Chưa có thanh toán.</td></tr> : historyRows.map((p) => (
                            <tr key={p.id}>
                              <td><code title={p.id}>{formatSellerPaymentRef(p.id)}</code></td>
                              <td className="th-seller-pay__num">{formatVND(p.amount)}</td>
                              <td>{sellerPaymentMethodLabel(p.paymentMethod)}</td>
                              <td>
                                <span className={sellerPaymentStatusClass(p.status)}>
                                  {sellerPaymentStatusLabel(p.status)}
                                </span>
                              </td>
                              <td>{p.proofImage ? <SellerPaymentProofThumb url={p.proofImage} /> : '—'}</td>
                              <td>{p.note || '—'}</td>
                              <td>{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="th-seller-pay__new">
                  {submitError ? <p className="th-admin-users__api-error">{submitError}</p> : null}
                  <div className="th-seller-pay__new-grid">
                    <label><span>Số tiền</span><input type="number" min={1} step={1000} value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
                    <label><span>Phương thức</span><input type="text" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} /></label>
                    <label className="full"><span>Link ảnh (optional)</span><input type="url" value={proofImageUrl} onChange={(e) => setProofImageUrl(e.target.value)} /></label>
                    <label className="full"><span>Hoặc upload ảnh</span><input type="file" accept="image/*" onChange={(e) => setProofImageFile(e.target.files?.[0] ?? null)} /></label>
                    <label className="full"><span>Ghi chú</span><textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
                  </div>
                  <div className="th-seller-pay__new-actions">
                    <button type="button" className="th-admin-users__btn-primary" disabled={submitting} onClick={() => void submitNewPayment()}>
                      {submitting ? 'Đang tạo…' : 'Tạo thanh toán'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </dialog>
      ) : null}
    </div>
  )
}

