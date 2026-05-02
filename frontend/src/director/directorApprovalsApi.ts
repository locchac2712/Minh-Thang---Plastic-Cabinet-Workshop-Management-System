import { getAccessToken, getTokenType } from '../auth/storage'
import type { SellerOrderListDto } from '../seller/sellerOrdersApi'
import type { SellerOrderKind, SellerOrderLineItem } from '../seller/data/sellerOrdersMock'
import type { DirectorPricingApprovalRow, DirectorPricingCaseKind } from './data/directorPricingApprovalsMock'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type OrderListPage = {
  content: SellerOrderListDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function dtoToOrderKind(d: SellerOrderListDto): SellerOrderKind {
  return d.items.some((i) => i.isCustom) ? 'custom' : 'ready_made'
}

function inferCaseKind(d: SellerOrderListDto): DirectorPricingCaseKind {
  if (d.items.some((i) => i.isCustom)) return 'custom_bom'
  if (d.totalAmount > 0 && d.discountAmount >= Math.max(500_000, d.totalAmount * 0.03)) return 'deep_discount'
  return 'margin_loss'
}

function mapItems(d: SellerOrderListDto): SellerOrderLineItem[] {
  return d.items.map((it, i) => ({
    lineNo: i + 1,
    sku: it.productSku,
    productName: it.productName,
    kind: it.isCustom ? 'custom' : 'catalog',
    qty: it.quantity,
    unitPriceVnd: it.unitPrice,
    unitCostAtTimeVnd: it.unitCostAtTime,
    lineTotalVnd: it.subtotal,
  }))
}

/** Map DTO hàng chờ duyệt GD → dòng bảng phê duyệt giá. */
export function mapDirectorOrderDtoToApprovalRow(d: SellerOrderListDto): DirectorPricingApprovalRow {
  const orderKind = dtoToOrderKind(d)
  const lineNames = d.items.map((i) => i.productName).filter(Boolean)
  const reasonSummary =
    d.note?.trim() ||
    (lineNames.length ? lineNames.join(' · ') : 'Chờ phê duyệt giá')

  return {
    id: d.id,
    orderCode: d.id,
    agencyShortName: d.agencyName,
    agencyCode: '—',
    orderKind,
    sellerName: d.createdByName,
    submittedAt: d.createdAt.slice(0, 10),
    orderValueVnd: d.totalPayable,
    marginPct: 0,
    floorMarginPct: 0,
    caseKind: inferCaseKind(d),
    reasonSummary,
    requirementExcerpt: null,
    discountRequestVnd: d.discountAmount,
    slaDueAt: '—',
    priority: d.totalPayable >= 30_000_000 ? 'high' : 'normal',
    metricsPlaceholder: true,
    orderNote: d.note,
    apiItems: mapItems(d),
  }
}

export type DirectorOrderNoteMergeKind = 'request_quote' | 'reject_price'

/** Nối note đơn hiện có với nội dung GD (gửi một trường `note` duy nhất lên API). */
export function mergeOrderNoteForDirectorAction(
  existingOrderNote: string | null | undefined,
  directorNote: string,
  kind: DirectorOrderNoteMergeKind,
): string {
  const input = directorNote.trim()
  if (!input) {
    throw new Error('Ghi chú Giám đốc không được để trống')
  }
  const label =
    kind === 'request_quote' ? 'Giám đốc yêu cầu báo giá' : 'Giám đốc từ chối giá'
  const addition = `\n\n  ${label}: ${input}`
  const base = (existingOrderNote ?? '').trim()
  return base ? `${base}${addition}` : `${label}: ${input}`
}

export type FetchDirectorApprovalOrdersParams = {
  page?: number
  size?: number
}

export async function fetchDirectorApprovalOrders(params: FetchDirectorApprovalOrdersParams): Promise<{
  content: DirectorPricingApprovalRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))

  const res = await fetch(`${API_BASE_URL}/api/director/approvals/orders?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<OrderListPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách đơn chờ duyệt')
  }
  const data = envelope.data
  return {
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    last: data.last,
    content: data.content.map(mapDirectorOrderDtoToApprovalRow),
  }
}

/** Mã đơn backend (UUID) — dùng cho PATCH reject/approve và GET chi tiết. */
export function isDirectorBackendOrderId(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim())
}

export type RejectDirectorOrderPayload = {
  /** Nội dung GD nhập (chỉ phần GD). */
  note: string
  /** ORDERS.note hiện tại — nối trước khi PATCH. */
  existingOrderNote?: string | null
}

/** PATCH /api/director/approvals/orders/:id/reject — body { note }. */
export async function rejectDirectorApprovalOrder(
  orderId: string,
  payload: RejectDirectorOrderPayload,
): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const note = mergeOrderNoteForDirectorAction(
    payload.existingOrderNote,
    payload.note,
    'reject_price',
  )
  const res = await fetch(
    `${API_BASE_URL}/api/director/approvals/orders/${encodeURIComponent(orderId)}/reject`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify({ note }),
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không từ chối được đơn')
  }
  return envelope.data
}

export type RequestRevisionDirectorOrderPayload = {
  note: string
  existingOrderNote?: string | null
}

/** PATCH /api/director/approvals/orders/:id/request-revision — body { note }; đơn thường về Draft. */
export async function requestRevisionDirectorApprovalOrder(
  orderId: string,
  payload: RequestRevisionDirectorOrderPayload,
): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const note = mergeOrderNoteForDirectorAction(
    payload.existingOrderNote,
    payload.note,
    'request_quote',
  )
  const res = await fetch(
    `${API_BASE_URL}/api/director/approvals/orders/${encodeURIComponent(orderId)}/request-revision`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify({ note }),
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không gửi được yêu cầu chỉnh')
  }
  return envelope.data
}

/** PATCH /api/director/approvals/orders/:id/approve — khóa phê duyệt giá (Approved). */
export async function approveDirectorApprovalOrder(orderId: string): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/director/approvals/orders/${encodeURIComponent(orderId)}/approve`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify({}),
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không phê duyệt được đơn')
  }
  return envelope.data
}

/** Chi tiết một đơn trong hàng chờ — thử GET theo id, không có thì quét trang đầu. */
export async function fetchDirectorApprovalOrderById(orderId: string): Promise<DirectorPricingApprovalRow> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  if (isDirectorBackendOrderId(orderId)) {
    const res = await fetch(
      `${API_BASE_URL}/api/director/approvals/orders/${encodeURIComponent(orderId)}`,
      {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      },
    )
    if (res.ok) {
      const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
      if (envelope.success && envelope.data) {
        return mapDirectorOrderDtoToApprovalRow(envelope.data)
      }
    }
  }
  const list = await fetchDirectorApprovalOrders({ page: 0, size: 100 })
  const hit = list.content.find((r) => r.orderCode === orderId)
  if (hit) return hit
  throw new Error('Không tìm thấy đơn trong hàng chờ duyệt')
}
