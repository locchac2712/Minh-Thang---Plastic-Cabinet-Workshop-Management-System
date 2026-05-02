/**
 * Tổng quan dashboard admin — GET aggregates theo backend.
 */
import { getAccessToken, getTokenType } from '../auth/storage'
import type {
  DonutSlice,
  ProductByCategoryRow,
  StaffByRoleRow,
  StockBandRow,
  TrendPoint,
} from './pages/adminDashboardMock'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export type BomByProductStatsDto = {
  chuaCauHinhBomCount: number
  thieuNvlTrongBomCount: number
  duDinhMucCount: number
  tongSoSanPham: number
}

export type MaterialThresholdStatsDto = {
  trenNguongAnToanCount: number
  ganNguongMinCount: number
  duoiMinCount: number
  tongVatTuActive: number
  bufferMultiplier: number
}

export type UsersByRoleStatsDto = {
  countByRole: Record<string, number>
  totalActiveUsers: number
}

/** Thứ tự hiển thị + nhãn tiếng Việt (đồng bộ AdminUsersPage STAFF_ROLE_OPTIONS). */
const DASHBOARD_ROLE_ORDER = ['ADMIN', 'DIRECTOR', 'SELLER', 'PRODUCTION', 'ACCOUNTANT'] as const

const DASHBOARD_ROLE_LABEL_VI: Record<string, string> = {
  ADMIN: 'Quản trị',
  DIRECTOR: 'Giám đốc',
  SELLER: 'Kinh doanh',
  PRODUCTION: 'Sản xuất',
  ACCOUNTANT: 'Kế toán',
}

type ApiEnvelope<T> = {
  success: boolean
  message?: string
  data?: T
}

function isBomStats(x: unknown): x is BomByProductStatsDto {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.chuaCauHinhBomCount === 'number' &&
    typeof o.thieuNvlTrongBomCount === 'number' &&
    typeof o.duDinhMucCount === 'number' &&
    typeof o.tongSoSanPham === 'number'
  )
}

function unwrapBomStats(raw: unknown): BomByProductStatsDto {
  if (isBomStats(raw)) return raw
  const w = raw as ApiEnvelope<BomByProductStatsDto>
  if (w?.success && w.data && isBomStats(w.data)) return w.data
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (isBomStats(d)) return d
  }
  throw new Error('Phản hồi thống kê BOM không hợp lệ')
}

/** Map DTO → lát donut (màu đồng bộ mock cũ). */
export function mapBomByProductStatsToDonutSlices(d: BomByProductStatsDto): DonutSlice[] {
  return [
    { key: 'full', label: 'Đủ định mức', value: Math.max(0, d.duDinhMucCount), color: '#22c55e' },
    {
      key: 'partial',
      label: 'Thiếu NVL trong BOM',
      value: Math.max(0, d.thieuNvlTrongBomCount),
      color: '#f59e0b',
    },
    {
      key: 'none',
      label: 'Chưa cấu hình BOM',
      value: Math.max(0, d.chuaCauHinhBomCount),
      color: '#94a3b8',
    },
  ]
}

/** GET /api/admin/dashboard/bom-by-product-stats */
export async function fetchAdminBomByProductStats(): Promise<BomByProductStatsDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/bom-by-product-stats`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được thống kê BOM theo sản phẩm')
  }
  return unwrapBomStats(body)
}

function isMaterialThresholdStats(x: unknown): x is MaterialThresholdStatsDto {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.trenNguongAnToanCount === 'number' &&
    typeof o.ganNguongMinCount === 'number' &&
    typeof o.duoiMinCount === 'number' &&
    typeof o.tongVatTuActive === 'number' &&
    typeof o.bufferMultiplier === 'number'
  )
}

function unwrapMaterialThresholdStats(raw: unknown): MaterialThresholdStatsDto {
  if (isMaterialThresholdStats(raw)) return raw
  const w = raw as ApiEnvelope<MaterialThresholdStatsDto>
  if (w?.success && w.data && isMaterialThresholdStats(w.data)) return w.data
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (isMaterialThresholdStats(d)) return d
  }
  throw new Error('Phản hồi thống kê ngưỡng vật tư không hợp lệ')
}

/** Map DTO → ba dải stacked bar (đồng bộ nhãn mock). */
export function mapMaterialThresholdStatsToBands(d: MaterialThresholdStatsDto): StockBandRow[] {
  return [
    {
      key: 'ok',
      label: 'Trên ngưỡng an toàn',
      count: Math.max(0, d.trenNguongAnToanCount),
    },
    {
      key: 'warn',
      label: 'Gần min (cần theo dõi)',
      count: Math.max(0, d.ganNguongMinCount),
    },
    {
      key: 'crit',
      label: '≤ min / cảnh báo',
      count: Math.max(0, d.duoiMinCount),
    },
  ]
}

/** GET /api/admin/dashboard/material-threshold-stats */
export async function fetchAdminMaterialThresholdStats(): Promise<MaterialThresholdStatsDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/material-threshold-stats`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được thống kê ngưỡng tồn vật tư')
  }
  return unwrapMaterialThresholdStats(body)
}

