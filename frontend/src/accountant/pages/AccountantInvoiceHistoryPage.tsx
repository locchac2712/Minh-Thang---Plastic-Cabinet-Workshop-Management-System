import { useCallback, useEffect, useId, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import {
  AppFilterBar,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import './AccountantInvoiceHistoryPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type InvoiceStatus = 'Draft' | 'Issued' | 'Canceled'
type InvoiceStatusFilter = 'all' | InvoiceStatus

type InvoiceRow = {
  id: string
  orderId: string | null
  invoiceNumber: string | null
  subTotal: number
  vatRate: number
  vatAmount: number
  totalAmount: number
  invoiceFileUrl: string | null
  status: InvoiceStatus
  note: string | null
  createdAt: string
  updatedAt: string
}

type InvoicePage = {
  content: InvoiceRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

async function issueInvoice(invoiceId: string, invoiceFileUrl: string): Promise<InvoiceRow> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(`${API_BASE_URL}/api/accountant/invoices/${encodeURIComponent(invoiceId)}/issued`, {
    method: 'PATCH',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: JSON.stringify({ invoiceFileUrl }),
  })
  const envelope = (await res.json()) as ApiEnvelope<InvoiceRow>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không phát hành được hóa đơn')
  }
  return envelope.data
}

async function cancelInvoice(invoiceId: string, note: string): Promise<InvoiceRow> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(`${API_BASE_URL}/api/accountant/invoices/${encodeURIComponent(invoiceId)}/cancel`, {
    method: 'PATCH',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: JSON.stringify({ note }),
  })
  const envelope = (await res.json()) as ApiEnvelope<InvoiceRow>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không hủy được hóa đơn')
  }
  return envelope.data
}

function statusLabel(s: InvoiceStatus): string {
  if (s === 'Draft') return 'Nháp'
  if (s === 'Issued') return 'Đã phát hành'
  return 'Đã hủy'
}

function statusClass(s: InvoiceStatus): string {
  const base = 'th-acc-ivh__pill'
  if (s === 'Issued') return `${base} ${base}--ok`
  if (s === 'Draft') return `${base} ${base}--wait`
  return `${base} ${base}--bad`
}

