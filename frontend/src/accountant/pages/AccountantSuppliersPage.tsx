import { useCallback, useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { PAGE_SIZE_OPTIONS } from '../../admin/catalog/productModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { accountantPaths } from '../config/accountantPaths'
import '../../admin/styles/adminListToolbar.css'
import './AccountantSuppliersPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type SupplierRow = {
  id: string
  name: string
  phone: string | null
  address: string | null
  taxCode: string | null
  totalDebt: number
  isActive: boolean
  createdAt: string
}

type SupplierPage = {
  content: SupplierRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode?: number
  message: string
  data?: T
}

type HasDebtFilter = 'all' | 'debt' | 'clear'

function hasDebtToParam(f: HasDebtFilter): boolean | undefined {
  if (f === 'debt') return true
  if (f === 'clear') return false
  return undefined
}

function isSupplierPageData(x: unknown): x is SupplierPage {
  return (
    x !== null &&
    typeof x === 'object' &&
    Array.isArray((x as SupplierPage).content) &&
    'totalElements' in (x as object)
  )
}

/** Giống admin: thân trang trần hoặc bọc ApiResponse. */
function unwrapSupplierPageBody(raw: unknown): SupplierPage {
  if (isSupplierPageData(raw)) return raw
  const w = raw as ApiEnvelope<SupplierPage>
  if (w?.success && w.data && isSupplierPageData(w.data)) return w.data
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (isSupplierPageData(d)) return d
  }
  throw new Error('Phản hồi danh sách NCC không hợp lệ (thiếu content / totalElements).')
}

function formatShortAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short' })
  } catch {
    return iso
  }
}

