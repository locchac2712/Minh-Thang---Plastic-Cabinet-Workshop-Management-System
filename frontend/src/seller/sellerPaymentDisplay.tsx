import type { SellerOrderPaymentDto, SellerOrderPaymentStatus } from './sellerOrdersApi'
import './sellerPaymentDisplay.css'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Có ít nhất một phiếu thu đã được kế toán xác nhận (Completed). */
export function hasConfirmedSellerPayment(rows: SellerOrderPaymentDto[]): boolean {
  return rows.some((p) => p.status === 'Completed')
}

export function sellerPaymentStatusLabel(status: string | null | undefined): string {
  const s = (status ?? '').trim()
  if (s === 'Pending') return 'Chờ duyệt'
  if (s === 'Completed') return 'Đã duyệt'
  if (s === 'Failed') return 'Từ chối'
  return s || '—'
}

export function sellerPaymentStatusClass(status: string | null | undefined): string {
  const s = (status ?? '').trim() as SellerOrderPaymentStatus | ''
  const base = 'th-seller-payment-status'
  if (s === 'Completed') return `${base} th-seller-payment-status--ok`
  if (s === 'Failed') return `${base} th-seller-payment-status--bad`
  if (s === 'Pending') return `${base} th-seller-payment-status--wait`
  return base
}

export function sellerPaymentMethodLabel(method: string | null | undefined): string {
  const m = (method ?? '').trim()
  const known: Record<string, string> = {
    CK: 'Chuyển khoản',
    'Chuyển khoản': 'Chuyển khoản',
    'Tiền mặt': 'Tiền mặt',
    BankTransfer: 'Chuyển khoản',
    Cash: 'Tiền mặt',
  }
  return known[m] ?? (m || '—')
}

/** Rút gọn UUID phiếu — full id giữ trong title. */
export function formatSellerPaymentRef(id: string): string {
  const t = id.trim()
  if (UUID_RE.test(t)) return `${t.slice(0, 8).toUpperCase()}…`
  return t.length > 12 ? `${t.slice(0, 8)}…` : t
}

export type SellerPaymentProofThumbProps = {
  url: string
  alt?: string
}

export function SellerPaymentProofThumb({
  url,
  alt = 'Chứng từ thanh toán',
}: SellerPaymentProofThumbProps) {
  const href = url.trim()
  if (!href) return <>—</>
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="th-seller-payment-proof-thumb-link"
      title="Mở ảnh chứng từ"
    >
      <img src={href} alt={alt} className="th-seller-payment-proof-thumb" loading="lazy" decoding="async" />
    </a>
  )
}
