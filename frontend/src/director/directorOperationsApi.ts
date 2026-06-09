import { getAccessToken, getTokenType } from '../auth/storage'
import type {
  OrderFulfillmentSummaryDto,
  OrderProductionTaskDto,
} from '../shared/productionProgress/types'
import type { OrderWasteSummaryDto } from '../shared/productionProgress/OrderWastePanel'
import type { ProductionTaskDto } from '../production/productionTasksApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

export class DirectorOperationsApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'DirectorOperationsApiError'
    this.status = status
  }
}

export type DirectorOrderPipelineRow = {
  orderId: string
  displayCode?: string | null
  sourceDisplayCode?: string | null
  agencyName: string
  sellerName: string
  status: string
  totalPayable: number
  expectedDeliveryDate: string | null
  createdAt: string
  orderedQty: number
  batchedQty: number
  deliveredQty: number
  remainingToBatch: number
  remainingToDeliver: number
  fulfillmentComplete: boolean
  deliveryLate: boolean
  openTaskCount: number
}

export function orderRefFromPipelineRow(row: Pick<DirectorOrderPipelineRow, 'displayCode' | 'orderId'>): string {
  const code = row.displayCode?.trim()
  return code || row.orderId
}

export function orderRefFromProductionTask(
  row: Pick<ProductionTaskDto, 'orderDisplayCode' | 'orderId'>,
): string | null {
  if (!row.orderId) return null
  const code = row.orderDisplayCode?.trim()
  return code || row.orderId
}

export function taskRefFromProductionTask(
  row: Pick<ProductionTaskDto, 'id' | 'displayCode'>,
): string {
  const code = row.displayCode?.trim()
  return code || row.id
}

export type DirectorOperationsOrderDto = {
  id: string
  displayCode?: string | null
  sourceDisplayCode?: string | null
  agencyName: string
  createdByName: string
  status: string
}

export async function fetchDirectorOperationsOrder(idOrCode: string): Promise<DirectorOperationsOrderDto> {
  return directorGet<DirectorOperationsOrderDto>(
    `/api/director/operations/orders/${encodeURIComponent(idOrCode)}`,
  )
}

type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type FetchDirectorOrderPipelineParams = {
  page?: number
  size?: number
  status?: string
  fromDate?: string
  toDate?: string
  lateOnly?: boolean
}

function unwrapPage<T>(raw: unknown): PageResponse<T> {
  if (raw && typeof raw === 'object' && Array.isArray((raw as PageResponse<T>).content)) {
    return raw as PageResponse<T>
  }
  const w = raw as { success?: boolean; data?: PageResponse<T>; message?: string }
  if (w?.success && w.data) return w.data
  throw new Error(w?.message || 'Phản hồi pipeline đơn không hợp lệ')
}

export async function fetchDirectorOrderPipeline(
  params: FetchDirectorOrderPipelineParams = {},
): Promise<PageResponse<DirectorOrderPipelineRow>> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('Thiếu access token')
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.status) q.set('status', params.status)
  if (params.fromDate) q.set('from_date', params.fromDate)
  if (params.toDate) q.set('to_date', params.toDate)
  if (params.lateOnly) q.set('late_only', 'true')
  const res = await fetch(
    `${API_BASE_URL}/api/director/operations/order-pipeline?${q.toString()}`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const body = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in (body as object)
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new Error(msg || 'Không tải được pipeline đơn hàng')
  }
  return unwrapPage<DirectorOrderPipelineRow>(body)
}

type ApiEnvelope<T> = {
  success?: boolean
  data?: T
  message?: string
}

function unwrapData<T>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'content' in (raw as object)) {
    return raw as T
  }
  const w = raw as ApiEnvelope<T>
  if (w?.success && w.data != null) return w.data
  if (w?.data != null) return w.data
  if (Array.isArray(raw)) return raw as T
  throw new Error(w?.message || 'Phản hồi API không hợp lệ')
}

async function directorFetch(path: string, init?: RequestInit): Promise<Response> {
  const accessToken = getAccessToken()
  if (!accessToken) throw new Error('Thiếu access token')
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
      ...(init?.headers ?? {}),
    },
  })
}

async function directorGet<T>(path: string): Promise<T> {
  const res = await directorFetch(path)
  const body = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'message' in (body as object)
        ? String((body as { message?: string }).message ?? '')
        : res.statusText
    throw new DirectorOperationsApiError(msg || 'Yêu cầu thất bại', res.status)
  }
  return unwrapData<T>(body)
}

export async function fetchDirectorOrderProductionTasks(
  orderId: string,
): Promise<OrderProductionTaskDto[]> {
  return directorGet<OrderProductionTaskDto[]>(
    `/api/director/operations/orders/${encodeURIComponent(orderId)}/production-tasks`,
  )
}

export async function fetchDirectorOrderFulfillment(
  orderId: string,
): Promise<OrderFulfillmentSummaryDto> {
  return directorGet<OrderFulfillmentSummaryDto>(
    `/api/director/operations/orders/${encodeURIComponent(orderId)}/fulfillment`,
  )
}

export async function fetchDirectorOrderWaste(orderId: string): Promise<OrderWasteSummaryDto> {
  return directorGet<OrderWasteSummaryDto>(
    `/api/director/operations/orders/${encodeURIComponent(orderId)}/waste`,
  )
}

export type FetchDirectorOperationTasksParams = {
  page?: number
  size?: number
  status?: string
}

export async function fetchDirectorOperationTasks(
  params: FetchDirectorOperationTasksParams = {},
): Promise<PageResponse<ProductionTaskDto>> {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.status) q.set('status', params.status)
  return directorGet<PageResponse<ProductionTaskDto>>(
    `/api/director/operations/tasks?${q.toString()}`,
  )
}

export async function fetchDirectorOperationTaskDetail(taskId: string): Promise<ProductionTaskDto> {
  return directorGet<ProductionTaskDto>(
    `/api/director/operations/tasks/${encodeURIComponent(taskId)}`,
  )
}
