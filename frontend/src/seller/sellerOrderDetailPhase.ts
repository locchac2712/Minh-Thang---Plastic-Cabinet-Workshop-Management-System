import type { SellerOrderListRowStatus } from './data/sellerOrdersMock'
import type { SellerApiOrderStatus } from './sellerOrdersApi'
import type { SellerQuotationStatus } from './sellerQuotationsApi'
import { orderRefLabel } from './sellerOrderRef'
import { isQuotationExpired } from './sellerQuotationValidity'

export type SellerOrderDetailVariant = 'order' | 'quotation'

export type PhaseFlags = {
  resolvedApiStatus: SellerApiOrderStatus | null
  isQuotationPhase: boolean
  isApprovedHandoff: boolean
  isOperationsPhase: boolean
  showOrderOperations: boolean
  showQuotationActions: boolean
  showPhaseHandoffBanner: boolean
  showQuotationPaymentSummary: boolean
  showOrderQuotationLink: boolean
}

const QUOTATION_PHASE_STATUSES: SellerApiOrderStatus[] = ['Draft', 'Pending', 'Rejected']
const OPERATIONS_PHASE_STATUSES: SellerApiOrderStatus[] = ['Producing', 'Done', 'Canceled']
const QUOTATION_LINK_STATUSES: SellerApiOrderStatus[] = [
  'Approved',
  'Producing',
  'Done',
  'Canceled',
]

const ROW_TO_API: Record<SellerOrderListRowStatus, SellerApiOrderStatus> = {
  draft: 'Draft',
  pending: 'Pending',
  pending_approval: 'Pending',
  approved: 'Approved',
  producing: 'Producing',
  shipping: 'Producing',
  done: 'Done',
  canceled: 'Canceled',
}

export function rowStatusToApiStatus(status: SellerOrderListRowStatus): SellerApiOrderStatus {
  return ROW_TO_API[status] ?? 'Draft'
}

export function shortOrderRef(orderCode: string): string {
  return orderRefLabel(
    orderCode.trim().startsWith('BG-') || orderCode.trim().startsWith('DH-')
      ? orderCode.trim()
      : null,
    orderCode,
  )
}

export function quotationStatusLabel(status: SellerQuotationStatus): string {
  const m: Record<SellerQuotationStatus, string> = {
    Draft: 'Nháp',
    Pending: 'Chờ duyệt',
    Approved: 'Đã duyệt',
    Rejected: 'Từ chối',
    Canceled: 'Đã hủy',
  }
  return m[status]
}

export function quotationStatusPillClass(status: SellerQuotationStatus): string {
  return `th-seller-order-detail__pill th-seller-order-detail__pill--quotation-${status.toLowerCase()}`
}

export function derivePhaseFlags(input: {
  variant: SellerOrderDetailVariant
  orderApiStatus: SellerApiOrderStatus | null
  detailStatus: SellerOrderListRowStatus
}): PhaseFlags {
  const resolvedApiStatus = input.orderApiStatus ?? rowStatusToApiStatus(input.detailStatus)
  const isQuotationPhase = QUOTATION_PHASE_STATUSES.includes(resolvedApiStatus)
  const isApprovedHandoff = resolvedApiStatus === 'Approved'
  const isOperationsPhase = OPERATIONS_PHASE_STATUSES.includes(resolvedApiStatus)
  const isQuotationLens = input.variant === 'quotation'

  return {
    resolvedApiStatus,
    isQuotationPhase,
    isApprovedHandoff,
    isOperationsPhase,
    showOrderOperations: input.variant === 'order',
    showQuotationActions: isQuotationLens && isQuotationPhase,
    showPhaseHandoffBanner:
      isQuotationLens &&
      (isApprovedHandoff || (isOperationsPhase && resolvedApiStatus !== 'Canceled')),
    showQuotationPaymentSummary: !isQuotationLens || resolvedApiStatus === 'Done',
    showOrderQuotationLink:
      input.variant === 'order' && QUOTATION_LINK_STATUSES.includes(resolvedApiStatus),
  }
}

export type PhaseHandoffBanner = {
  tone: 'approved' | 'operations'
  message: string
}

export function resolvePhaseHandoffBanner(flags: PhaseFlags): PhaseHandoffBanner | null {
  if (!flags.showPhaseHandoffBanner) return null
  if (flags.isApprovedHandoff) {
    return {
      tone: 'approved',
      message: 'Báo giá đã được duyệt — tạo đơn hàng fulfillment để đẩy sản xuất.',
    }
  }
  return {
    tone: 'operations',
    message: 'Tạo đơn hàng mới từ báo giá để thực thi lần đặt tiếp theo.',
  }
}

const COPY_SOURCE_STATUSES: SellerApiOrderStatus[] = ['Approved', 'Producing', 'Done']

/** Báo giá Approved+ và chưa hết hạn — được phép copy sang form tạo đơn mới. */
export function canCopyQuotationToOrder(
  status: SellerApiOrderStatus | null | undefined,
  validUntil: string | null | undefined,
): boolean {
  if (!status || !COPY_SOURCE_STATUSES.includes(status)) return false
  return !quotationCopyBlockedByExpiry(validUntil)
}

/** Hiển thị nút «Tạo đơn từ báo giá» trên lens quotation (Approved+). */
export function showCopyToOrderAction(
  variant: SellerOrderDetailVariant,
  status: SellerApiOrderStatus | null | undefined,
  validUntil: string | null | undefined,
): boolean {
  return variant === 'quotation' && canCopyQuotationToOrder(status, validUntil)
}

/** Hủy báo giá — mọi trạng thái trừ Done/Canceled (BE kiểm tra chi tiết). */
export function showQuotationCancelAction(
  variant: SellerOrderDetailVariant,
  detailStatus: SellerOrderListRowStatus,
): boolean {
  return variant === 'quotation' && detailStatus !== 'done' && detailStatus !== 'canceled'
}

/** Gửi báo giá nháp lên duyệt. */
export function showQuotationSubmitAction(
  variant: SellerOrderDetailVariant,
  orderApiStatus: SellerApiOrderStatus | null | undefined,
): boolean {
  return variant === 'quotation' && orderApiStatus === 'Draft'
}

/** Chặn copy khi quotationValidUntil < hôm nay; null = không giới hạn. */
export function quotationCopyBlockedByExpiry(validUntil: string | null | undefined): boolean {
  return isQuotationExpired(validUntil)
}
