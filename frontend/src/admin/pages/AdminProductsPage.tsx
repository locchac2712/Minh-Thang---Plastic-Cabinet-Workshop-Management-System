import {
  useCallback,
  useEffect,
  useId,
  useState,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  DEFAULT_PRODUCT_IMAGE_URL,
  PAGE_SIZE_OPTIONS,
  formatVND,
} from '../catalog/productModel'
import { adminPaths } from '../config/adminPaths'
import { CategorySearchSelect } from '../components/CategorySearchSelect/CategorySearchSelect'
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
import './AdminProductsPage.css'

type ProductRow = {
  id: string
  categoryId: string
  categoryName: string
  sku: string
  name: string
  imageUrls: string[]
  costPrice: number
  suggestedPrice: number
  stockQuantity: number
  isActive: boolean
  createdAt: string
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type ProductListResponse = {
  content: ProductRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type CategoryDto = {
  id: string
  name: string
}

type CategoryListResponse = {
  content: CategoryDto[]
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

/* ── Component ──────────────────────────────────────────────────────── */
export function AdminProductsPage() {
  const fid = useId()
  const navigate = useNavigate()
  const [rows, setRows] = useState<ProductRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [categoryOptions, setCategoryOptions] = useState<Array<{ id: string; label: string }>>([
    { id: '', label: 'Tất cả' },
  ])

  /* search + filters */
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | 'active' | 'inactive'>('')
  const [filterStock, setFilterStock] = useState<'all' | 'in_stock' | 'out_of_stock'>('all')

  /* pagination */
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(15)

  useEffect(() => {
    setPageIndex(0)
  }, [searchQuery, filterCategory, filterStatus, filterStock])

  useEffect(() => {
    const accessToken = getAccessToken()
    if (!accessToken) return
    const run = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/categories?page=0&size=200`, {
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
        })
        const envelope = (await res.json()) as ApiEnvelope<CategoryListResponse>
        if (!res.ok || !envelope.success || !envelope.data) return
        setCategoryOptions([
          { id: '', label: 'Tất cả' },
          ...envelope.data.content.map((c) => ({ id: c.id, label: c.name })),
        ])
      } catch {
        // bỏ qua lỗi load category filter để không chặn list sản phẩm
      }
    }
    void run()
  }, [])

  const fetchProducts = useCallback(async () => {
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
      if (filterCategory) q.set('category_id', filterCategory)
      if (filterStatus) q.set('is_active', filterStatus === 'active' ? 'true' : 'false')
      if (filterStock !== 'all') q.set('in_stock', filterStock === 'in_stock' ? 'true' : 'false')

      const res = await fetch(`${API_BASE_URL}/api/admin/products?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })

      const envelope = (await res.json()) as ApiEnvelope<ProductListResponse>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được danh sách sản phẩm')
      }
      const data = envelope.data
      setRows(data.content)
      setPageIndex(data.page)
      setTotalElements(data.totalElements)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Không tải được danh sách sản phẩm')
      setRows([])
      setTotalElements(0)
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus, filterStock, pageIndex, pageSize, searchQuery])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  const filtersApplied = !!filterCategory || !!filterStatus || filterStock !== 'all' || searchQuery.trim() !== ''
  const clearFilters = useCallback(() => {
    setFilterCategory('')
    setFilterStatus('')
    setFilterStock('all')
    setSearchQuery('')
  }, [])

  const openDetail = useCallback(
    (id: string) => {
      navigate(adminPaths.catalog.product(id))
    },
    [navigate],
  )

  /* ── Render ── */
  return (
    <div className="th-admin-products-page">
      {/* ── Page header ── */}
      <div className="th-admin-products-header">
        <div className="th-admin-products-header__left">
          <span className="material-symbols-outlined th-admin-products-header__icon" aria-hidden>inventory_2</span>
          <div>
            <h1 className="th-admin-products-header__title">Sản phẩm</h1>
            <p className="th-admin-products-header__sub">{totalElements} sản phẩm trong hệ thống</p>
            {loadError ? <p className="th-admin-users__api-error">{loadError}</p> : null}
          </div>
        </div>
        <Link to={adminPaths.catalog.productsNew} className="th-admin-products__btn-primary th-admin-products__btn-primary--link">
          <span className="material-symbols-outlined th-admin-products__btn-icon" aria-hidden>add</span>
          Tạo sản phẩm
        </Link>
      </div>

      {/* ── Table card ── */}
      <div className="th-admin-products-table-wrap">

        {/* toolbar */}
        <div className="th-admin-list-toolbar__head">
          <AppFilterBar className="th-admin-list-toolbar__bar">
            <AppFilterField search className="th-admin-list-toolbar__search">
              <span className="th-admin-list-toolbar-visually-hidden">Tìm theo tên hoặc SKU</span>
              <AppFilterInput
                value={searchQuery}
                onChangeValue={setSearchQuery}
                placeholder="Tìm tên, SKU…"
                autoComplete="off"
              />
            </AppFilterField>

            <div className="th-admin-list-toolbar__filter">
              <span className="th-admin-list-toolbar__filter-label" id={`${fid}-filter-cat-label`}>
                Ngành hàng
              </span>
              <CategorySearchSelect
                variant="toolbar"
                options={categoryOptions}
                value={filterCategory}
                onChange={setFilterCategory}
                aria-labelledby={`${fid}-filter-cat-label`}
              />
            </div>

            <AppFilterField label="Trạng thái" className="th-admin-list-toolbar__filter">
              <AppFilterSelect
                value={filterStatus}
                onChangeValue={(value) => setFilterStatus(value as '' | 'active' | 'inactive')}
                options={[
                  { value: '', label: 'Tất cả' },
                  { value: 'active', label: 'Đang bán' },
                  { value: 'inactive', label: 'Ngừng bán' },
                ]}
              />
            </AppFilterField>
            <AppFilterField label="Tồn kho" className="th-admin-list-toolbar__filter">
              <AppFilterSelect
                value={filterStock}
                onChangeValue={(value) => setFilterStock(value as 'all' | 'in_stock' | 'out_of_stock')}
                options={[
                  { value: 'all', label: 'Tất cả' },
                  { value: 'in_stock', label: 'Còn hàng' },
                  { value: 'out_of_stock', label: 'Hết hàng' },
                ]}
              />
            </AppFilterField>

            {filtersApplied ? (
              <AppFilterActions>
                <AppFilterClearButton onClick={clearFilters} />
              </AppFilterActions>
            ) : null}
          </AppFilterBar>
        </div>

        {/* table */}
        <div className="th-admin-products-table-scroll">
          <table className="th-admin-products-table" aria-label="Bảng sản phẩm">
            <thead>
              <tr>
                <th scope="col">Ảnh</th>
                <th scope="col">Sản phẩm</th>
                <th scope="col">Ngành hàng</th>
                <th scope="col">Vật liệu</th>
                <th scope="col">Đơn giá</th>
                <th scope="col">Trạng thái</th>
                <th scope="col">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="th-admin-products-table__empty">
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : null}
              {!loading && totalElements === 0 ? (
                <tr>
                  <td colSpan={7} className="th-admin-products-table__empty">
                    Không tìm thấy sản phẩm phù hợp. Thử đổi từ khóa hoặc bộ lọc.
                  </td>
                </tr>
              ) : null}
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="th-admin-products-table__row"
                  onClick={() => openDetail(row.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(row.id) } }}
                  tabIndex={0}
                  aria-label={`Xem chi tiết ${row.name}`}
                >
                  <td data-label="Ảnh">
                    <img
                      src={row.imageUrls[0] || DEFAULT_PRODUCT_IMAGE_URL}
                      alt=""
                      className="th-admin-products-thumb"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE_URL
                      }}
                    />
                  </td>
                  <td data-label="Sản phẩm">
                    <div className="th-admin-products-table__name-cell">
                      <div>
                        <div className="th-admin-products-table__name">{row.name}</div>
                        <div className="th-admin-products-table__sku">{row.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Ngành hàng">
                    <span className="th-admin-badge th-admin-badge--role">{row.categoryName}</span>
                  </td>
                  <td data-label="Vật liệu">
                    <span className="th-admin-products-table__material">Tồn kho: {row.stockQuantity}</span>
                  </td>
                  <td data-label="Đơn giá">
                    <span className="th-admin-products-table__price">{formatVND(row.suggestedPrice)}</span>
                  </td>
                  <td data-label="Trạng thái">
                    <span
                      className={`th-admin-products-status-btn th-admin-products-status-btn--${row.isActive ? 'active' : 'discontinued'}`}
                      aria-label={`Trạng thái ${row.isActive ? 'Đang bán' : 'Ngừng bán'}`}
                    >
                      <span className="th-admin-products-status-btn__dot" aria-hidden />
                      {row.isActive ? 'Đang bán' : 'Ngừng bán'}
                    </span>
                  </td>
                  <td data-label="Thao tác">
                    <button
                      type="button"
                      className="th-admin-products__btn-icon-danger"
                      onClick={(e) => {
                        e.stopPropagation()
                        openDetail(row.id)
                      }}
                      aria-label={`Chỉnh sửa ${row.name}`}
                    >
                      <span className="material-symbols-outlined" aria-hidden>edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AppPagination
          className="th-admin-products-pagination"
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