function isUsersByRoleStats(x: unknown): x is UsersByRoleStatsDto {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  if (typeof o.totalActiveUsers !== 'number') return false
  const c = o.countByRole
  if (!c || typeof c !== 'object') return false
  for (const v of Object.values(c as Record<string, unknown>)) {
    if (typeof v !== 'number') return false
  }
  return true
}

function unwrapUsersByRoleStats(raw: unknown): UsersByRoleStatsDto {
  if (isUsersByRoleStats(raw)) return raw
  const w = raw as ApiEnvelope<UsersByRoleStatsDto>
  if (w?.success && w.data && isUsersByRoleStats(w.data)) return w.data
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (isUsersByRoleStats(d)) return d
  }
  throw new Error('Phản hồi thống kê user theo vai trò không hợp lệ')
}

export function mapUsersByRoleStatsToStaffRows(d: UsersByRoleStatsDto): StaffByRoleRow[] {
  const seen = new Set<string>()
  const rows: StaffByRoleRow[] = []

  for (const code of DASHBOARD_ROLE_ORDER) {
    if (!(code in d.countByRole)) continue
    seen.add(code)
    rows.push({
      role: DASHBOARD_ROLE_LABEL_VI[code] ?? code,
      count: Math.max(0, d.countByRole[code] ?? 0),
    })
  }

  const extras = Object.entries(d.countByRole)
    .filter(([code]) => !seen.has(code))
    .sort(([a], [b]) => a.localeCompare(b))

  for (const [code, count] of extras) {
    rows.push({
      role: DASHBOARD_ROLE_LABEL_VI[code] ?? code,
      count: Math.max(0, count),
    })
  }

  return rows
}

/** GET /api/admin/dashboard/users-by-role-stats */
export async function fetchAdminUsersByRoleStats(): Promise<UsersByRoleStatsDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const res = await fetch(`${API_BASE_URL}/api/admin/dashboard/users-by-role-stats`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được thống kê nhân sự theo vai trò')
  }
  return unwrapUsersByRoleStats(body)
}

/** Điểm một ngày — GET /api/admin/dashboard/inventory-warning-trend */
export type InventoryWarningTrendPointDto = {
  date: string
  warningSkuCount: number
}

export type InventoryWarningTrendParams = {
  /** ISO YYYY-MM-DD */
  fromDate?: string
  /** ISO YYYY-MM-DD */
  toDate?: string
  signal?: AbortSignal
}

/** CN = Chủ nhật, T2…T7 = Thứ hai…Thứ bảy (getDay() 0…6). */
const VI_WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] as const

function parseISODateOnlyToLocal(isoDate: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim())
  if (!m) return new Date(NaN)
  const y = Number(m[1])
  const mo = Number(m[2]) - 1
  const day = Number(m[3])
  return new Date(y, mo, day)
}

export function inventoryWarningWeekdayLabelFromDate(isoDate: string): string {
  const d = parseISODateOnlyToLocal(isoDate)
  if (Number.isNaN(d.getTime())) return isoDate
  return VI_WEEKDAY_SHORT[d.getDay()]
}

function isInventoryTrendPoint(x: unknown): x is InventoryWarningTrendPointDto {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return typeof o.date === 'string' && typeof o.warningSkuCount === 'number'
}

