import { useCallback, useEffect, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { AppPagination } from '../../shared/ui/listing'
import './AccountantInvoicesPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type InvoiceEligibleOrder = {
  id: string
  agencyId: string
  agencyName: string
  totalPayable: number
  paidAmount: number
  status: string
  createdAt: string
}

type InvoiceEligibleOrderPage = {
  content: InvoiceEligibleOrder[]
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

type CreateInvoicePayload = {
  orderId: string
  vatRate: number
}

type CreateInvoiceResult = {
  id: string
  status: string
}

export function AccountantInvoicesPage() {
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState<InvoiceEligibleOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [creatingId, setCreatingId] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

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
      q.set('invoiced', 'false')
      q.set('page', String(pageIndex))
      q.set('size', String(pageSize))
      const res = await fetch(`${API_BASE_URL}/api/accountant/invoices/eligible-orders?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<InvoiceEligibleOrderPage>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được danh sách hóa đơn')
      }
      setRows(envelope.data.content)
      setTotalPages(envelope.data.totalPages)
      setTotalElements(envelope.data.totalElements)
      setNotice(null)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách hóa đơn')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreateInvoice = useCallback(
    async (orderId: string) => {
      const accessToken = getAccessToken()
      if (!accessToken) {
        setActionError('Thiếu access token. Vui lòng đăng nhập lại.')
        return
      }
      setCreatingId(orderId)
      setActionError(null)
      setNotice(null)
      try {
        const payload: CreateInvoicePayload = {
          orderId,
          vatRate: 8,
        }
        const res = await fetch(`${API_BASE_URL}/api/accountant/invoices`, {
          method: 'POST',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify(payload),
        })
        const envelope = (await res.json()) as ApiEnvelope<CreateInvoiceResult>
        if (!res.ok || !envelope.success || !envelope.data) {
          throw new Error(envelope.message || 'Không tạo được hóa đơn')
        }
        setNotice(`Đã tạo hóa đơn ${envelope.data.id} (${envelope.data.status}).`)
        await load()
      } catch (e) {
        setActionError(e instanceof Error ? e.message : 'Không tạo được hóa đơn')
      } finally {
        setCreatingId(null)
      }
    },
    [load],
  )

  return (
    <div className="th-acc-inv">
      <header className="th-acc-inv__head">
        <h1 className="th-acc-inv__title">Hóa đơn VAT điện tử</h1>
        {loadError ? (
          <p className="th-acc-inv__error" role="alert">
            {loadError}
          </p>
        ) : null}
        {actionError ? (
          <p className="th-acc-inv__error" role="alert">
            {actionError}
          </p>
        ) : null}
        {notice ? <p className="th-acc-inv__notice">{notice}</p> : null}
      </header>

      {loading ? <p className="th-acc-inv__loading">Đang tải dữ liệu…</p> : null}

      <div className="th-acc-table-shell">
        <table className="th-acc-data-table">
          <thead>
            <tr>
              <th scope="col">Mã đơn</th>
              <th scope="col">Đại lý</th>
              <th scope="col">Trạng thái đơn</th>
              <th scope="col" className="th-acc-data-table__num">
                Tổng phải thu
              </th>
              <th scope="col" className="th-acc-data-table__num">
                Đã thu
              </th>
              <th scope="col" className="th-acc-data-table__num">
                Còn lại
              </th>
              <th scope="col">Tạo lúc</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="th-acc-data-table__empty">
                  Không có đơn chưa xuất hóa đơn.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <code>{r.id}</code>
                  </td>
                  <td>
                    <div>{r.agencyName}</div>
                    <code className="th-acc-inv__sub">{r.agencyId}</code>
                  </td>
                  <td>{r.status}</td>
                  <td className="th-acc-data-table__num">{formatVND(r.totalPayable)}</td>
                  <td className="th-acc-data-table__num">{formatVND(r.paidAmount)}</td>
                  <td className="th-acc-data-table__num">{formatVND(Math.max(0, r.totalPayable - r.paidAmount))}</td>
                  <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <button
                      type="button"
                      className="th-acc-inv__create-btn"
                      disabled={creatingId === r.id}
                      onClick={() => void handleCreateInvoice(r.id)}
                    >
                      {creatingId === r.id ? 'Đang tạo...' : 'Tạo invoice'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-acc-inv__pager"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          simple
          showSizeChanger={false}
          onPageIndexChange={setPageIndex}
        />
      ) : null}
    </div>
  )
}

