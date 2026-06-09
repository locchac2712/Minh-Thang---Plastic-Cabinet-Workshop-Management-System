import { getAccessToken, getTokenType } from '../auth/storage'
import {
  createSellerOrder,
  fetchSellerOrderById,
  type CreateSellerOrderPayload,
  type SellerApiOrderStatus,
  type SellerOrderListDto,
  type SellerOrdersRawPage,
} from './sellerOrdersApi'
import { isFulfillmentRecord } from './sellerOrderRef'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

/** Trạng thái báo giá — query GET /api/seller/quotations?status=… */
export type SellerQuotationStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Canceled'

export type SellerQuotationListDto = SellerOrderListDto & {
  quotationStatus: SellerQuotationStatus
}

export type SellerQuotationsPage = {
  content: SellerQuotationListDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type FetchSellerQuotationsParams = {
  page?: number
  size?: number
  /** Bỏ qua để lấy tất cả (nếu backend hỗ trợ). */
  status?: SellerQuotationStatus
  /** Lọc theo mã báo giá (displayCode, ví dụ BG-2026-00001). */
  search?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export async function fetchSellerQuotations(
  params: FetchSellerQuotationsParams,
): Promise<SellerQuotationsPage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.status) q.set('status', params.status)
  const search = params.search?.trim()
  if (search) q.set('search', search)

  const res = await fetch(`${API_BASE_URL}/api/seller/quotations?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<SellerQuotationsPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách báo giá')
  }
  return envelope.data
}

/**
 * Tạo báo giá — cùng endpoint tạo đơn nháp (POST /api/seller/orders).
 * Response có thể không có quotationStatus; dùng SellerOrderListDto.
 */
export async function createSellerQuotation(
  payload: CreateSellerOrderPayload,
): Promise<SellerOrderListDto> {
  return createSellerOrder(payload)
}

/** Khi không có quotationStatus (fallback từ GET đơn). */
export function inferQuotationStatusFromOrder(order: { status: SellerApiOrderStatus }): SellerQuotationStatus {
  switch (order.status) {
    case 'Draft':
      return 'Draft'
    case 'Pending':
      return 'Pending'
    case 'Approved':
    case 'Producing':
    case 'Done':
      return 'Approved'
    case 'Canceled':
      return 'Canceled'
    default:
      return 'Pending'
  }
}

export type QuotationPipelineStepState = 'done' | 'current' | 'upcoming' | 'skipped'

/**
 * 3 bước: Nháp → Chờ duyệt → (kết quả).
 * Trước khi có Đã duyệt / Từ chối: bước 3 là «Đợi kết quả duyệt» (một ô, không tách hai ô kết cục).
 * Đã duyệt (báo giá) gộp trạng thái đơn Approved / Producing / Done / Canceled — chỉ hiển thị nhãn «Đã duyệt».
 */
export function resolveQuotationPipeline(
  quotationStatus: SellerQuotationStatus,
  orderStatus: SellerApiOrderStatus,
): { isRejectedFlow: boolean; steps: { label: string; hint: string; state: QuotationPipelineStepState }[] } {
  const s1 = { label: 'Nháp', hint: 'Soạn báo giá' }
  const s2 = { label: 'Chờ duyệt', hint: 'Gửi phê duyệt' }
  const waitOutcome = { label: 'Đợi kết quả duyệt', hint: 'Chưa có kết luận' }

  if (quotationStatus === 'Rejected') {
    return {
      isRejectedFlow: true,
      steps: [
        { ...s1, state: 'done' },
        { ...s2, state: 'done' },
        { label: 'Từ chối', hint: 'Báo giá không được chấp nhận', state: 'done' },
      ],
    }
  }

  if (quotationStatus === 'Canceled') {
    return {
      isRejectedFlow: false,
      steps: [
        { ...s1, state: 'done' },
        { label: 'Đã hủy', hint: 'Báo giá không còn hiệu lực', state: 'done' },
      ],
    }
  }

  const inApprovedBucket: SellerApiOrderStatus[] = ['Approved', 'Producing', 'Done']

  if (quotationStatus === 'Draft') {
    return {
      isRejectedFlow: false,
      steps: [
        { ...s1, state: 'current' },
        { ...s2, state: 'upcoming' },
        { ...waitOutcome, state: 'upcoming' },
      ],
    }
  }

  if (quotationStatus === 'Pending') {
    return {
      isRejectedFlow: false,
      steps: [
        { ...s1, state: 'done' },
        { ...s2, state: 'done' },
        { ...waitOutcome, state: 'current' },
      ],
    }
  }

  // quotationStatus === 'Approved'
  if (inApprovedBucket.includes(orderStatus)) {
    return {
      isRejectedFlow: false,
      steps: [
        { ...s1, state: 'done' },
        { ...s2, state: 'done' },
        { label: 'Đã duyệt', hint: '', state: 'done' },
      ],
    }
  }

  return {
    isRejectedFlow: false,
    steps: [
      { ...s1, state: 'done' },
      { ...s2, state: 'done' },
      { label: 'Đã duyệt', hint: '', state: 'current' },
    ],
  }
}

/** GET /api/seller/quotations/:id — fallback GET đơn + suy ra quotationStatus. */
export async function fetchSellerQuotationById(id: string): Promise<SellerQuotationListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/seller/quotations/${encodeURIComponent(id)}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<SellerQuotationListDto>
  if (res.ok && envelope.success && envelope.data) {
    const d = envelope.data
    if (!d.quotationStatus) {
      return { ...d, quotationStatus: inferQuotationStatusFromOrder(d) }
    }
    return d
  }
  const order = await fetchSellerOrderById(id)
  return {
    ...order,
    quotationStatus: inferQuotationStatusFromOrder(order),
  }
}

export type FetchSellerQuotationOrdersParams = {
  page?: number
  size?: number
  status?: SellerApiOrderStatus
}

/** GET /api/seller/quotations/:id/orders — đơn fulfillment tạo từ báo giá. */
export async function fetchSellerQuotationOrders(
  quotationId: string,
  params: FetchSellerQuotationOrdersParams = {},
): Promise<SellerOrdersRawPage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.status) q.set('status', params.status)

  const res = await fetch(
    `${API_BASE_URL}/api/seller/quotations/${encodeURIComponent(quotationId)}/orders?${q.toString()}`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrdersRawPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách đơn từ báo giá')
  }
  const data = envelope.data
  return {
    ...data,
    content: data.content.filter(isFulfillmentRecord),
  }
}
