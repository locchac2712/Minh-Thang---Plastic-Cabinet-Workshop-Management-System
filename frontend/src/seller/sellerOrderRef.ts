import type { SellerOrderListDto } from './sellerOrdersApi'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const DISPLAY_CODE_RE = /^(BG|DH)-\d{4}-\d{5}$/

export function isBackendOrderUuid(s: string): boolean {
  return UUID_RE.test(s.trim())
}

export function isBackendDisplayCode(s: string): boolean {
  return DISPLAY_CODE_RE.test(s.trim())
}

/** UUID hoặc mã BG-/DH- dùng trên URL/API path. */
export function isBackendOrderRef(s: string): boolean {
  const t = s.trim()
  return isBackendOrderUuid(t) || isBackendDisplayCode(t)
}

export function orderCodeFromDto(d: Pick<SellerOrderListDto, 'id' | 'displayCode'>): string {
  const code = d.displayCode?.trim()
  return code || d.id
}

export function orderRefLabel(displayCode: string | null | undefined, id: string): string {
  const code = displayCode?.trim()
  if (code) return code
  const t = id.trim()
  if (UUID_RE.test(t)) return `${t.slice(0, 8)}…`
  return t
}

export function isQuotationRecord(
  d: Pick<SellerOrderListDto, 'recordKind' | 'displayCode' | 'sourceOrderId'>,
): boolean {
  const code = d.displayCode?.trim() ?? ''
  if (code.startsWith('BG-')) return true
  if (code.startsWith('DH-')) return false
  if (d.recordKind === 'quotation') return true
  if (d.recordKind === 'fulfillment') return false
  if (d.sourceOrderId) return false
  return true
}

export function isFulfillmentRecord(
  d: Pick<SellerOrderListDto, 'recordKind' | 'displayCode' | 'sourceOrderId'>,
): boolean {
  return !isQuotationRecord(d)
}
