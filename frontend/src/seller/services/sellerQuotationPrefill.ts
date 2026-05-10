/**
 * Service xử lý việc "Ghi nhớ" dữ liệu báo giá tạm thời.
 * Mục đích: Khi người dùng chọn sản phẩm từ trang Menu hàng hóa và nhấn "Tạo báo giá nhanh",
 * dữ liệu sẽ được lưu vào sessionStorage để tự động điền (prefill) vào form tạo báo giá.
 */

const QUICK_QUOTE_PREFILL_STORAGE_KEY = 'th_seller_quick_quote_prefill_v1'
const QUICK_QUOTE_PREFILL_MAX_AGE_MS = 30 * 60 * 1000 // Dữ liệu tạm chỉ có hiệu lực trong 30 phút

/** Nguồn gốc dòng hàng: từ danh mục chuẩn hoặc hàng custom riêng của đại lý */
export type QuickQuoteLineSource = 'standard' | 'agency_custom'

/** Cấu trúc một item trong giỏ hàng tạm */
export type QuickQuotePrefillItem = {
  productId: string
  sku: string
  productName: string
  unitPriceVnd: number
  qty: number
  lineSource: QuickQuoteLineSource
  ownerAgencyId?: string
}

/** Thông tin tóm tắt của đại lý được chọn */
export type QuickQuotePrefillAgencySummary = {
  id: string
  code: string
  shortName: string
  legalName: string
}

/** Payload tổng thể lưu vào storage */
export type QuickQuotePrefillPayload = {
  source: 'store_quick_quote'
  createdAt: number
  agencyId: string
  agency: QuickQuotePrefillAgencySummary
  items: QuickQuotePrefillItem[]
}

type QuickQuotePrefillLocationState = {
  quickQuotePrefill?: unknown
}

/** Kiểm tra và làm sạch chuỗi văn bản */
function parseNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

/** Kiểm tra và làm sạch số (không âm) */
function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return value
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rounded = Math.floor(value)
  return rounded > 0 ? rounded : null
}

/** Chuẩn hóa từng dòng hàng từ dữ liệu thô */
function normalizeItem(raw: unknown, agencyId: string): QuickQuotePrefillItem | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>

  const productId = parseNonEmptyString(record.productId)
  const sku = parseNonEmptyString(record.sku)
  const productName = parseNonEmptyString(record.productName)
  const unitPriceVnd = parseNonNegativeNumber(record.unitPriceVnd)
  const qty = parsePositiveInt(record.qty)
  const lineSource = record.lineSource

  if (
    !productId ||
    !sku ||
    !productName ||
    unitPriceVnd === null ||
    qty === null ||
    (lineSource !== 'standard' && lineSource !== 'agency_custom')
  ) {
    return null
  }

  if (lineSource === 'agency_custom') {
    const ownerAgencyId = parseNonEmptyString(record.ownerAgencyId)
    if (!ownerAgencyId || ownerAgencyId !== agencyId) return null
    return {
      productId,
      sku,
      productName,
      unitPriceVnd,
      qty,
      lineSource,
      ownerAgencyId,
    }
  }

  return {
    productId,
    sku,
    productName,
    unitPriceVnd,
    qty,
    lineSource,
  }
}

export function normalizeQuickQuotePrefill(raw: unknown): QuickQuotePrefillPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>

  if (record.source !== 'store_quick_quote') return null

  const agencyId = parseNonEmptyString(record.agencyId)
  if (!agencyId) return null

  const agencyRaw = record.agency
  if (!agencyRaw || typeof agencyRaw !== 'object') return null
  const agencyRecord = agencyRaw as Record<string, unknown>
  const agencySummary: QuickQuotePrefillAgencySummary = {
    id: parseNonEmptyString(agencyRecord.id) ?? agencyId,
    code: parseNonEmptyString(agencyRecord.code) ?? '—',
    shortName: parseNonEmptyString(agencyRecord.shortName) ?? 'Khách sỉ',
    legalName: parseNonEmptyString(agencyRecord.legalName) ?? 'Khách sỉ',
  }

  const createdAt =
    typeof record.createdAt === 'number' && Number.isFinite(record.createdAt) ? record.createdAt : Date.now()

  const age = Date.now() - createdAt
  if (age < 0 || age > QUICK_QUOTE_PREFILL_MAX_AGE_MS) return null

  if (!Array.isArray(record.items)) return null
  const items = record.items
    .map((item) => normalizeItem(item, agencyId))
    .filter((item): item is QuickQuotePrefillItem => item !== null)

  if (items.length === 0) return null

  return {
    source: 'store_quick_quote',
    createdAt,
    agencyId,
    agency: agencySummary,
    items,
  }
}

/** Kiểm tra xem trình duyệt có hỗ trợ sessionStorage không */
function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

/** Lưu payload vào bộ nhớ tạm của trình duyệt */
export function writeQuickQuotePrefill(payload: QuickQuotePrefillPayload): void {
  if (!canUseStorage()) return
  try {
    window.sessionStorage.setItem(QUICK_QUOTE_PREFILL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

export function clearQuickQuotePrefill(): void {
  if (!canUseStorage()) return
  try {
    window.sessionStorage.removeItem(QUICK_QUOTE_PREFILL_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Đọc dữ liệu từ sessionStorage và kiểm tra tính hợp lệ */
export function readQuickQuotePrefillFromStorage(): QuickQuotePrefillPayload | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(QUICK_QUOTE_PREFILL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const normalized = normalizeQuickQuotePrefill(parsed)
    if (!normalized) {
      clearQuickQuotePrefill()
      return null
    }
    return normalized
  } catch {
    return null
  }
}

export function readQuickQuotePrefillFromLocationState(
  state: unknown,
): QuickQuotePrefillPayload | null {
  if (!state || typeof state !== 'object') return null
  const maybeState = state as QuickQuotePrefillLocationState
  return normalizeQuickQuotePrefill(maybeState.quickQuotePrefill)
}

export function readQuickQuotePrefill(
  state: unknown,
): QuickQuotePrefillPayload | null {
  const fromState = readQuickQuotePrefillFromLocationState(state)
  if (fromState) {
    writeQuickQuotePrefill(fromState)
    return fromState
  }
  return readQuickQuotePrefillFromStorage()
}