export function AccountantSuppliersPage() {
  const fid = useId()
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterHasDebt, setFilterHasDebt] = useState<HasDebtFilter>('all')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(20)

  const [rows, setRows] = useState<SupplierRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 380)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch, filterHasDebt, pageSize])

  const load = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      const accessToken = getAccessToken()
      if (!accessToken) {
        setRows([])
        setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
        return
      }
      setLoading(true)
      setLoadError(null)
      let aborted = false
      try {
        const q = new URLSearchParams()
        if (debouncedSearch) q.set('search', debouncedSearch)
        const hd = hasDebtToParam(filterHasDebt)
        if (hd === true) q.set('has_debt', 'true')
        if (hd === false) q.set('has_debt', 'false')
        q.set('page', String(pageIndex))
        q.set('size', String(pageSize))
        const res = await fetch(`${API_BASE_URL}/api/accountant/suppliers?${q.toString()}`, {
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          signal: options?.signal,
        })
        const body = await res.json().catch(() => null)
        if (!res.ok) {
          const msg =
            body && typeof body === 'object' && 'message' in body
              ? String((body as { message?: string }).message ?? res.statusText)
              : res.statusText
          throw new Error(msg || 'Không tải được danh sách NCC')
        }
        const data = unwrapSupplierPageBody(body)
        setRows(data.content)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          aborted = true
          return
        }
        setRows([])
        setTotalPages(0)
        setTotalElements(0)
        setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách NCC')
      } finally {
        if (!aborted) setLoading(false)
      }
    },
    [debouncedSearch, filterHasDebt, pageIndex, pageSize],
  )

  useEffect(() => {
    const ac = new AbortController()
    void load({ signal: ac.signal })
    return () => ac.abort()
  }, [load])

  const rangeStart = totalElements === 0 ? 0 : pageIndex * pageSize + 1
  const rangeEnd = totalElements === 0 ? 0 : Math.min((pageIndex + 1) * pageSize, totalElements)
  const filtersApplied = filterHasDebt !== 'all' || debouncedSearch.length > 0

  const clearFilters = useCallback(() => {
    setFilterHasDebt('all')
    setSearchInput('')
    setDebouncedSearch('')
  }, [])

  return (
    <div className="th-acc-sup">
      <header className="th-acc-sup__header">
        <h1 className="th-acc-sup__title">Nhà cung cấp</h1>
        {loadError ? (
          <p className="th-admin-users__api-error" role="alert" style={{ margin: 0 }}>
            {loadError}
          </p>
        ) : null}
      </header>

      <div className="th-admin-list-toolbar__head th-acc-sup__toolbar-wrap">
        <div className="th-admin-list-toolbar__bar">
          <label className="th-admin-list-toolbar__search" htmlFor={`${fid}-q`}>
            <span className="material-symbols-outlined th-admin-list-toolbar__search-icon" aria-hidden>
              search
            </span>
            <span className="th-admin-list-toolbar-visually-hidden">Tìm theo tên NCC</span>
            <input
              id={`${fid}-q`}
              type="search"
              className="th-admin-list-toolbar__search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên…"
              autoComplete="off"
              disabled={loading}
            />
          </label>

          <label className="th-admin-list-toolbar__filter">
            <span className="th-admin-list-toolbar__filter-label">Công nợ</span>
            <select
              className="th-admin-list-toolbar__filter-select"
              value={filterHasDebt}
              onChange={(e) => setFilterHasDebt(e.target.value as HasDebtFilter)}
              disabled={loading}
            >
              <option value="all">Tất cả</option>
              <option value="debt">Còn nợ</option>
              <option value="clear">Hết nợ</option>
            </select>
          </label>

          {filtersApplied ? (
            <button
              type="button"
              className="th-admin-list-toolbar__clear"
              onClick={clearFilters}
              disabled={loading}
            >
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
              Xóa lọc
            </button>
          ) : null}
        </div>
      </div>

      <div className="th-acc-table-shell">
        <table className="th-acc-data-table">
          <thead>
            <tr>
              <th scope="col">Tên NCC</th>
              <th scope="col">MST</th>
              <th scope="col">Điện thoại</th>
              <th scope="col">Địa chỉ</th>
              <th scope="col" className="th-acc-data-table__num">
                Tổng nợ
              </th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="th-acc-data-table__empty">
                  Đang tải…
                </td>
              </tr>
            )}
            {!loading && totalElements === 0 && (
              <tr>
                <td colSpan={7} className="th-acc-data-table__empty">
                  Không có NCC phù hợp bộ lọc.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={accountantPaths.masters.supplierDetail(r.id)} className="th-acc-sup__name-link">
                      <div className="th-acc-sup__name">{r.name}</div>
                    </Link>
                    <code className="th-acc-sup__id">{r.id}</code>
                  </td>
                  <td>{r.taxCode || '—'}</td>
                  <td>{r.phone || '—'}</td>
                  <td className="th-acc-sup__addr">{r.address || '—'}</td>
                  <td className="th-acc-data-table__num">{formatVND(r.totalDebt)}</td>
                  <td>
                    <span
                      className={
                        r.isActive ? 'th-acc-sup__pill th-acc-sup__pill--ok' : 'th-acc-sup__pill'
                      }
                    >
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatShortAt(r.createdAt)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="th-acc-sup__pagination" aria-label="Phân trang">
        <p className="th-acc-sup__pagination-meta">
          Hiển thị{' '}
          <strong>
            {rangeStart}–{rangeEnd}
          </strong>
          {totalElements > 0 ? ` / ${totalElements} NCC` : ''}
        </p>
        <div className="th-acc-sup__pagination-controls">
          <label className="th-acc-sup__page-size" htmlFor={`${fid}-size`}>
            <span>Số dòng</span>
            <select
              id={`${fid}-size`}
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
              disabled={loading}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="th-acc-sup__pager-btn"
            disabled={loading || pageIndex <= 0}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          >
            Trước
          </button>
          <span className="th-acc-sup__page-label">
            Trang {totalPages === 0 ? 0 : pageIndex + 1}/{totalPages || 1}
          </span>
          <button
            type="button"
            className="th-acc-sup__pager-btn"
            disabled={loading || totalPages === 0 || pageIndex >= totalPages - 1}
            onClick={() => setPageIndex((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  )
}
