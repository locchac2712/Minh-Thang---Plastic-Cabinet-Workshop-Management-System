import type { SellerApiOrderStatus, SellerOrderListDto } from './sellerOrdersApi'
import { agencyCodeFromDto } from './sellerOrdersApi'
import { orderCodeFromDto } from './sellerOrderRef'
import { isQuotationExpired } from './sellerQuotationValidity'

const QUOTATION_ORDER_COPY_PREFILL_STORAGE_KEY = 'th_seller_quotation_order_copy_prefill_v1'
const QUOTATION_ORDER_COPY_PREFILL_MAX_AGE_MS = 30 * 60 * 1000

const COPY_SOURCE_STATUSES: SellerApiOrderStatus[] = ['Approved', 'Producing', 'Done']

export type QuotationOrderCopyPrefillItem = {
  productId: string
  sku: string
  productName: string
  unitPriceVnd: number
  qty: number
}

/** Snapshot giá gốc từ báo giá — dùng khóa UI và phát hiện drift. */
export type QuotationOrderCopySourcePriceItem = {
  productId: string
  unitPriceVnd: number
}

export type QuotationOrderCopyPrefillAgencySummary = {
  id: string
  code: string
  shortName: string
  legalName: string
}

export type QuotationOrderCopyPrefillPayload = {
  source: 'quotation_order_copy'
  createdAt: number
  sourceQuotationId: string
  sourceQuotationRef: string
  quotationValidUntil: string | null
  agencyId: string
  agency: QuotationOrderCopyPrefillAgencySummary
  discountAmountVnd: number
  shippingFeeVnd: number
  shippingAddress: string
  expectedDeliveryDate: string | null
  note: string | null
  items: QuotationOrderCopyPrefillItem[]
  sourcePriceSnapshot: QuotationOrderCopySourcePriceItem[]
}

type QuotationOrderCopyPrefillLocationState = {
  quotationOrderCopyPrefill?: unknown
}

export type QuotationOrderCopyHydrateResult = {
  lines: Array<{
    id: string
    productId: string
    sku: string
    productName: string
    qty: number
    unitPriceVnd: number
    lineNote: string
  }>
  droppedLineCount: number
}

function parseNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function parseNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null
  return value
}

function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  const rounded = Math.floor(value)
  return rounded > 0 ? rounded : null
}

function normalizeItem(raw: unknown): QuotationOrderCopyPrefillItem | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>

  const productId = parseNonEmptyString(record.productId)
  const sku = parseNonEmptyString(record.sku)
  const productName = parseNonEmptyString(record.productName)
  const unitPriceVnd = parseNonNegativeNumber(record.unitPriceVnd)
  const qty = parsePositiveInt(record.qty)

  if (!productId || !sku || !productName || unitPriceVnd === null || qty === null) {
    return null
  }

  return { productId, sku, productName, unitPriceVnd, qty }
}

