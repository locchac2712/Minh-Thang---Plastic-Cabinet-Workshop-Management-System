import { useEffect, useId, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { formatQty } from '../../admin/manufacturing/materialModel'
import { formatVND } from '../../admin/partners/agencyModel'
import { PAGE_SIZE_OPTIONS } from '../../admin/catalog/productModel'
import {
  AccountantPurchaseApiError,
  fetchAccountantSupplierById,
  fetchAccountantSupplierMaterials,
} from '../accountantPurchasesApi'
import type { SupplierResponse } from '../../admin/partners/adminSuppliersApi'
import type { MaterialResponse } from '../../admin/manufacturing/adminMaterialsApi'
import { accountantPaths } from '../config/accountantPaths'
import '../../admin/styles/adminListToolbar.css'
import './AccountantSuppliersPage.css'

type TabId = 'overview' | 'catalog'

function formatShortAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short' })
  } catch {
    return iso
  }
}

export function AccountantSupplierDetailPage() {
  const fid = useId()
  const { supplierId } = useParams<{ supplierId: string }>()
  const [tab, setTab] = useState<TabId>('overview')
  const [supplier, setSupplier] = useState<SupplierResponse | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [matPageIndex, setMatPageIndex] = useState(0)
  const [matPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(15)
  const [matSearch, setMatSearch] = useState('')
  const [matDebounced, setMatDebounced] = useState('')
  const [matRows, setMatRows] = useState<MaterialResponse[]>([])
  const [matLoading, setMatLoading] = useState(false)
  const [matError, setMatError] = useState<string | null>(null)
  const [matTotal, setMatTotal] = useState(0)
  const [matTotalPages, setMatTotalPages] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setMatDebounced(matSearch.trim()), 380)
    return () => window.clearTimeout(t)
  }, [matSearch])

  useEffect(() => {
    if (!supplierId) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void (async () => {
      try {
        const s = await fetchAccountantSupplierById(supplierId)
        if (!cancelled) setSupplier(s)
      } catch (e) {
        if (!cancelled) {
          setSupplier(null)
          setLoadError(
            e instanceof AccountantPurchaseApiError ? e.message : 'Không tải được NCC.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supplierId])

  useEffect(() => {
    if (tab !== 'catalog' || !supplierId) return
    const ac = new AbortController()
    setMatLoading(true)
    setMatError(null)
    void (async () => {
      try {
        const p = await fetchAccountantSupplierMaterials(supplierId, {
          page: matPageIndex,
          size: matPageSize,
          search: matDebounced || undefined,
          isActive: true,
          signal: ac.signal,
        })
        if (ac.signal.aborted) return
        setMatRows(p.content)
        setMatTotal(p.totalElements)
        setMatTotalPages(p.totalPages)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
        setMatRows([])
        setMatTotal(0)
        setMatTotalPages(0)
        setMatError(
          e instanceof AccountantPurchaseApiError ? e.message : 'Không tải được vật tư trong danh mục.',
        )
      } finally {
        if (!ac.signal.aborted) setMatLoading(false)
      }
    })()
    return () => ac.abort()
  }, [tab, supplierId, matPageIndex, matPageSize, matDebounced])

  const poLink = supplierId
    ? `${accountantPaths.purchasing.orders}?supplierId=${encodeURIComponent(supplierId)}&create=1`
    : accountantPaths.purchasing.orders

  if (!supplierId) return <Navigate to={accountantPaths.masters.suppliers} replace />

  if (loading) {
    return <p className="th-acc-sup__empty">Đang tải…</p>
  }

  if (loadError || !supplier) {
    return (
      <div className="th-acc-sup">
        <p className="th-admin-users__api-error" role="alert">
          {loadError ?? 'Không tìm thấy NCC.'}
        </p>
        <Link to={accountantPaths.masters.suppliers}>← Danh sách NCC</Link>
      </div>
    )
  }

  return (
    <div className="th-acc-sup">
      <header className="th-acc-sup__header">
        <Link to={accountantPaths.masters.suppliers} className="th-acc-sup__back">
          ← Danh sách NCC
        </Link>
        <h1 className="th-acc-sup__title">{supplier.name}</h1>
        <div className="th-acc-sup__actions">
          <Link to={poLink} className="th-acc-sup__btn-primary">
            Lập PO với NCC này
          </Link>
        </div>
      </header>

      <div className="th-acc-sup__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'overview'}
          className={tab === 'overview' ? 'is-active' : ''}
          onClick={() => setTab('overview')}
        >
          Tổng quan
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'catalog'}
          className={tab === 'catalog' ? 'is-active' : ''}
          onClick={() => setTab('catalog')}
        >
          Vật tư trong danh mục
        </button>
      </div>

      {tab === 'overview' && (
        <div className="th-acc-sup__panel" role="tabpanel">
          <dl className="th-acc-sup__dl">
            <div>
              <dt>MST</dt>
              <dd>{supplier.taxCode || '—'}</dd>
            </div>
            <div>
              <dt>Điện thoại</dt>
              <dd>{supplier.phone || '—'}</dd>
            </div>
            <div>
              <dt>Địa chỉ</dt>
              <dd>{supplier.address || '—'}</dd>
            </div>
            <div>
              <dt>Công nợ</dt>
              <dd>{formatVND(supplier.totalDebt)}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{supplier.isActive ? 'Active' : 'Inactive'}</dd>
            </div>
            <div>
              <dt>Tạo lúc</dt>
              <dd>{formatShortAt(supplier.createdAt)}</dd>
            </div>
          </dl>
          <p className="th-acc-sup__hint">
            PO chỉ chọn được vật tư đã gán trong danh mục NCC–NVL (Admin/Director quản lý gán).
          </p>
        </div>
      )}

      {tab === 'catalog' && (
        <div className="th-acc-sup__panel" role="tabpanel">
          <label className="th-admin-list-toolbar__search" htmlFor={`${fid}-mat-q`}>
            <input
              id={`${fid}-mat-q`}
              type="search"
              className="th-admin-list-toolbar__search-input"
              value={matSearch}
              onChange={(e) => {
                setMatSearch(e.target.value)
                setMatPageIndex(0)
              }}
              placeholder="Tìm mã, tên…"
            />
          </label>
          {matError ? (
            <p className="th-admin-users__api-error" role="alert">
              {matError}
            </p>
          ) : null}
          {matLoading ? <p>Đang tải…</p> : null}
          {!matLoading && matTotal === 0 && !matError ? (
            <p className="th-acc-sup__hint">
              NCC chưa có vật tư trong danh mục. Liên hệ Admin/Director để gán trước khi lập PO.
            </p>
          ) : null}
          {!matLoading && matRows.length > 0 ? (
            <table className="th-acc-data-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên</th>
                  <th>ĐVT</th>
                  <th>Tồn</th>
                </tr>
              </thead>
              <tbody>
                {matRows.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <code>{m.code}</code>
                    </td>
                    <td>{m.name}</td>
                    <td>{m.unit}</td>
                    <td>{formatQty(m.stockQuantity, m.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {matTotalPages > 1 ? (
            <div className="th-acc-sup__pagination">
              <button
                type="button"
                disabled={matPageIndex <= 0 || matLoading}
                onClick={() => setMatPageIndex((p) => p - 1)}
              >
                Trước
              </button>
              <span>
                Trang {matPageIndex + 1}/{matTotalPages}
              </span>
              <button
                type="button"
                disabled={matPageIndex >= matTotalPages - 1 || matLoading}
                onClick={() => setMatPageIndex((p) => p + 1)}
              >
                Sau
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
