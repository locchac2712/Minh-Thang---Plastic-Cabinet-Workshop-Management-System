import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  fetchAdminBomByProductStats,
  fetchAdminProductsByCategoryStats,
  fetchAdminUsersByRoleStats,
  mapBomByProductStatsToDonutSlices,
  mapProductsByCategoryStatsToRows,
  mapUsersByRoleStatsToStaffRows,
} from '../adminDashboardApi'
import type {
  DonutSlice,
  ProductByCategoryRow,
  StaffByRoleRow,
} from './adminDashboardMock'
import { ADMIN_DASHBOARD_MOCK } from './adminDashboardMock'
import {
  AdminDashCategoryBars,
  AdminDashDonutChart,
  AdminDashStaffRoleBars,
} from './AdminDashboardCharts'
import './AdminDashboardPage.css'

const MAX_PRODUCTS_BY_CATEGORY_RANGE_DAYS = 366

function parseDateOnlyIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

/** Số ngày lịch trong [from, to], gồm hai đầu mút */
function inclusiveDaySpan(fromIso: string, toIso: string): number {
  const a = parseDateOnlyIso(fromIso)
  const b = parseDateOnlyIso(toIso)
  if (!a || !b) return NaN
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor((b.getTime() - a.getTime()) / msPerDay) + 1
}

/** Khi gửi cả from và to: lọc theo khoảng, tối đa 366 ngày. */
function validateProductsByCategoryDateFilter(fromRaw: string, toRaw: string): string | null {
  const f = fromRaw.trim()
  const t = toRaw.trim()
  if (!f && !t) return null
  if (f && !parseDateOnlyIso(f)) return 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD).'
  if (t && !parseDateOnlyIso(t)) return 'Ngày kết thúc không hợp lệ (YYYY-MM-DD).'
  if (f && t) {
    if (parseDateOnlyIso(f)!.getTime() > parseDateOnlyIso(t)!.getTime()) {
      return 'Ngày bắt đầu không được sau ngày kết thúc.'
    }
    const span = inclusiveDaySpan(f, t)
    if (span > MAX_PRODUCTS_BY_CATEGORY_RANGE_DAYS) {
      return `Khi chọn cả hai ngày, khoảng tối đa ${MAX_PRODUCTS_BY_CATEGORY_RANGE_DAYS} ngày.`
    }
  }
  return null
}

/**
 * Dashboard admin — KPI + nhiều dạng biểu đồ (mock).
 * Chỉ số cốt lõi: ui/admin_sidebar.md §1; mở rộng đối tác & BOM theo master data.
 */
