import { getAccessToken, getTokenType } from '../auth/storage'
import type { ProductionTaskDto } from './productionTasksApi'
import { isProductionQueueOrder } from './utils/productionOrderRef'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

export type OrderItemBatchRemainingDto = {
  orderItemId: string
  productId: string
  productName: string
  orderedQuantity: number
  batchedQuantity: number
  remainingBatchable: number
}

export type ProductionOrderBatchesResponse = {
  orderId: string
  expectedDeliveryDate: string | null
  batches: ProductionTaskDto[]
  remainingByItem: OrderItemBatchRemainingDto[]
}

export type CreateProductionBatchPayload = {
  orderItemId: string
  quantity: number
  expectedEndDate: string
}

export type ProductionOrderQueueItemDto = {
  orderId: string
  orderDisplayCode?: string | null
  agencyName: string
  expectedDeliveryDate: string | null
  createdAt: string
  taskCount: number
  remainingBatchableTotal: number
  hasPendingBatch: boolean
}

export type ProductionOrderDetailDto = {
  orderId: string
  orderDisplayCode?: string | null
  agencyName: string
  status: string
  expectedDeliveryDate: string | null
  createdAt: string
  shippingAddress: string
  totalPayable: number
  taskCount: number
  remainingBatchableTotal: number
  hasPendingBatch: boolean
}

type ProductionOrderQueuePage = {
  content: ProductionOrderQueueItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type FetchProductionOrdersParams = {
  status?: string
  awaitingBatch?: boolean
  /** Mã DH, tên đại lý hoặc UUID đơn */
  search?: string
  page?: number
  size?: number
}

/** GET /api/production/orders — danh sách đơn cho xưởng. */
export async function fetchProductionOrders(
  params: FetchProductionOrdersParams = {},
): Promise<ProductionOrderQueuePage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('status', params.status ?? 'Producing')
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.awaitingBatch === true) {
    q.set('awaitingBatch', 'true')
  }
  if (params.search?.trim()) {
    q.set('search', params.search.trim())
  }
  const res = await fetch(`${API_BASE_URL}/api/production/orders?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<ProductionOrderQueuePage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách đơn sản xuất')
  }
  const data = envelope.data
  return {
    ...data,
    content: data.content.filter(isProductionQueueOrder),
  }
}

/** GET /api/production/orders/:orderId/tasks — toàn bộ lệnh SX của một đơn. */
export async function fetchProductionOrderTasks(orderId: string): Promise<ProductionTaskDto[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/orders/${encodeURIComponent(orderId)}/tasks`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskDto[]>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được lệnh của đơn')
  }
  return envelope.data
}

/** GET /api/production/orders/:orderId */
export async function fetchProductionOrderById(orderId: string): Promise<ProductionOrderDetailDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/orders/${encodeURIComponent(orderId)}`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionOrderDetailDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được chi tiết đơn')
  }
  return envelope.data
}

/** GET /api/production/orders/:orderId/batches */
export async function fetchProductionOrderBatches(
  orderId: string,
): Promise<ProductionOrderBatchesResponse> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/orders/${encodeURIComponent(orderId)}/batches`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionOrderBatchesResponse>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách lô')
  }
  return envelope.data
}

/** POST /api/production/orders/:orderId/batches */
export async function createProductionBatch(
  orderId: string,
  payload: CreateProductionBatchPayload,
): Promise<ProductionTaskDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/orders/${encodeURIComponent(orderId)}/batches`,
    {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tạo được lô sản xuất')
  }
  return envelope.data
}
