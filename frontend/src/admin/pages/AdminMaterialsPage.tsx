import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Checkbox } from 'antd'
import {
  DEFAULT_MATERIAL_IMAGE_URL,
  formatQty,
} from '../manufacturing/materialModel'
import { PAGE_SIZE_OPTIONS } from '../catalog/productModel'
import { adminPaths } from '../config/adminPaths'
import { getAccessToken, getTokenType } from '../../auth/storage'
import {
  AppFilterActions,
  AppFilterBar,
  AppFilterClearButton,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import '../styles/adminListToolbar.css'
import './AdminUsersPage.css'
import './AdminMaterialsPage.css'

type MaterialRow = {
  id: string
  code: string
  name: string
  imageUrl: string | null
  unit: string
  unitCost: number
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
  createdAt: string
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type MaterialListResponse = {
  content: MaterialRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function isLowStockRow(row: Pick<MaterialRow, 'stockQuantity' | 'minStockLevel'>): boolean {
  return row.stockQuantity <= row.minStockLevel
}

export function AdminMaterialsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState<MaterialRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)

  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('')
  const [onlyLowStock, setOnlyLowStock] = useState(false)

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(15)

  useEffect(() => {
    setPageIndex(0)
  }, [searchQuery, filterStatus, onlyLowStock])

  const fetchMaterials = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      setRows([])
      setTotalElements(0)
      return
    }

    setLoading(true)
    setLoadError(null)
    try {
      const q = new URLSearchParams()
      q.set('page', String(pageIndex))
      q.set('size', String(pageSize))
      const search = searchQuery.trim()
      if (search) q.set('search', search)
      if (filterStatus) q.set('is_active', filterStatus === 'active' ? 'true' : 'false')

      const res = await fetch(`${API_BASE_URL}/api/admin/materials?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<MaterialListResponse>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được danh sách vật tư')
      }

      const data = envelope.data
      const filtered = onlyLowStock ? data.content.filter((r) => isLowStockRow(r)) : data.content
      setRows(filtered)
      setPageIndex(data.page)
      setTotalElements(data.totalElements)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách vật tư')
      setRows([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, onlyLowStock, pageIndex, pageSize, searchQuery])

  useEffect(() => {
    void fetchMaterials()
  }, [fetchMaterials])

  const lowStockCount = rows.filter((r) => r.isActive && isLowStockRow(r)).length
  const activeCount = rows.filter((r) => r.isActive).length
  const filtersApplied = !!filterStatus || onlyLowStock || searchQuery.trim() !== ''
  const clearFilters = useCallback(() => {
    setFilterStatus('')
    setOnlyLowStock(false)
    setSearchQuery('')
  }, [])

  const goToDetail = useCallback(
    (id: string) => {
      navigate(adminPaths.manufacturing.material(id))
    },
    [navigate],
  )

  return (
    <div className="th-admin-mat">
      <header className="th-admin-mat__header">
        <div className="th-admin-mat__heading">
          <div className="th-admin-mat__title-row">
            <span className="material-symbols-outlined th-admin-mat__title-icon" aria-hidden>
              precision_manufacturing
            </span>
            <div>
              <h1 className="th-admin-mat__title">Vật tư</h1>
              {loadError ? <p className="th-admin-users__api-error">{loadError}</p> : null}
            </div>
          </div>
        </div>
        <div className="th-admin-mat__toolbar">
          <Link
            to={adminPaths.manufacturing.bom}
            className="th-admin-mat__btn-secondary th-admin-mat__btn-secondary--link"
          >
            <span className="material-symbols-outlined th-admin-mat__btn-icon" aria-hidden>
              account_tree
            </span>
            Cấu hình BOM
          </Link>
          <Link
            to={adminPaths.manufacturing.materialsNew}
            className="th-admin-mat__btn-primary th-admin-mat__btn-primary--link"
          >
            <span className="material-symbols-outlined th-admin-mat__btn-icon" aria-hidden>
              add
            </span>
            Thêm vật tư
          </Link>
        </div>
      </header>

      <ul className="th-admin-mat__stats" aria-label="Chỉ số nhanh">
        <li className="th-admin-mat__stat">
          <span className="th-admin-mat__stat-label">Tổng mã vật tư</span>
          <span className="th-admin-mat__stat-value">{totalElements}</span>
          <span className="th-admin-mat__stat-hint">{activeCount} đang dùng</span>
        </li>
        <li className="th-admin-mat__stat th-admin-mat__stat--warn">
          <span className="th-admin-mat__stat-label">Cảnh báo tồn</span>
          <span className="th-admin-mat__stat-value">{lowStockCount}</span>
          <span className="th-admin-mat__stat-hint">Chỉ tính trạng thái đang dùng</span>
        </li>
        <li className="th-admin-mat__stat">
          <span className="th-admin-mat__stat-label">Sau lọc hiện tại</span>
          <span className="th-admin-mat__stat-value">{rows.length}</span>
          <span className="th-admin-mat__stat-hint">Theo ô tìm & bộ lọc</span>
        </li>
      </ul>

      {/* Bảng */}
      <div className="th-admin-mat-table-wrap">
        <div className="th-admin-list-toolbar__head">
          <AppFilterBar className="th-admin-list-toolbar__bar">
            <AppFilterField search className="th-admin-list-toolbar__search">
              <span className="th-admin-list-toolbar-visually-hidden">Tìm vật tư</span>
              <AppFilterInput
                value={searchQuery}
                onChangeValue={setSearchQuery}
                placeholder="Mã, tên, NCC…"
                autoComplete="off"
              />
            </AppFilterField>

            <AppFilterField label="Trạng thái" className="th-admin-list-toolbar__filter">
              <AppFilterSelect
                value={filterStatus}
                onChangeValue={(value) => setFilterStatus(value as '' | 'active' | 'inactive')}
                options={[
                  { value: '', label: 'Tất cả' },
                  { value: 'active', label: 'Đang dùng' },
                  { value: 'inactive', label: 'Ngưng' },
                ]}
              />
            </AppFilterField>

            <label className="th-admin-list-toolbar__chip">
              <Checkbox
                checked={onlyLowStock}
                onChange={(event) => setOnlyLowStock(event.target.checked)}
              >
                Chỉ tồn thấp
              </Checkbox>
            </label>

            {filtersApplied ? (
              <AppFilterActions>
                <AppFilterClearButton onClick={clearFilters} />
              </AppFilterActions>
            ) : null}
          </AppFilterBar>
        </div>

        <div className="th-admin-mat-table-scroll">
          <table className="th-admin-mat-table" aria-label="Bảng vật tư">
            <thead>
              <tr>
                <th scope="col">Ảnh</th>
                <th scope="col">Mã</th>
                <th scope="col">Tên vật tư</th>
                <th scope="col">ĐVT</th>
                <th scope="col">Đơn giá</th>
                <th scope="col">Tồn / Min</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="th-admin-mat-table__empty">
                    Đang tải danh sách vật tư...
                  </td>
                </tr>
              ) : null}
              {!loading && rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="th-admin-mat-table__empty">
                    Không có vật tư phù hợp. Thử đổi từ khóa hoặc bộ lọc.
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className={`th-admin-mat-table__row${
                    row.isActive && isLowStockRow(row)
                      ? ' th-admin-mat-table__row--warn'
                      : ''
                  }`}
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
                  <td data-label="Ảnh">
                    <img
                      src={row.imageUrl || DEFAULT_MATERIAL_IMAGE_URL}
                      alt=""
                      className="th-admin-mat-table__thumb"
                      loading="lazy"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = DEFAULT_MATERIAL_IMAGE_URL
                      }}
                    />
                  </td>
                  <td data-label="Mã">
                    <code className="th-admin-mat__mono">{row.code}</code>
                  </td>
                  <td data-label="Tên">
                    <div className="th-admin-mat-table__name">{row.name}</div>
                  </td>
                  <td data-label="ĐVT">{row.unit}</td>
                  <td data-label="Đơn giá">
                    {row.unitCost.toLocaleString('vi-VN')}đ
                  </td>
                  <td data-label="Tồn">
                    <span
                      className={
                        row.isActive && isLowStockRow(row)
                          ? 'th-admin-mat__stock-cell th-admin-mat__stock-cell--alert'
                          : 'th-admin-mat__stock-cell'
                      }
                    >
                      {formatQty(row.stockQuantity, row.unit)}
                      <span className="th-admin-mat__stock-sep">/</span>
                      {formatQty(row.minStockLevel, row.unit)}
                    </span>
                  </td>
                  <td data-label="Trạng thái">
                    <span
                      className={`th-admin-mat-status-btn th-admin-mat-status-btn--${row.isActive ? 'active' : 'discontinued'}`}
                    >
                      <span className="th-admin-mat-status-btn__dot" aria-hidden />
                      {row.isActive ? 'Đang dùng' : 'Ngưng'}
                    </span>
                  </td>
                  <td data-label="Thao tác">
                    <button
                      type="button"
                      className="th-admin-mat__btn-icon-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        goToDetail(row.id)
                      }}
                      aria-label={`Chỉnh sửa ${row.name}`}
                    >
                      <span className="material-symbols-outlined" aria-hidden>
                        edit
                      </span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AppPagination
          className="th-admin-mat-pagination"
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
