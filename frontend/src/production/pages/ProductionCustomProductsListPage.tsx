import { useCallback, useEffect, useId, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  AppFilterBar,
  AppFilterField,
  AppFilterInput,
  AppPagination,
} from '../../shared/ui/listing'
import { productionPaths } from '../config/productionPaths'
import {
  fetchProductionCustomProducts,
  type ProductionCustomProductDto,
} from '../productionCustomProductsApi'
import './ProductionCustomProductsListPage.css'

const DEFAULT_PRODUCT_IMAGE =
  'https://res.cloudinary.com/demo/image/upload/sample.jpg'

export function ProductionCustomProductsListPage() {
  const navigate = useNavigate()
  const fid = useId()
  const [rows, setRows] = useState<ProductionCustomProductDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProductionCustomProducts({
        page: pageIndex,
        size: pageSize,
        search: search.trim() || undefined,
      })
      setRows(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, search])

  useEffect(() => {
    void load()
  }, [load])

  function openRow(p: ProductionCustomProductDto) {
    navigate(productionPaths.customProducts.detail(p.id))
  }

  return (
    <div className="th-prod-cp-list">
      <header className="th-prod-cp-list__header">
        <h1 className="th-prod-cp-list__title">
          <span className="material-symbols-outlined" aria-hidden>
            design_services
          </span>
          Sản phẩm custom đã tạo
        </h1>
        <p className="th-prod-cp-list__lead">
          Danh sách sản phẩm custom theo đại lý — bấm dòng để xem và chỉnh sửa.
        </p>
      </header>

      {loadError ? <p className="th-prod-cp-list__err" role="alert">{loadError}</p> : null}

      <div className="th-prod-cp-list__toolbar">
        <AppFilterBar className="th-prod-cp-list__filter-bar">
          <AppFilterField search label="Tìm kiếm" className="th-prod-cp-list__search">
            <AppFilterInput
              id={`${fid}-q`}
              placeholder="Mã hàng, tên sản phẩm…"
              value={search}
              onChangeValue={(value) => {
                setSearch(value)
                setPageIndex(0)
              }}
            />
          </AppFilterField>
          <Link
            to={productionPaths.customProducts.create}
            className="th-prod-cp-list__create-btn th-prod-cp-list__filter-create"
          >
            <span className="material-symbols-outlined" aria-hidden>
              add
            </span>
            Tạo mới
          </Link>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-prod-cp-list__hint">Đang tải…</p> : null}

      <div className="th-prod-table-shell" aria-busy={loading}>
        <table className="th-prod-data-table">
          <thead>
            <tr>
              <th scope="col">Ảnh</th>
              <th scope="col">Mã hàng</th>
              <th scope="col">Tên sản phẩm</th>
              <th scope="col">Đại lý</th>
              <th scope="col" className="th-prod-data-table__num">
                Giá đề xuất
              </th>
              <th scope="col" className="th-prod-data-table__num">
                Giá vốn
              </th>
              <th scope="col" className="th-prod-data-table__num">
                Tồn
              </th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="th-prod-data-table__empty">
                  {search.trim()
                    ? 'Không có sản phẩm khớp bộ lọc.'
                    : 'Chưa có sản phẩm custom — bấm «Tạo mới» để thêm.'}
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr
                  key={p.id}
                  className="th-prod-data-table__row"
                  tabIndex={0}
                  role="link"
                  title="Mở chi tiết"
                  onClick={() => openRow(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openRow(p)
                    }
                  }}
                >
                  <td>
                    <img
                      src={p.imageUrls[0] || DEFAULT_PRODUCT_IMAGE}
                      alt=""
                      className="th-prod-cp-list__thumb"
                      loading="lazy"
                    />
                  </td>
                  <td>
                    <code className="th-prod-cp-list__sku">{p.sku}</code>
                  </td>
                  <td className="th-prod-data-table__name">{p.name}</td>
                  <td>{p.agencyName?.trim() || '—'}</td>
                  <td className="th-prod-data-table__num">{formatVND(p.suggestedPrice)}</td>
                  <td className="th-prod-data-table__num">{formatVND(p.costPrice)}</td>
                  <td className="th-prod-data-table__num">{p.stockQuantity}</td>
                  <td>
                    <span
                      className={
                        p.isActive
                          ? 'th-prod-cp-list__pill th-prod-cp-list__pill--ok'
                          : 'th-prod-cp-list__pill th-prod-cp-list__pill--off'
                      }
                    >
                      {p.isActive ? 'Đang bán' : 'Ngừng bán'}
                    </span>
                  </td>
                  <td className="th-prod-data-table__date">
                    {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-prod-cp-list__pager"
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
