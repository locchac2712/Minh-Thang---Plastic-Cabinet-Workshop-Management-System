import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { PAGE_SIZE_OPTIONS } from '../../admin/catalog/productModel'
import { sellerPaths } from '../config/sellerPaths'
import {
  fetchSellerQuotations,
  type SellerQuotationListDto,
  type SellerQuotationStatus,
} from '../sellerQuotationsApi'
import type { SellerApiOrderStatus } from '../sellerOrdersApi'
import '../../admin/pages/AdminUsersPage.css'
import './SellerQuotationsPage.css'

type StatusFilter = 'all' | SellerQuotationStatus

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Draft', label: 'Nháp' },
  { id: 'Pending', label: 'Chờ duyệt' },
  { id: 'Approved', label: 'Đã duyệt' },
  { id: 'Rejected', label: 'Từ chối' },
]

const QUOTATION_BADGE_CLASS: Record<SellerQuotationStatus, string> = {
  Draft: 'th-seller-qt__badge--draft',
  Pending: 'th-seller-qt__badge--pending',
  Approved: 'th-seller-qt__badge--approved',
  Rejected: 'th-seller-qt__badge--rejected',
}

function orderStatusLabel(s: SellerApiOrderStatus | string): string {
  const m: Record<string, string> = {
    Draft: 'Nháp',
    Pending: 'Chờ duyệt',
    Approved: 'Đã duyệt',
    Producing: 'Sản xuất',
    Done: 'Hoàn tất',
    Canceled: 'Đã hủy',
  }
  return m[s] ?? s
}

function shortId(id: string): string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id) ? `${id.slice(0, 8)}…` : id
}

/** Danh sách báo giá */
export function SellerQuotationsPage() {
  const fid = useId()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const [rows, setRows] = useState<SellerQuotationListDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const apiStatus: SellerQuotationStatus | undefined =
    statusFilter === 'all' ? undefined : statusFilter

  useEffect(() => {
    setPageIndex(0)
  }, [statusFilter])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await fetchSellerQuotations({
          page: pageIndex,
          size: pageSize,
          status: apiStatus,
        })
        if (cancelled) return
        setRows(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } catch (e) {
        if (cancelled) return
        setRows([])
        setTotalPages(0)
        setTotalElements(0)
        setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách báo giá')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pageIndex, pageSize, apiStatus])

  const rangeLabel = useMemo(() => {
    if (totalElements === 0) return '0 kết quả'
    const start = pageIndex * pageSize + 1
    const end = Math.min((pageIndex + 1) * pageSize, totalElements)
    return `${start}–${end} / ${totalElements}`
  }, [pageIndex, pageSize, totalElements])

  const openQuotation = useCallback(
    (row: SellerQuotationListDto) => {
      navigate(sellerPaths.quotation(row.id))
    },
    [navigate],
  )

  return (
    <div className="th-seller-qt">
      <header className="th-seller-qt__head">
        <div className="th-seller-qt__heading">
          <div className="th-seller-qt__title-row">
            <span className="material-symbols-outlined th-seller-qt__title-icon" aria-hidden>
              request_quote
            </span>
            <div>
              <h1 className="th-seller-qt__title">Báo giá</h1>
            </div>
          </div>
          <Link to={sellerPaths.quotationNew} className="th-seller-qt__btn-create">
            <span className="material-symbols-outlined" aria-hidden>
              add
            </span>
            Tạo báo giá
          </Link>
        </div>
        {loadError ? (
          <p className="th-seller-qt__error" role="alert">
            {loadError}
          </p>
        ) : null}
      </header>

      <div className="th-seller-qt__toolbar">
        <div className="th-seller-qt__tabs" role="tablist" aria-label="Lọc trạng thái báo giá">
          {STATUS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={statusFilter === t.id}
              className={`th-seller-qt__tab${statusFilter === t.id ? ' is-active' : ''}`}
              onClick={() => setStatusFilter(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label htmlFor={`${fid}-size`} className="th-seller-qt__size">
          <span>Số dòng / trang</span>
          <select
            id={`${fid}-size`}
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])
              setPageIndex(0)
            }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="th-seller-qt__table-wrap">
        <table className="th-seller-qt-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Đại lý</th>
              <th>Trạng thái báo giá</th>
              <th>Trạng thái đơn</th>
              <th className="th-seller-qt-table__num">Tổng phải thu</th>
              <th>Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="th-seller-qt-table__empty">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="th-seller-qt-table__empty">
                  Không có báo giá phù hợp.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="th-seller-qt-table__row"
                  onClick={() => openQuotation(row)}
                >
                  <td>
                    <code className="th-seller-qt__mono">{shortId(row.id)}</code>
                  </td>
                  <td>{row.agencyName}</td>
                  <td>
                    <span
                      className={`th-seller-qt__badge ${QUOTATION_BADGE_CLASS[row.quotationStatus]}`}
                    >
                      {STATUS_TABS.find((x) => x.id === row.quotationStatus)?.label ?? row.quotationStatus}
                    </span>
                  </td>
                  <td>{orderStatusLabel(row.status)}</td>
                  <td className="th-seller-qt-table__num">{formatVND(row.totalPayable)}</td>
                  <td>
                    {row.createdAt.includes('T')
                      ? row.createdAt.replace('T', ' ').slice(0, 16)
                      : row.createdAt}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 || totalElements > 0 ? (
        <footer className="th-seller-qt__pager">
          <span className="th-seller-qt__range">{rangeLabel}</span>
          <div className="th-seller-qt__pager-btns">
            <button
              type="button"
              disabled={loading || pageIndex <= 0}
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            >
              Trước
            </button>
            <button
              type="button"
              disabled={loading || pageIndex >= totalPages - 1}
              onClick={() => setPageIndex((p) => p + 1)}
            >
              Sau
            </button>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