function unwrapInventoryWarningTrend(raw: unknown): InventoryWarningTrendPointDto[] {
  const asArray = (val: unknown): InventoryWarningTrendPointDto[] => {
    if (!Array.isArray(val)) throw new Error('inventory-warning-trend không phải mảng')
    return val.map((item, i) => {
      if (!isInventoryTrendPoint(item)) {
        throw new Error(`inventory-warning-trend[${i}] không hợp lệ`)
      }
      return item
    })
  }

  if (Array.isArray(raw)) return asArray(raw)
  const w = raw as ApiEnvelope<InventoryWarningTrendPointDto[]>
  if (w?.success && Array.isArray(w.data)) return asArray(w.data)
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (Array.isArray(d)) return asArray(d)
  }
  throw new Error('Phản hồi xu hướng cảnh báo tồn không hợp lệ')
}

export function mapInventoryWarningTrendToTrendPoints(
  points: InventoryWarningTrendPointDto[],
): TrendPoint[] {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  return sorted.map((p) => ({
    label: inventoryWarningWeekdayLabelFromDate(p.date),
    alertCount: Math.max(0, Math.round(p.warningSkuCount)),
  }))
}

/**
 * GET /api/admin/dashboard/inventory-warning-trend
 * Không query → BE mặc định 7 ngày (to = hôm nay, from = to − 6).
 */
export async function fetchAdminInventoryWarningTrend(
  params?: InventoryWarningTrendParams,
): Promise<InventoryWarningTrendPointDto[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const q = new URLSearchParams()
  if (params?.fromDate) q.set('from_date', params.fromDate)
  if (params?.toDate) q.set('to_date', params.toDate)
  const qs = q.toString()
  const url = `${API_BASE_URL}/api/admin/dashboard/inventory-warning-trend${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    signal: params?.signal,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được xu hướng cảnh báo tồn')
  }
  return unwrapInventoryWarningTrend(body)
}

export type ProductByCategoryStatDto = {
  categoryId: string
  categoryName: string
  skuCount: number
}

export type ProductsByCategoryStatsParams = {
  /** ISO YYYY-MM-DD — có thể gửi một trong hai hoặc cả hai (xem mô tả API). */
  fromDate?: string
  toDate?: string
  signal?: AbortSignal
}

function isProductByCategoryStat(x: unknown): x is ProductByCategoryStatDto {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.categoryId === 'string' &&
    typeof o.categoryName === 'string' &&
    typeof o.skuCount === 'number'
  )
}

function unwrapProductsByCategoryStats(raw: unknown): ProductByCategoryStatDto[] {
  const asArray = (val: unknown): ProductByCategoryStatDto[] => {
    if (!Array.isArray(val)) throw new Error('products-by-category-stats không phải mảng')
    return val.map((item, i) => {
      if (!isProductByCategoryStat(item)) {
        throw new Error(`products-by-category-stats[${i}] không hợp lệ`)
      }
      return item
    })
  }

  if (Array.isArray(raw)) return asArray(raw)
  const w = raw as ApiEnvelope<ProductByCategoryStatDto[]>
  if (w?.success && Array.isArray(w.data)) return asArray(w.data)
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const d = (raw as { data: unknown }).data
    if (Array.isArray(d)) return asArray(d)
  }
  throw new Error('Phản hồi thống kê sản phẩm theo ngành không hợp lệ')
}

export function mapProductsByCategoryStatsToRows(
  rows: ProductByCategoryStatDto[],
): ProductByCategoryRow[] {
  const mapped = rows.map((r) => ({
    category: r.categoryName,
    count: Math.max(0, Math.round(r.skuCount)),
  }))
  return [...mapped].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, 'vi'))
}

/**
 * GET /api/admin/dashboard/products-by-category-stats
 * Không query: đếm toàn thời gian. Có from/to: lọc created_at (BE quy tắc cận ngày).
 */
export async function fetchAdminProductsByCategoryStats(
  params?: ProductsByCategoryStatsParams,
): Promise<ProductByCategoryStatDto[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token. Vui lòng đăng nhập lại.')
  }
  const q = new URLSearchParams()
  const from = params?.fromDate?.trim()
  const to = params?.toDate?.trim()
  if (from) q.set('from_date', from)
  if (to) q.set('to_date', to)
  const qs = q.toString()
  const url = `${API_BASE_URL}/api/admin/dashboard/products-by-category-stats${qs ? `?${qs}` : ''}`
  const res = await fetch(url, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    signal: params?.signal,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được thống kê mẫu tủ theo ngành hàng')
  }
  return unwrapProductsByCategoryStats(body)
}
