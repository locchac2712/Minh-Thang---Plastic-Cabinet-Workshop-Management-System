const QUICK_QUOTE_PREFILL_STORAGE_KEY = 'th_seller_quick_quote_prefill_v1'
const QUICK_QUOTE_PREFILL_MAX_AGE_MS = 30 * 60 * 1000

export type QuickQuoteLineSource = 'standard' | 'agency_custom'

export type QuickQuotePrefillItem = {
  productId: string
  sku: string
  productName: string
  unitPriceVnd: number
  qty: number
  lineSource: QuickQuoteLineSource
  ownerAgencyId?: string
}

export type QuickQuotePrefillAgencySummary = {
  id: string
  code: string
  shortName: string
  legalName: string
}

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

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

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

