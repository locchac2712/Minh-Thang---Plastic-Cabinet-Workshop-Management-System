import { getAccessToken, getTokenType } from '../auth/storage'
import type {
  SellerOrderDetail,
  SellerOrderKind,
  SellerOrderLineItem,
  SellerOrderListRow,
  SellerOrderListRowStatus,
} from './data/sellerOrdersMock'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

export type SellerOrderPaymentStatus = 'Pending' | 'Completed' | 'Failed'

export type SellerOrderPaymentDto = {
  id: string
  orderId: string
  agencyId: string
  agencyName: string
  amount: number
  paymentMethod: string
  proofImage: string | null
  note: string | null
  status: SellerOrderPaymentStatus
  createdAt: string
}

export type SellerOrderActivityLogDto = {
  id: string
  taskId: string
  userId: string
  userName: string
  imageUrl: string | null
  description: string
  createdAt: string
}

export type SellerOrderProductionTaskDto = {
  taskId: string
  orderId: string
  productId: string | null
  productName: string | null
  quantity: number
  assignedToId: string | null
  assignedToName: string | null
  status: 'Waiting' | 'Doing' | 'Done'
  startDate: string | null
  expectedEndDate: string | null
  completedAt: string | null
  taskCreatedAt: string
  activityLogs: SellerOrderActivityLogDto[]
}

export type CreateSellerOrderPaymentPayload = {
  orderId: string
  agencyId: string
  amount: number
  paymentMethod: string
  proofImage: string | null
  note: string | null
}

export type SellerApiOrderStatus = 'Draft' | 'Pending' | 'Approved' | 'Producing' | 'Done' | 'Canceled'

export const SELLER_API_ORDER_STATUSES: SellerApiOrderStatus[] = [
  'Draft',
  'Pending',
  'Approved',
  'Producing',
  'Done',
  'Canceled',
]

export type SellerOrderListItemDto = {
  id: string
  productId: string
  productName: string
  productSku: string
  isCustom: boolean
  resourceUrl: string | null
  quantity: number
  unitPrice: number
  unitCostAtTime: number
  subtotal: number
}

export type SellerOrderListDto = {
  id: string
  agencyId: string
  agencyName: string
  createdById: string
  createdByName: string
  approverId: string | null
  approverName: string | null
  totalAmount: number
  discountAmount: number
  shippingFee: number
  totalPayable: number
  paidAmount: number
  expectedDeliveryDate: string | null
  shippingAddress: string
  status: SellerApiOrderStatus
  note: string | null
  createdAt: string
  updatedAt: string
  items: SellerOrderListItemDto[]
}