export function normalizeQuotationOrderCopyPrefill(
  raw: unknown,
): QuotationOrderCopyPrefillPayload | null {
  if (!raw || typeof raw !== 'object') return null
  const record = raw as Record<string, unknown>

  if (record.source !== 'quotation_order_copy') return null

  const sourceQuotationId = parseNonEmptyString(record.sourceQuotationId)
  const sourceQuotationRef = parseNonEmptyString(record.sourceQuotationRef)
  const agencyId = parseNonEmptyString(record.agencyId)
  if (!sourceQuotationId || !sourceQuotationRef || !agencyId) return null

  const agencyRaw = record.agency
  if (!agencyRaw || typeof agencyRaw !== 'object') return null
  const agencyRecord = agencyRaw as Record<string, unknown>
  const agency: QuotationOrderCopyPrefillAgencySummary = {
    id: parseNonEmptyString(agencyRecord.id) ?? agencyId,
    code: parseNonEmptyString(agencyRecord.code) ?? '—',
    shortName: parseNonEmptyString(agencyRecord.shortName) ?? 'Khách sỉ',
    legalName: parseNonEmptyString(agencyRecord.legalName) ?? 'Khách sỉ',
  }

  const createdAt =
    typeof record.createdAt === 'number' && Number.isFinite(record.createdAt)
      ? record.createdAt
      : Date.now()

  const age = Date.now() - createdAt
  if (age < 0 || age > QUOTATION_ORDER_COPY_PREFILL_MAX_AGE_MS) return null

  if (!Array.isArray(record.items)) return null
  const items = record.items
    .map((item) => normalizeItem(item))
    .filter((item): item is QuotationOrderCopyPrefillItem => item !== null)

  if (items.length === 0) return null

  const discountAmountVnd = parseNonNegativeNumber(record.discountAmountVnd) ?? 0
  const shippingFeeVnd = parseNonNegativeNumber(record.shippingFeeVnd) ?? 0
  const shippingAddress = parseNonEmptyString(record.shippingAddress) ?? '—'
  const expectedDeliveryDate =
    record.expectedDeliveryDate === null
      ? null
      : parseNonEmptyString(record.expectedDeliveryDate)
  const quotationValidUntil =
    record.quotationValidUntil === null
      ? null
      : parseNonEmptyString(record.quotationValidUntil)
  const note = record.note === null ? null : parseNonEmptyString(record.note)

  const snapshotRaw = record.sourcePriceSnapshot
  let sourcePriceSnapshot: QuotationOrderCopySourcePriceItem[] = []
  if (Array.isArray(snapshotRaw)) {
    sourcePriceSnapshot = snapshotRaw
      .map((raw) => {
        if (!raw || typeof raw !== 'object') return null
        const row = raw as Record<string, unknown>
        const productId = parseNonEmptyString(row.productId)
        const unitPriceVnd = parseNonNegativeNumber(row.unitPriceVnd)
        if (!productId || unitPriceVnd === null) return null
        return { productId, unitPriceVnd }
      })
      .filter((x): x is QuotationOrderCopySourcePriceItem => x !== null)
  }
  if (sourcePriceSnapshot.length === 0) {
    sourcePriceSnapshot = items.map((it) => ({
      productId: it.productId,
      unitPriceVnd: it.unitPriceVnd,
    }))
  }

  if (isQuotationExpired(quotationValidUntil)) return null

  return {
    source: 'quotation_order_copy',
    createdAt,
    sourceQuotationId,
    sourceQuotationRef,
    quotationValidUntil,
    agencyId,
    agency,
    discountAmountVnd,
    shippingFeeVnd,
    shippingAddress,
    expectedDeliveryDate,
    note,
    items,
    sourcePriceSnapshot,
  }
}

export function canCopyQuotationOrderDto(d: SellerOrderListDto): boolean {
  if (!COPY_SOURCE_STATUSES.includes(d.status)) return false
  if (isQuotationExpired(d.quotationValidUntil)) return false
  if (!d.items.some((it) => it.productId?.trim())) return false
  return true
}

export function buildFromOrderDto(d: SellerOrderListDto): QuotationOrderCopyPrefillPayload | null {
  if (!canCopyQuotationOrderDto(d)) return null

  const items: QuotationOrderCopyPrefillItem[] = []
  for (const it of d.items) {
    const productId = it.productId?.trim()
    if (!productId) continue
    items.push({
      productId,
      sku: it.productSku?.trim() || '—',
      productName: it.productName?.trim() || '—',
      unitPriceVnd: Math.max(0, it.unitPrice),
      qty: Math.max(1, Math.floor(it.quantity) || 1),
    })
  }
  if (items.length === 0) return null

  const shortName = d.agencyName?.trim() || 'Khách sỉ'
  return {
    source: 'quotation_order_copy',
    createdAt: Date.now(),
    sourceQuotationId: d.id,
    sourceQuotationRef: orderCodeFromDto(d),
    quotationValidUntil: d.quotationValidUntil?.trim() || null,
    agencyId: d.agencyId,
    agency: {
      id: d.agencyId,
      code: agencyCodeFromDto(d),
      shortName,
      legalName: d.agencyLegalName?.trim() || shortName,
    },
    discountAmountVnd: Math.max(0, d.discountAmount),
    shippingFeeVnd: Math.max(0, d.shippingFee),
    shippingAddress: d.shippingAddress?.trim() || '—',
    expectedDeliveryDate: d.expectedDeliveryDate?.trim() || null,
    note: d.note?.trim() || null,
    items,
    sourcePriceSnapshot: items.map((it) => ({
      productId: it.productId,
      unitPriceVnd: it.unitPriceVnd,
    })),
  }
}

function newLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ln-${crypto.randomUUID().slice(0, 10)}`
  }
  return `ln-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function hydrateLinesFromQuotationOrderCopyPrefill(
  prefill: QuotationOrderCopyPrefillPayload,
): QuotationOrderCopyHydrateResult {
  const lines: QuotationOrderCopyHydrateResult['lines'] = []
  let droppedLineCount = 0

  for (const item of prefill.items) {
    if (!item.productId?.trim()) {
      droppedLineCount += 1
      continue
    }
    lines.push({
      id: newLineId(),
      productId: item.productId,
      sku: item.sku,
      productName: item.productName,
      qty: Math.max(1, Math.floor(item.qty) || 1),
      unitPriceVnd: Math.max(0, item.unitPriceVnd),
      lineNote: '',
    })
  }

  return { lines, droppedLineCount }
}

export function buildCopyPrefillNotePrefix(sourceQuotationRef: string): string {
  return `Sao chép từ báo giá ${sourceQuotationRef}`
}

export function isCopyPricingLocked(prefill: QuotationOrderCopyPrefillPayload | null): boolean {
  return prefill != null
}

/** Chỉ đơn giá dòng — CK thêm / phí giao lệch không tính drift (BE vẫn auto-approve). */
export function detectCopyPricingDrift(
  lines: Array<{ productId?: string; unitPriceVnd: number }>,
  prefill: QuotationOrderCopyPrefillPayload,
): boolean {
  const priceByProduct = new Map(
    prefill.sourcePriceSnapshot.map((it) => [it.productId, it.unitPriceVnd]),
  )

  for (const line of lines) {
    const productId = line.productId?.trim()
    if (!productId) return true
    const sourcePrice = priceByProduct.get(productId)
    if (sourcePrice === undefined) return true
    if (Math.round(line.unitPriceVnd) !== Math.round(sourcePrice)) return true
  }

  return false
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

export function writeQuotationOrderCopyPrefill(payload: QuotationOrderCopyPrefillPayload): void {
  if (!canUseStorage()) return
  try {
    window.sessionStorage.setItem(
      QUOTATION_ORDER_COPY_PREFILL_STORAGE_KEY,
      JSON.stringify(payload),
    )
  } catch {
    /* ignore */
  }
}

export function clearQuotationOrderCopyPrefill(): void {
  if (!canUseStorage()) return
  try {
    window.sessionStorage.removeItem(QUOTATION_ORDER_COPY_PREFILL_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function readQuotationOrderCopyPrefillFromStorage(): QuotationOrderCopyPrefillPayload | null {
  if (!canUseStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(QUOTATION_ORDER_COPY_PREFILL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    const normalized = normalizeQuotationOrderCopyPrefill(parsed)
    if (!normalized) {
      clearQuotationOrderCopyPrefill()
      return null
    }
    return normalized
  } catch {
    return null
  }
}

export function readQuotationOrderCopyPrefillFromLocationState(
  state: unknown,
): QuotationOrderCopyPrefillPayload | null {
  if (!state || typeof state !== 'object') return null
  const maybeState = state as QuotationOrderCopyPrefillLocationState
  return normalizeQuotationOrderCopyPrefill(maybeState.quotationOrderCopyPrefill)
}

export function readQuotationOrderCopyPrefill(state: unknown): QuotationOrderCopyPrefillPayload | null {
  const fromState = readQuotationOrderCopyPrefillFromLocationState(state)
  if (fromState) {
    writeQuotationOrderCopyPrefill(fromState)
    return fromState
  }
  return readQuotationOrderCopyPrefillFromStorage()
}
