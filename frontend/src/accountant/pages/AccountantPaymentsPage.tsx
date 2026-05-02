import { useCallback, useEffect, useId, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { AppFilterBar, AppFilterField, AppFilterSelect, AppPagination } from '../../shared/ui/listing'
import './AccountantPaymentsPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type PaymentStatus = 'Pending' | 'Completed' | 'Failed'

type PaymentRow = {
  id: string
  orderId: string | null
  agencyId: string
  agencyName: string
  amount: number
  paymentMethod: string
  proofImage: string | null
  note: string | null
  status: PaymentStatus
  createdAt: string
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type PaymentPage = {
  content: PaymentRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

async function approvePayment(paymentId: string): Promise<PaymentRow> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/accountant/payments/${encodeURIComponent(paymentId)}/approve`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<PaymentRow>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không duyệt được phiếu nạp tiền')
  }
  return envelope.data
}

async function rejectPayment(paymentId: string, note: string): Promise<PaymentRow> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/accountant/payments/${encodeURIComponent(paymentId)}/reject`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify({ note }),
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<PaymentRow>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không từ chối được phiếu nạp tiền')
  }
  return envelope.data
}

function statusClass(s: PaymentStatus): string {
  if (s === 'Completed') return 'th-acc-pay__pill th-acc-pay__pill--ok'
  if (s === 'Failed') return 'th-acc-pay__pill th-acc-pay__pill--bad'
  return 'th-acc-pay__pill th-acc-pay__pill--wait'
}

export function AccountantPaymentsPage() {
  const fid = useId()
  const [status, setStatus] = useState<'' | PaymentStatus>('Pending')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [activeRow, setActiveRow] = useState<PaymentRow | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<null | {
    type: 'approve' | 'reject'
    row: PaymentRow
    note?: string
  }>(null)

  const load = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setRows([])
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const q = new URLSearchParams()
      if (status) q.set('status', status)
      q.set('page', String(pageIndex))
      q.set('size', String(pageSize))
      const res = await fetch(`${API_BASE_URL}/api/accountant/payments?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<PaymentPage>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được danh sách phiếu nạp tiền')
      }
      setRows(envelope.data.content)
      setTotalPages(envelope.data.totalPages)
      setTotalElements(envelope.data.totalElements)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách phiếu nạp tiền')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, status])

  useEffect(() => {
    void load()
  }, [load])

  const handleApprove = useCallback(
    async (row: PaymentRow) => {
      setApprovingId(row.id)
      try {
        const updated = await approvePayment(row.id)
        setRows((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        setActiveRow(updated)
        setDialogError(null)
      } catch (e) {
        setDialogError(e instanceof Error ? e.message : 'Không duyệt được phiếu nạp tiền')
      } finally {
        setApprovingId(null)
      }
    },
    [],
  )

  const handleReject = useCallback(async (row: PaymentRow, note: string) => {
    const clean = note.trim()
    if (!clean) {
      setDialogError('Lý do từ chối không được để trống.')
      return
    }
    setRejectingId(row.id)
    try {
      const updated = await rejectPayment(row.id, clean)
      setRows((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
      setActiveRow(updated)
      setDialogError(null)
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : 'Không từ chối được phiếu nạp tiền')
    } finally {
      setRejectingId(null)
    }
  }, [])

  return (
    <div className="th-acc-pay">
      <header className="th-acc-pay__header">
        <h1 className="th-acc-pay__title">Xác nhận nạp tiền</h1>
      </header>

      {loadError ? (
        <p className="th-acc-pay__error" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="th-acc-pay__toolbar">
        <AppFilterBar>
          <AppFilterField label="Trạng thái" className="th-acc-pay__field">
            <AppFilterSelect
              value={status}
              onChangeValue={(value) => {
                setStatus(value as '' | PaymentStatus)
                setPageIndex(0)
              }}
              options={[
                { value: '', label: 'Tất cả' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Failed', label: 'Failed' },
              ]}
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-acc-pay__loading">Đang tải dữ liệu…</p> : null}

      <div className="th-acc-table-shell">
        <table className="th-acc-data-table">
          <thead>
            <tr>
              <th scope="col">Mã phiếu</th>
              <th scope="col">Đơn</th>
              <th scope="col">Đại lý</th>
              <th scope="col" className="th-acc-data-table__num">
                Số tiền
              </th>
              <th scope="col">Phương thức</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Ghi chú</th>
              <th scope="col">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="th-acc-data-table__empty">
                  Không có phiếu khớp bộ lọc.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="th-acc-data-table__row"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setActiveRow(r)
                    setRejectNote(r.note ?? '')
                      setDialogError(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      setActiveRow(r)
                      setRejectNote(r.note ?? '')
                        setDialogError(null)
                    }
                  }}
                >
                  <td>
                    <code>{r.id}</code>
                  </td>
                  <td>{r.orderId ? <code>{r.orderId}</code> : '—'}</td>
                  <td>{r.agencyName}</td>
                  <td className="th-acc-data-table__num">{formatVND(r.amount)}</td>
                  <td>{r.paymentMethod}</td>
                  <td>
                    <span className={statusClass(r.status)}>{r.status}</span>
                  </td>
                  <td className="th-acc-pay__note">{r.note ?? '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-acc-pay__pager"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          simple
          showSizeChanger={false}
          onPageIndexChange={setPageIndex}
        />
      ) : null}

      {activeRow ? (
        <dialog open className="th-dlg" onClick={() => setActiveRow(null)}>
          <section
            className="th-dlg__panel th-admin-users th-acc-pay__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết phiếu nạp tiền"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  receipt_long
                </span>
              </div>
              <h2 className="th-dlg__title">Chi tiết phiếu nạp tiền</h2>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => setActiveRow(null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>
            <div className="th-dlg__body th-acc-dlg-body">
            <dl className="th-acc-modal-kv">
              <dt>Mã phiếu</dt>
              <dd>
                <code>{activeRow.id}</code>
              </dd>
              <dt>Đại lý</dt>
              <dd>{activeRow.agencyName}</dd>
              <dt>Đơn hàng</dt>
              <dd>{activeRow.orderId ? <code>{activeRow.orderId}</code> : '—'}</dd>
              <dt>Số tiền</dt>
              <dd>{formatVND(activeRow.amount)}</dd>
              <dt>Phương thức</dt>
              <dd>{activeRow.paymentMethod}</dd>
              <dt>Trạng thái</dt>
              <dd>
                <span className={statusClass(activeRow.status)}>{activeRow.status}</span>
              </dd>
              <dt>Thời gian</dt>
              <dd>{new Date(activeRow.createdAt).toLocaleString('vi-VN')}</dd>
            </dl>
            <div className="th-acc-pay__modal-proof">
              <p className="th-acc-pay__modal-label">Ảnh chứng từ</p>
              {activeRow.proofImage ? (
                <img src={activeRow.proofImage} alt="Ảnh chứng từ nạp tiền" loading="lazy" />
              ) : (
                <p className="th-acc-pay__muted">Không có ảnh chứng từ.</p>
              )}
            </div>
            <div className="th-acc-pay__modal-note">
              <label htmlFor={`${fid}-reject-note`}>Ghi chú / Lý do từ chối</label>
              <textarea
                id={`${fid}-reject-note`}
                rows={3}
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Nhập lý do khi từ chối..."
              />
            </div>
            </div>
            <footer className="th-dlg__footer th-acc-pay__modal-actions">
              {dialogError ? <p className="th-acc-dialog-error">{dialogError}</p> : null}
              <button
                type="button"
                className="th-admin-users__btn-ghost th-acc-pay__reject-btn"
                disabled={activeRow.status !== 'Pending' || approvingId === activeRow.id || rejectingId === activeRow.id}
                onClick={() =>
                  setConfirmAction({
                    type: 'reject',
                    row: activeRow,
                    note: rejectNote.trim(),
                  })
                }
              >
                {rejectingId === activeRow.id ? 'Đang từ chối…' : 'Từ chối'}
              </button>
              <button
                type="button"
                className="th-admin-users__btn-primary th-acc-pay__approve-btn"
                disabled={activeRow.status !== 'Pending' || approvingId === activeRow.id || rejectingId === activeRow.id}
                onClick={() => setConfirmAction({ type: 'approve', row: activeRow })}
              >
                {approvingId === activeRow.id ? 'Đang duyệt…' : 'Duyệt'}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}

      {confirmAction ? (
        <dialog open className="th-dlg th-dlg--confirm" onClick={() => setConfirmAction(null)}>
          <section
            className="th-dlg__panel th-admin-users th-acc-pay__confirm"
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận thao tác"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  help
                </span>
              </div>
              <h3 className="th-dlg__title">
              {confirmAction.type === 'approve' ? 'Xác nhận duyệt phiếu?' : 'Xác nhận từ chối phiếu?'}
              </h3>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => setConfirmAction(null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>
            <div className="th-dlg__body th-acc-dlg-body">
            <p>
              Mã: <code>{confirmAction.row.id}</code>
            </p>
            <p>Đại lý: {confirmAction.row.agencyName}</p>
            {confirmAction.type === 'reject' ? (
              <p>
                Lý do: <strong>{confirmAction.note || '(trống)'}</strong>
              </p>
            ) : null}
            </div>
            <div className="th-acc-pay__confirm-actions">
              <button type="button" className="th-admin-users__btn-ghost" onClick={() => setConfirmAction(null)}>
                Hủy
              </button>
              <button
                type="button"
                className={
                  confirmAction.type === 'approve'
                    ? 'th-admin-users__btn-primary th-acc-pay__approve-btn'
                    : 'th-admin-users__btn-ghost th-acc-pay__reject-btn'
                }
                onClick={() => {
                  const action = confirmAction
                  setConfirmAction(null)
                  if (action.type === 'approve') {
                    void handleApprove(action.row)
                  } else {
                    void handleReject(action.row, action.note ?? '')
                  }
                }}
              >
                Xác nhận
              </button>
            </div>
          </section>
        </dialog>
      ) : null}
    </div>
  )
}