type OrderListPage = {
  content: SellerOrderListDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type SellerOrdersRawPage = OrderListPage

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function apiStatusToRowStatus(s: SellerApiOrderStatus): SellerOrderListRowStatus {
  switch (s) {
    case 'Draft':
      return 'draft'
    case 'Pending':
      return 'pending'
    case 'Approved':
      return 'approved'
    case 'Producing':
      return 'producing'
    case 'Done':
      return 'done'
    case 'Canceled':
      return 'canceled'
    default:
      return 'draft'
  }
}

function orderDtoToKind(d: SellerOrderListDto): SellerOrderKind {
  return d.items.some((i) => i.isCustom) ? 'custom' : 'ready_made'
}

export function mapSellerOrderListDtoToRow(d: SellerOrderListDto): SellerOrderListRow {
  const fromItems = d.items.map((i) => i.productName).filter(Boolean)
  const summary =
    d.note?.trim() ||
    (fromItems.length ? fromItems.join(' · ') : '—')

  return {
    id: d.id,
    orderCode: d.id,
    orderedAt: d.createdAt.slice(0, 10),
    agencyId: d.agencyId,
    agencyCode: '—',
    agencyShortName: d.agencyName,
    summary,
    lineCount: d.items.length,
    totalVnd: d.totalPayable,
    discountVnd: d.discountAmount,
    status: apiStatusToRowStatus(d.status),
    orderKind: orderDtoToKind(d),
  }
}

export type FetchSellerOrdersParams = {
  page?: number
  size?: number
  status?: SellerApiOrderStatus
}

export async function fetchSellerOrders(params: FetchSellerOrdersParams): Promise<{
  content: SellerOrderListRow[]
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
  if (params.status) q.set('status', params.status)

  const res = await fetch(`${API_BASE_URL}/api/seller/orders?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<OrderListPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách đơn hàng')
  }
  const data = envelope.data
  return {
    page: data.page,
    size: data.size,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    last: data.last,
    content: data.content.map(mapSellerOrderListDtoToRow),
  }
}

export async function fetchSellerOrdersRaw(params: FetchSellerOrdersParams): Promise<SellerOrdersRawPage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.status) q.set('status', params.status)

  const res = await fetch(`${API_BASE_URL}/api/seller/orders?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<OrderListPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách đơn hàng')
  }
  return envelope.data
}

/** Gọi page=0,size=1 cho từng status để lấy totalElements (tab đếm). */
export async function fetchSellerOrderTabTotals(): Promise<{
  all: number
  Draft: number
  Pending: number
  Approved: number
  Producing: number
  Done: number
  Canceled: number
}> {
  const filters: (SellerApiOrderStatus | undefined)[] = [
    undefined,
    'Draft',
    'Pending',
    'Approved',
    'Producing',
    'Done',
    'Canceled',
  ]
  const results = await Promise.all(
    filters.map((status) => fetchSellerOrders({ status, page: 0, size: 1 })),
  )
  return {
    all: results[0]!.totalElements,
    Draft: results[1]!.totalElements,
    Pending: results[2]!.totalElements,
    Approved: results[3]!.totalElements,
    Producing: results[4]!.totalElements,
    Done: results[5]!.totalElements,
    Canceled: results[6]!.totalElements,
  }
}

/** POST /api/seller/orders — chỉ dòng catalog (đơn sẵn). */
export type CreateSellerOrderItemPayload = {
  productId: string
  quantity: number
  unitPrice: number
}

/** POST/PUT /api/seller/orders — body khớp backend (không còn orderType / customRequirements). */
export type CreateSellerOrderPayload = {
  agencyId: string
  discountAmount: number
  shippingFee: number
  shippingAddress: string
  expectedDeliveryDate: string | null
  note: string | null
  items: CreateSellerOrderItemPayload[]
}

/**
 * Nối ghi chú từng dòng hàng theo `[#id] - Note` (id = id dòng form).
 * Thêm khối nội bộ nếu có.
 */
export function buildSellerOrderConcatenatedNote(
  lines: Array<{ id: string; lineNote: string }>,
  opts?: { internalNote?: string },
): string {
  const parts: string[] = []
  for (const ln of lines) {
    const t = ln.lineNote.trim()
    if (t) parts.push(`[#${ln.id}] - ${t}`)
  }
  if (opts?.internalNote?.trim()) {
    parts.push(`[Nội bộ] ${opts.internalNote.trim()}`)
  }
  return parts.join('\n')
}

export async function fetchSellerOrderById(id: string): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/seller/orders/${encodeURIComponent(id)}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được chi tiết đơn')
  }
  return envelope.data
}

/** PATCH /api/seller/orders/:id/push-production — Approved → Producing. */
export async function pushSellerOrderToProduction(orderId: string): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/seller/orders/${encodeURIComponent(orderId)}/push-production`,
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
    throw new Error(envelope.message || 'Không đẩy đơn xuống kho sản xuất được')
  }
  return envelope.data
}

/** PATCH /api/seller/orders/:id/mark-done — Producing → Done. */
export async function markSellerOrderDone(orderId: string): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/seller/orders/${encodeURIComponent(orderId)}/mark-done`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không hoàn thành đơn hàng được')
  }
  return envelope.data
}

