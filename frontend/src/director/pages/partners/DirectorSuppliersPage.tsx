import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND } from '../../../admin/partners/supplierModel'
import { PAGE_SIZE_OPTIONS } from '../../../admin/catalog/productModel'
import { directorPaths } from '../../config/directorPaths'
import {
  AppFilterBar,
  AppFilterField,
  AppFilterInput,
  AppPagination,
} from '../../../shared/ui/listing'
import {
  AdminSupplierApiError,
  type SupplierResponse,
  fetchAdminSuppliers,
  toggleAdminSupplierActive,
} from '../../../admin/partners/adminSuppliersApi'
import '../../../admin/styles/adminListToolbar.css'
import '../../../admin/pages/AdminUsersPage.css'
import './DirectorSuppliersPage.css'

type PendingToggle = null | { id: string; name: string; nextActive: boolean }

function formatShortAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short' })
  } catch {
    return iso
  }
}

export function DirectorSuppliersPage() {
  const fid = useId()
  const navigate = useNavigate()
  const confirmDialogRef = useRef<HTMLDialogElement>(null)

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10)

  const [rows, setRows] = useState<SupplierResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)

  const [pendingToggle, setPendingToggle] = useState<PendingToggle>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 380)
    return () => window.clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPageIndex(0)
  }, [debouncedSearch])

  useEffect(() => {
    const el = confirmDialogRef.current
    if (!el) return
    if (pendingToggle && !el.open) el.showModal()
    else if (!pendingToggle && el.open) el.close()
  }, [pendingToggle])

  const load = useCallback(
    async (options?: { signal?: AbortSignal }) => {
      setLoading(true)
      setLoadError(null)
      let aborted = false
      try {
        const page = await fetchAdminSuppliers({
          page: pageIndex,
          size: pageSize,
          search: debouncedSearch || undefined,
          signal: options?.signal,
        })
        setRows(page.content)
        setTotalElements(page.totalElements)
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          aborted = true
          return
        }
        if (e instanceof AdminSupplierApiError) {
          setLoadError(e.message)
        } else if (e instanceof Error) {
          setLoadError(e.message)
        } else {
          setLoadError('Không tải được danh sách nhà cung cấp.')
        }
        setRows([])
        setTotalElements(0)
      } finally {
        if (!aborted) setLoading(false)
      }
    },
    [pageIndex, pageSize, debouncedSearch],
  )

  useEffect(() => {
    const ac = new AbortController()
    void load({ signal: ac.signal })
    return () => ac.abort()
  }, [load])

  const goToDetail = useCallback(
    (id: string) => {
      navigate(directorPaths.partners.supplier(id))
    },
    [navigate],
  )

  const handleConfirmToggle = useCallback(async () => {
    if (!pendingToggle) return
    setToggling(true)
    setToggleError(null)
    try {
      await toggleAdminSupplierActive(pendingToggle.id)
      setPendingToggle(null)
      await load()
    } catch (e) {
      if (e instanceof AdminSupplierApiError) {
        setToggleError(e.message)
      } else if (e instanceof Error) {
        setToggleError(e.message)
      } else {
        setToggleError('Không cập nhật được trạng thái.')
      }
    } finally {
      setToggling(false)
    }
  }, [pendingToggle, load])

  return (
    <div className="th-admin-supplier-list">
      <header className="th-admin-supplier-list__header">
        <div className="th-admin-supplier-list__title-row">
          <span className="material-symbols-outlined th-admin-supplier-list__title-icon" aria-hidden>
            local_shipping
          </span>
          <div>
            <h1 className="th-admin-supplier-list__title">Nhà cung cấp</h1>
          </div>
        </div>
      </header>

      <section className="th-director-partners__filter-bar" aria-label="Tìm nhà cung cấp">
        <div className="th-admin-list-toolbar__head th-admin-supplier-list__filter-row">
          <AppFilterBar className="th-admin-list-toolbar__bar">
            <AppFilterField search className="th-admin-list-toolbar__search">
              <AppFilterInput
                value={searchInput}
                onChangeValue={setSearchInput}
                placeholder="Tìm theo tên…"
                autoComplete="off"
                disabled={loading}
              />
            </AppFilterField>
          </AppFilterBar>
          <Link
            to={directorPaths.partners.suppliersNew}
            className="th-admin-supplier-list__btn-primary th-admin-supplier-list__btn-primary--link"
          >
            <span className="material-symbols-outlined" aria-hidden>
              add
            </span>
            Tạo mới
          </Link>
        </div>
      </section>

      {loadError && (
        <p className="th-admin-list-toolbar__error" role="alert">
          {loadError}
        </p>
      )}

      <dialog
        ref={confirmDialogRef}
        className="th-dlg th-dlg--confirm"
        aria-labelledby={`${fid}-confirm-title`}
        aria-describedby={`${fid}-confirm-desc`}
        onClose={() => setPendingToggle(null)}
      >
        {pendingToggle ? (
          <div className="th-dlg__panel">
            <button
              type="button"
              className="th-dlg__close"
              onClick={() => setPendingToggle(null)}
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
            <div className="th-dlg__confirm-body">
              <div className="th-dlg__confirm-icon th-dlg__confirm-icon--warn" aria-hidden>
                <span className="material-symbols-outlined">swap_horiz</span>
              </div>
              <h2 id={`${fid}-confirm-title`} className="th-dlg__confirm-title">
                {pendingToggle.nextActive ? 'Mở lại hợp tác với NCC này?' : 'Tạm ngừng hợp tác?'}
              </h2>
              <p id={`${fid}-confirm-desc`} className="th-dlg__confirm-desc">
                {pendingToggle.nextActive ? (
                  <>Cho phép <strong>{pendingToggle.name}</strong> hiển thị trong luồng mua hàng khi tích hợp.</>
                ) : (
                  <>Tạm ngưng <strong>{pendingToggle.name}</strong> — cân nhắc nếu còn công nợ hoặc PO mở.</>
                )}
              </p>
            </div>
            {toggleError && (
              <p className="th-admin-list-toolbar__error" role="alert" style={{ margin: '0 1.5rem' }}>
                {toggleError}
              </p>
            )}
            <div className="th-dlg__footer th-dlg__footer--confirm">
              <button
                type="button"
                className="th-admin-supplier-list__btn-ghost"
                onClick={() => {
                  setToggleError(null)
                  setPendingToggle(null)
                }}
                disabled={toggling}
              >
                Hủy
              </button>
              <button
                type="button"
                className="th-admin-supplier-list__btn-primary"
                onClick={() => void handleConfirmToggle()}
                disabled={toggling}
              >
                {toggling ? 'Đang xử lý…' : 'Xác nhận'}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      <div className="th-admin-supplier-list-table-wrap">
        <div className="th-admin-supplier-list-table-scroll">
          <table className="th-admin-supplier-list-table" aria-label="Bảng nhà cung cấp">
            <thead>
              <tr>
                <th scope="col">Tên</th>
                <th scope="col">MST</th>
                <th scope="col">SĐT</th>
                <th scope="col">Địa chỉ</th>
                <th scope="col">Công nợ</th>
                <th scope="col">Ngày tạo</th>
                <th scope="col">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="th-admin-supplier-list-table__empty">
                    Đang tải…
                  </td>
                </tr>
              )}
              {!loading && totalElements === 0 && (
                <tr>
                  <td colSpan={7} className="th-admin-supplier-list-table__empty">
                    Không có nhà cung cấp phù hợp.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="th-admin-supplier-list-table__row"
                    onClick={() => goToDetail(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        goToDetail(row.id)
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Chi tiết ${row.name}`}
                  >
                    <td data-label="Tên">
                      <div className="th-admin-supplier-list-table__name">{row.name}</div>
                    </td>
                    <td data-label="MST">
                      <code className="th-admin-supplier-list__mono">
                        {row.taxCode && row.taxCode.length > 0 ? row.taxCode : '—'}
                      </code>
                    </td>
                    <td data-label="SĐT">{row.phone ?? '—'}</td>
                    <td data-label="Địa chỉ">
                      <span className="th-admin-supplier-list__truncate" title={row.address ?? undefined}>
                        {row.address && row.address.length > 0 ? row.address : '—'}
                      </span>
                    </td>
                    <td data-label="Công nợ">{formatVND(row.totalDebt)}</td>
                    <td data-label="Ngày tạo">{formatShortAt(row.createdAt)}</td>
                    <td data-label="TT" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className={`th-admin-supplier-list-status-btn th-admin-supplier-list-status-btn--${
                          row.isActive ? 'active' : 'locked'
                        }`}
                        onClick={() => {
                          setToggleError(null)
                          setPendingToggle({
                            id: row.id,
                            name: row.name,
                            nextActive: !row.isActive,
                          })
                        }}
                        aria-label="Đổi trạng thái hợp tác"
                      >
                        <span className="th-admin-supplier-list-status-btn__dot" aria-hidden />
                        {row.isActive ? 'Hợp tác' : 'Ngưng'}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <AppPagination
          className="th-admin-supplier-list-pagination"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          pageSizeOptions={PAGE_SIZE_OPTIONS as unknown as number[]}
          onPageIndexChange={setPageIndex}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize as (typeof PAGE_SIZE_OPTIONS)[number])
            setPageIndex(0)
          }}
        />
      </div>
    </div>
  )
}