export function AccountantInvoiceHistoryPage() {
  const fid = useId()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all')
  const [orderIdFilter, setOrderIdFilter] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [activeRow, setActiveRow] = useState<InvoiceRow | null>(null)
  const [issueFileUrl, setIssueFileUrl] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [dialogError, setDialogError] = useState<string | null>(null)
  const [issuingId, setIssuingId] = useState<string | null>(null)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

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
      if (statusFilter !== 'all') q.set('status', statusFilter)
      if (orderIdFilter.trim()) q.set('order_id', orderIdFilter.trim())
      q.set('page', String(pageIndex))
      q.set('size', String(pageSize))
      const res = await fetch(`${API_BASE_URL}/api/accountant/invoices?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<InvoicePage>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được lịch sử hóa đơn')
      }
      setRows(envelope.data.content)
      setTotalPages(envelope.data.totalPages)
      setTotalElements(envelope.data.totalElements)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được lịch sử hóa đơn')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, orderIdFilter, pageIndex, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const handleIssue = useCallback(async (row: InvoiceRow) => {
    const clean = issueFileUrl.trim()
    if (!clean) {
      setDialogError('Vui lòng nhập URL file hóa đơn trước khi phát hành.')
      return
    }
    setIssuingId(row.id)
    try {
      const updated = await issueInvoice(row.id, clean)
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setActiveRow(updated)
      setDialogError(null)
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : 'Không phát hành được hóa đơn')
    } finally {
      setIssuingId(null)
    }
  }, [issueFileUrl])

  const handleCancel = useCallback(async (row: InvoiceRow) => {
    const clean = cancelNote.trim()
    if (!clean) {
      setDialogError('Vui lòng nhập lý do hủy hóa đơn.')
      return
    }
    setCancelingId(row.id)
    try {
      const updated = await cancelInvoice(row.id, clean)
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      setActiveRow(updated)
      setDialogError(null)
    } catch (e) {
      setDialogError(e instanceof Error ? e.message : 'Không hủy được hóa đơn')
    } finally {
      setCancelingId(null)
    }
  }, [cancelNote])

  return (
    <div className="th-acc-ivh">
      <header className="th-acc-ivh__head">
        <h1>Lịch sử xuất hóa đơn</h1>
        {loadError ? (
          <p className="th-acc-ivh__error" role="alert">
            {loadError}
          </p>
        ) : null}
      </header>

      <div className="th-acc-ivh__toolbar">
        <AppFilterBar>
          <AppFilterField label="Trạng thái" className="th-acc-ivh__field">
            <AppFilterSelect
              value={statusFilter}
              onChangeValue={(value) => {
                setStatusFilter(value as InvoiceStatusFilter)
                setPageIndex(0)
              }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'Draft', label: 'Nháp' },
                { value: 'Issued', label: 'Đã phát hành' },
                { value: 'Canceled', label: 'Đã hủy' },
              ]}
            />
          </AppFilterField>

          <AppFilterField label="Mã đơn hàng" className="th-acc-ivh__field">
            <AppFilterInput
              id={`${fid}-order`}
              placeholder="Nhập order_id..."
              value={orderIdFilter}
              onChangeValue={(value) => {
                setOrderIdFilter(value)
                setPageIndex(0)
              }}
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-acc-ivh__loading">Đang tải dữ liệu…</p> : null}

      <div className="th-acc-table-shell">
        <table className="th-acc-data-table">
          <thead>
            <tr>
              <th scope="col">Mã hóa đơn</th>
              <th scope="col">Mã đơn</th>
              <th scope="col">Số hóa đơn</th>
              <th scope="col">Trạng thái</th>
              <th scope="col" className="th-acc-data-table__num">
                Trước VAT
              </th>
              <th scope="col" className="th-acc-data-table__num">
                VAT
              </th>
              <th scope="col" className="th-acc-data-table__num">
                Tổng tiền
              </th>
              <th scope="col">Ghi chú</th>
              <th scope="col">Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="th-acc-data-table__empty">
                  Không có hóa đơn phù hợp bộ lọc.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  className="th-acc-data-table__row"
                  onClick={() => {
                    setActiveRow(r)
                    setIssueFileUrl(r.invoiceFileUrl ?? '')
                    setCancelNote(r.note ?? '')
                    setDialogError(null)
                  }}
                >
                  <td>
                    <code>{r.id}</code>
                  </td>
                  <td>
                    <code>{r.orderId || '—'}</code>
                  </td>
                  <td>{r.invoiceNumber || '—'}</td>
                  <td>
                    <span className={statusClass(r.status)}>{statusLabel(r.status)}</span>
                  </td>
                  <td className="th-acc-data-table__num">{formatVND(r.subTotal)}</td>
                  <td className="th-acc-data-table__num">
                    {formatVND(r.vatAmount)}
                    <span className="th-acc-ivh__vat-rate">({r.vatRate}%)</span>
                  </td>
                  <td className="th-acc-data-table__num th-acc-data-table__money">{formatVND(r.totalAmount)}</td>
                  <td>{r.note || '—'}</td>
                  <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-acc-ivh__pager"
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
            className="th-dlg__panel th-admin-users th-acc-ivh__modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết hóa đơn"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  receipt_long
                </span>
              </div>
              <h2 className="th-dlg__title">Chi tiết hóa đơn</h2>
              <button type="button" className="th-dlg__close" onClick={() => setActiveRow(null)} aria-label="Đóng">
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>

            <div className="th-dlg__body th-acc-dlg-body">
              <dl className="th-acc-modal-kv">
                <dt>Mã hóa đơn</dt>
                <dd>
                  <code>{activeRow.id}</code>
                </dd>
                <dt>Mã đơn</dt>
                <dd>{activeRow.orderId ? <code>{activeRow.orderId}</code> : '—'}</dd>
                <dt>Số hóa đơn</dt>
                <dd>{activeRow.invoiceNumber || '—'}</dd>
                <dt>Trạng thái</dt>
                <dd>
                  <span className={statusClass(activeRow.status)}>{statusLabel(activeRow.status)}</span>
                </dd>
                <dt>Tổng tiền</dt>
                <dd>{formatVND(activeRow.totalAmount)}</dd>
                <dt>File hóa đơn</dt>
                <dd>
                  {activeRow.invoiceFileUrl ? (
                    <a href={activeRow.invoiceFileUrl} target="_blank" rel="noreferrer">
                      Mở file hiện tại
                    </a>
                  ) : (
                    'Chưa có file'
                  )}
                </dd>
              </dl>

              <div className="th-acc-ivh__issue-form">
                <label htmlFor={`${fid}-issue-url`}>URL file hóa đơn để phát hành</label>
                <input
                  id={`${fid}-issue-url`}
                  type="url"
                  placeholder="https://..."
                  value={issueFileUrl}
                  onChange={(e) => setIssueFileUrl(e.target.value)}
                />
              </div>

              <div className="th-acc-ivh__issue-form">
                <label htmlFor={`${fid}-cancel-note`}>Lý do hủy hóa đơn</label>
                <input
                  id={`${fid}-cancel-note`}
                  type="text"
                  placeholder="Nhập lý do hủy..."
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                />
              </div>

              {dialogError ? <p className="th-acc-dialog-error th-acc-dialog-error--block">{dialogError}</p> : null}
            </div>

            <footer className="th-dlg__footer th-acc-ivh__modal-actions">
              <button
                type="button"
                className="th-admin-users__btn-ghost th-acc-ivh__btn-cancel"
                disabled={activeRow.status === 'Canceled' || issuingId === activeRow.id || cancelingId === activeRow.id}
                onClick={() => void handleCancel(activeRow)}
              >
                {cancelingId === activeRow.id ? 'Đang hủy…' : 'Hủy hóa đơn'}
              </button>
              <button
                type="button"
                className="th-admin-users__btn-primary th-acc-ivh__btn-issue"
                disabled={
                  activeRow.status !== 'Draft' || issuingId === activeRow.id || cancelingId === activeRow.id
                }
                onClick={() => void handleIssue(activeRow)}
              >
                {issuingId === activeRow.id ? 'Đang phát hành…' : 'Phát hành hóa đơn'}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}
    </div>
  )
}