export function AdminDashboardPage() {
  const d = ADMIN_DASHBOARD_MOCK

  const [bomDonutSlices, setBomDonutSlices] = useState<DonutSlice[]>(() => d.bomStatusDonut)
  const [bomDonutFootnote, setBomDonutFootnote] = useState<string>('Đang tải thống kê từ máy chủ…')

  const [staffByRoleRows, setStaffByRoleRows] = useState<StaffByRoleRow[]>(() => d.staffByRole)
  const [staffByRoleFootnote, setStaffByRoleFootnote] = useState<string>('Đang tải thống kê từ máy chủ…')

  const [productsByCategoryRows, setProductsByCategoryRows] = useState<ProductByCategoryRow[]>(
    () => d.productsByCategory,
  )
  const [productsByCategoryFootnote, setProductsByCategoryFootnote] = useState(
    'Đang tải thống kê từ máy chủ…',
  )
  const [productsByCategoryLoading, setProductsByCategoryLoading] = useState(false)
  const [productsByCategoryFilterError, setProductsByCategoryFilterError] = useState<string | null>(
    null,
  )
  const [productsCategoryFrom, setProductsCategoryFrom] = useState('')
  const [productsCategoryTo, setProductsCategoryTo] = useState('')
  const [appliedProductsCategoryFrom, setAppliedProductsCategoryFrom] = useState('')
  const [appliedProductsCategoryTo, setAppliedProductsCategoryTo] = useState('')
  const productsCategoryAbortRef = useRef<AbortController | null>(null)

  const loadProductsByCategory = useCallback(
    async (query: { fromDate?: string; toDate?: string }) => {
      productsCategoryAbortRef.current?.abort()
      const ac = new AbortController()
      productsCategoryAbortRef.current = ac

      setProductsByCategoryLoading(true)
      setProductsByCategoryFilterError(null)
      try {
        const raw = await fetchAdminProductsByCategoryStats({
          ...(query.fromDate ? { fromDate: query.fromDate } : {}),
          ...(query.toDate ? { toDate: query.toDate } : {}),
          signal: ac.signal,
        })
        const rows = mapProductsByCategoryStatsToRows(raw)
        setProductsByCategoryRows(rows)
        setAppliedProductsCategoryFrom(query.fromDate ?? '')
        setAppliedProductsCategoryTo(query.toDate ?? '')

        const f = query.fromDate ?? ''
        const t = query.toDate ?? ''
        if (!f && !t) {
          setProductsByCategoryFootnote(
            'Đếm toàn thời gian (mọi SKU mẫu thỏa điều kiện). Chi tiết tại Danh mục.',
          )
        } else if (f && !t) {
          setProductsByCategoryFootnote(
            `Chỉ đếm mẫu tạo từ ${f} đến hôm nay (theo máy chủ). Chi tiết tại Danh mục.`,
          )
        } else if (!f && t) {
          setProductsByCategoryFootnote(
            `Chỉ đếm mẫu tạo trong một năm lùi kết thúc ${t} (theo máy chủ). Chi tiết tại Danh mục.`,
          )
        } else {
          setProductsByCategoryFootnote(`Chỉ đếm mẫu tạo trong khoảng ${f} → ${t}. Chi tiết tại Danh mục.`)
        }
      } catch (e) {
        const aborted =
          (e instanceof DOMException || e instanceof Error) && e.name === 'AbortError'
        if (aborted) return
        const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
        setProductsByCategoryRows(ADMIN_DASHBOARD_MOCK.productsByCategory)
        setAppliedProductsCategoryFrom('')
        setAppliedProductsCategoryTo('')
        setProductsByCategoryFootnote(
          `Không tải được thống kê ngành hàng — hiển thị dữ liệu minh họa. (${msg})`,
        )
      } finally {
        if (!ac.signal.aborted) setProductsByCategoryLoading(false)
      }
    },
    [],
  )

  const handleProductsCategorySubmit = (ev?: FormEvent) => {
    ev?.preventDefault()
    const err = validateProductsByCategoryDateFilter(productsCategoryFrom, productsCategoryTo)
    if (err) {
      setProductsByCategoryFilterError(err)
      return
    }
    const f = productsCategoryFrom.trim()
    const t = productsCategoryTo.trim()
    setProductsByCategoryFilterError(null)
    if (!f && !t) {
      void loadProductsByCategory({})
      return
    }
    if (f && !t) {
      void loadProductsByCategory({ fromDate: f })
      return
    }
    if (!f && t) {
      void loadProductsByCategory({ toDate: t })
      return
    }
    void loadProductsByCategory({ fromDate: f, toDate: t })
  }

  const handleProductsCategoryResetAllTime = () => {
    setProductsCategoryFrom('')
    setProductsCategoryTo('')
    setProductsByCategoryFilterError(null)
    void loadProductsByCategory({})
  }

  const productsCategorySubtitle = useMemo(() => {
    const f = appliedProductsCategoryFrom.trim()
    const t = appliedProductsCategoryTo.trim()
    if (!f && !t) return 'Cột dọc — SKU mẫu tủ theo ngành · đếm toàn thời gian'
    if (f && !t) return `Cột dọc — SKU theo ngành · mẫu tạo từ ${f} đến hôm nay`
    if (!f && t) return `Cột dọc — SKU theo ngành · mẫu tạo trong một năm lùi đến ${t}`
    return `Cột dọc — SKU theo ngành · mẫu tạo ${f} → ${t}`
  }, [appliedProductsCategoryFrom, appliedProductsCategoryTo])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stats = await fetchAdminBomByProductStats()
        if (cancelled) return
        setBomDonutSlices(mapBomByProductStatsToDonutSlices(stats))
        setBomDonutFootnote(`Tổng sản phẩm: ${stats.tongSoSanPham}.`)
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
        setBomDonutSlices(ADMIN_DASHBOARD_MOCK.bomStatusDonut)
        setBomDonutFootnote(
          `Không tải được thống kê BOM — hiển thị dữ liệu minh họa. (${msg})`,
        )
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stats = await fetchAdminUsersByRoleStats()
        if (cancelled) return
        setStaffByRoleRows(mapUsersByRoleStatsToStaffRows(stats))
        setStaffByRoleFootnote(`Tổng tài khoản đang hoạt động: ${stats.totalActiveUsers}.`)
      } catch (e) {
        if (cancelled) return
        const msg = e instanceof Error ? e.message : 'Lỗi không xác định'
        setStaffByRoleRows(ADMIN_DASHBOARD_MOCK.staffByRole)
        setStaffByRoleFootnote(`Không tải được thống kê vai trò — hiển thị dữ liệu minh họa. (${msg})`)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void loadProductsByCategory({})
    return () => {
      productsCategoryAbortRef.current?.abort()
    }
  }, [loadProductsByCategory])

  return (
    <div className="th-admin-dashboard">
      <header className="th-admin-dashboard__header">
        <h1 className="th-admin-dashboard__title">Tổng quan</h1>
      </header>

      <div className="th-admin-dashboard__charts">
        <div className="th-admin-dashboard__row th-admin-dashboard__row--2">
          <AdminDashDonutChart
            title="Trạng thái BOM theo mẫu tủ"
            subtitle="Đủ định mức · thiếu NVL · chưa cấu hình"
            slices={bomDonutSlices}
            footnote={bomDonutFootnote}
          />
          <AdminDashStaffRoleBars
            title="Phân bổ nhân sự theo vai trò"
            subtitle="Đối chiếu phân quyền — Sale, SX, kế toán, quản trị…"
            rows={staffByRoleRows}
            footnote={staffByRoleFootnote}
          />
        </div>

        <div className="th-admin-dashboard__row">
          <div className="th-admin-dash-category-wrap">
            <form
              className="th-admin-dash-trend-toolbar"
              role="search"
              aria-label="Lọc ngày tạo mẫu tủ theo ngành hàng"
              onSubmit={handleProductsCategorySubmit}
            >
              <div className="th-admin-dash-trend-toolbar__row">
                <label className="th-admin-dash-trend-toolbar__field">
                  <span className="th-admin-dash-trend-toolbar__lbl">Từ ngày</span>
                  <input
                    className="th-admin-dash-trend-toolbar__input"
                    type="date"
                    value={productsCategoryFrom}
                    onChange={(ev) => setProductsCategoryFrom(ev.target.value)}
                    max={productsCategoryTo || undefined}
                    disabled={productsByCategoryLoading}
                  />
                </label>
                <label className="th-admin-dash-trend-toolbar__field">
                  <span className="th-admin-dash-trend-toolbar__lbl">Đến ngày</span>
                  <input
                    className="th-admin-dash-trend-toolbar__input"
                    type="date"
                    value={productsCategoryTo}
                    onChange={(ev) => setProductsCategoryTo(ev.target.value)}
                    min={productsCategoryFrom || undefined}
                    disabled={productsByCategoryLoading}
                  />
                </label>
                <div className="th-admin-dash-trend-toolbar__actions">
                  <button
                    type="submit"
                    className="th-admin-dash-trend-toolbar__btn th-admin-dash-trend-toolbar__btn--primary"
                    disabled={productsByCategoryLoading}
                  >
                    Áp dụng
                  </button>
                  <button
                    type="button"
                    className="th-admin-dash-trend-toolbar__btn"
                    onClick={handleProductsCategoryResetAllTime}
                    disabled={productsByCategoryLoading}
                  >
                    Toàn thời gian
                  </button>
                </div>
              </div>
              {productsByCategoryFilterError ? (
                <p className="th-admin-dash-trend-toolbar__error" role="alert">
                  {productsByCategoryFilterError}
                </p>
              ) : null}
            </form>
            <div
              className={
                productsByCategoryLoading
                  ? 'th-admin-dash-trend-chart th-admin-dash-trend-chart--busy'
                  : 'th-admin-dash-trend-chart'
              }
              aria-busy={productsByCategoryLoading}
            >
              <AdminDashCategoryBars
                title="Mẫu tủ theo ngành hàng"
                subtitle={productsCategorySubtitle}
                rows={productsByCategoryRows}
                footnote={productsByCategoryFootnote}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