/** Map DTO chi tiết API → SellerOrderDetail (timeline / xưởng tối giản). */
export function mapSellerOrderDtoToDetail(d: SellerOrderListDto): SellerOrderDetail {
  const row = mapSellerOrderListDtoToRow(d)
  const merchandiseNet = Math.max(0, d.totalAmount - d.discountAmount)
  const items: SellerOrderLineItem[] = d.items.map((it, i) => ({
    lineNo: i + 1,
    sku: it.productSku,
    productName: it.productName,
    kind: it.isCustom ? 'custom' : 'catalog',
    qty: it.quantity,
    unitPriceVnd: it.unitPrice,
    unitCostAtTimeVnd: it.unitCostAtTime,
    lineTotalVnd: it.subtotal,
  }))
  const createdAtDisplay = d.createdAt.includes('T')
    ? d.createdAt.replace('T', ' ').slice(0, 16)
    : d.createdAt.slice(0, 16)

  const apiOrderType: 'Standard' | 'Custom' = d.items.some((i) => i.isCustom) ? 'Custom' : 'Standard'

  return {
    ...row,
    orderCode: d.id,
    totalVnd: merchandiseNet,
    agencyLegalName: d.agencyName,
    agencyEmail: '—',
    agencyPhone: '—',
    agencyCity: '',
    agencyAddress: d.shippingAddress,
    subtotalBeforeDiscountVnd: d.totalAmount,
    shippingFeeVnd: d.shippingFee,
    serviceFeeVnd: 0,
    grandTotalVnd: d.totalPayable,
    depositVnd: d.paidAmount,
    balanceDueVnd: Math.max(0, d.totalPayable - d.paidAmount),
    expectedDeliveryDate: d.expectedDeliveryDate,
    factoryWindow: null,
    deliveryMethod: '—',
    internalNote: d.note?.trim() || '—',
    requirementDescription: null,
    items,
    timeline: [
      {
        at: createdAtDisplay,
        title: 'Cập nhật đơn',
        detail: `Trạng thái: ${d.status}`,
      },
    ],
    orderDetailSource: 'api',
    createdByName: d.createdByName,
    apiOrderType,
    apiOrderLinesForEdit: d.items.map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
  }
}

export async function createSellerOrder(payload: CreateSellerOrderPayload): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/seller/orders`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tạo được đơn hàng')
  }
  return envelope.data
}

/** PUT /api/seller/orders/:id — cùng body POST; backend chỉ cho phép khi đơn ở Draft. */
export async function updateSellerOrder(
  orderId: string,
  payload: CreateSellerOrderPayload,
): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/seller/orders/${encodeURIComponent(orderId)}`, {
    method: 'PUT',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không cập nhật được đơn hàng')
  }
  return envelope.data
}

/** PATCH /api/seller/orders/:id/submit — gửi đơn nháp lên duyệt (thường Draft → Pending). */
export async function submitSellerOrder(orderId: string): Promise<SellerOrderListDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/seller/orders/${encodeURIComponent(orderId)}/submit`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderListDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không gửi được đơn duyệt')
  }
  return envelope.data
}

/** GET /api/seller/orders/:id/payments — lịch sử thanh toán theo đơn. */
export async function fetchSellerOrderPayments(orderId: string): Promise<SellerOrderPaymentDto[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/seller/orders/${encodeURIComponent(orderId)}/payments`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderPaymentDto[]>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được lịch sử thanh toán')
  }
  return envelope.data
}

/** GET /api/seller/orders/:id/activity-logs — tiến độ xưởng theo đơn sản xuất. */
export async function fetchSellerOrderActivityLogs(orderId: string): Promise<SellerOrderActivityLogDto[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/seller/orders/${encodeURIComponent(orderId)}/activity-logs`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderActivityLogDto[]>
  if (!res.ok || !envelope.success || envelope.data == null) {
    throw new Error(envelope.message || 'Không tải được tiến độ xưởng')
  }
  return Array.isArray(envelope.data) ? envelope.data : []
}

/** GET /api/seller/orders/:id/production-tasks — task sản xuất kèm activity logs theo từng task. */
export async function fetchSellerOrderProductionTasks(
  orderId: string,
): Promise<SellerOrderProductionTaskDto[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/seller/orders/${encodeURIComponent(orderId)}/production-tasks`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderProductionTaskDto[]>
  if (!res.ok || !envelope.success || envelope.data == null) {
    throw new Error(envelope.message || 'Không tải được tiến độ xưởng')
  }
  return Array.isArray(envelope.data) ? envelope.data : []
}

export async function createSellerOrderPayment(
  payload: CreateSellerOrderPaymentPayload,
): Promise<SellerOrderPaymentDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/seller/payments`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
  const envelope = (await res.json()) as ApiEnvelope<SellerOrderPaymentDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tạo được thanh toán')
  }
  return envelope.data
}
