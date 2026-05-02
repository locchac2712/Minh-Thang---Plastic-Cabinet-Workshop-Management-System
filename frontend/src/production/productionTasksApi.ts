import { getAccessToken, getTokenType } from '../auth/storage'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

/** Trạng thái lệnh SX từ API — 3 giá trị. */
export type ProductionTaskApiStatus = 'Waiting' | 'Doing' | 'Done'

export type ProductionTaskDto = {
  id: string
  orderId: string | null
  orderType: string | null
  customRequirements: string | null
  productId: string | null
  productName: string | null
  quantity: number
  assignedToId: string | null
  assignedToName: string | null
  status: ProductionTaskApiStatus
  startDate: string | null
  expectedEndDate: string | null
  completedAt: string | null
  createdAt: string
  orderItems: unknown
  bomItems: unknown
}

/** Dòng đơn hàng gắn lệnh — GET .../tasks/:id/details */
export type ProductionTaskOrderLineDto = {
  id: string
  productId: string
  productName: string
  productSku: string
  customName: string | null
  quantity: number
  unitPrice: number
  unitCostAtTime: number
  subtotal: number
}

/** Dòng BOM vật tư — GET .../tasks/:id/details */
export type ProductionTaskBomLineDto = {
  materialId: string
  materialName: string
  materialCode: string
  unit: string
  quantityPerUnit: number
}

export type ProductionTaskDetailDto = Omit<ProductionTaskDto, 'orderItems' | 'bomItems'> & {
  orderItems: ProductionTaskOrderLineDto[]
  bomItems: ProductionTaskBomLineDto[]
}

/** Payload thô từ API — một số lệnh (vd. MTS) có thể trả null thay vì []. */
type ProductionTaskDetailRaw = Omit<ProductionTaskDetailDto, 'orderItems' | 'bomItems'> & {
  orderItems: ProductionTaskOrderLineDto[] | null
  bomItems: ProductionTaskBomLineDto[] | null
}

type TaskListPage = {
  content: ProductionTaskDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type FetchProductionTasksParams = {
  page?: number
  size?: number
}

/** GET /api/production/tasks — danh sách lệnh ráp / SX (phân trang). */
export async function fetchProductionTasks(
  params: FetchProductionTasksParams,
): Promise<TaskListPage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  const res = await fetch(`${API_BASE_URL}/api/production/tasks?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<TaskListPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách công việc')
  }
  return envelope.data
}

/** GET /api/production/tasks/:id/details — chi tiết lệnh (orderItems, bomItems). */
export async function fetchProductionTaskDetails(taskId: string): Promise<ProductionTaskDetailDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/tasks/${encodeURIComponent(taskId)}/details`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskDetailRaw>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được chi tiết lệnh')
  }
  const d = envelope.data
  return {
    ...d,
    orderItems: d.orderItems ?? [],
    bomItems: d.bomItems ?? [],
  }
}

/** Một dòng nhật ký tiến độ — GET /api/production/tasks/:taskId/logs */
export type ProductionTaskLogEntryDto = {
  id: string
  taskId: string
  userId: string
  userName: string
  imageUrl: string | null
  description: string
  createdAt: string
}

/** GET /api/production/tasks/:taskId/logs */
export async function fetchProductionTaskLogs(taskId: string): Promise<ProductionTaskLogEntryDto[]> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/tasks/${encodeURIComponent(taskId)}/logs`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskLogEntryDto[]>
  if (!res.ok || !envelope.success || envelope.data == null) {
    throw new Error(envelope.message || 'Không tải được nhật ký lệnh')
  }
  return Array.isArray(envelope.data) ? envelope.data : []
}

export type CreateProductionTaskLogBody = {
  description: string
  /** Tuỳ chọn — URL ảnh minh hoạ */
  imageUrl?: string | null
}

/** POST /api/production/tasks/:taskId/logs — ghi nhật ký tiến độ */
export async function createProductionTaskLog(
  taskId: string,
  body: CreateProductionTaskLogBody,
): Promise<ProductionTaskLogEntryDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/tasks/${encodeURIComponent(taskId)}/logs`,
    {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify({
        description: body.description,
        imageUrl: body.imageUrl?.trim() ? body.imageUrl.trim() : null,
      }),
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskLogEntryDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không ghi được nhật ký')
  }
  return envelope.data
}

export type ProductionInventoryTransactionType = 'IMPORT' | 'EXPORT' | 'WASTE'

export type ProductionInventoryLogDto = {
  id: string
  materialId: string
  materialName: string
  taskId: string | null
  purchaseId: string | null
  createdByName: string
  transactionType: ProductionInventoryTransactionType
  quantityChange: number
  unitPriceAtTime: number
  note: string | null
  createdAt: string
}

export type CreateProductionInventoryWasteBody = {
  taskId: string
  materialId: string
  quantityChange: number
  note?: string | null
}

type ProductionInventoryLogPage = {
  content: ProductionInventoryLogDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type FetchProductionInventoryLogsParams = {
  materialId?: string
  taskId?: string
  transactionType?: ProductionInventoryTransactionType
  page?: number
  size?: number
}

/** GET /api/production/inventory/logs — nhật ký nhập/xuất/waste vật tư */
export async function fetchProductionInventoryLogs(
  params: FetchProductionInventoryLogsParams,
): Promise<ProductionInventoryLogPage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  if (params.materialId?.trim()) q.set('material_id', params.materialId.trim())
  if (params.taskId?.trim()) q.set('task_id', params.taskId.trim())
  if (params.transactionType) q.set('transaction_type', params.transactionType)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  const res = await fetch(`${API_BASE_URL}/api/production/inventory/logs?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<ProductionInventoryLogPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được nhật ký NVL')
  }
  return envelope.data
}

/** POST /api/production/inventory/waste — xuất bù hư hỏng cho lệnh sản xuất. */
export async function createProductionInventoryWaste(
  body: CreateProductionInventoryWasteBody,
): Promise<ProductionInventoryLogDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(`${API_BASE_URL}/api/production/inventory/waste`, {
    method: 'POST',
    headers: {
      accept: '*/*',
      'Content-Type': 'application/json',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
    body: JSON.stringify({
      taskId: body.taskId.trim(),
      materialId: body.materialId.trim(),
      quantityChange: body.quantityChange,
      note: body.note?.trim() ? body.note.trim() : null,
    }),
  })
  const envelope = (await res.json()) as ApiEnvelope<ProductionInventoryLogDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không xuất bù hư hỏng được')
  }
  return envelope.data
}

export type ProductionMaterialDto = {
  id: string
  code: string
  name: string
  imageUrl: string | null
  unit: string
  unitCost: number
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
  createdAt: string
}

type ProductionMaterialListPage = {
  content: ProductionMaterialDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type FetchProductionMaterialsParams = {
  page?: number
  size?: number
  search?: string
  isActive?: boolean
}

/** GET /api/production/materials — query/response tương thích admin/materials */
export async function fetchProductionMaterials(
  params: FetchProductionMaterialsParams,
): Promise<ProductionMaterialListPage> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  if (params.search?.trim()) q.set('search', params.search.trim())
  if (typeof params.isActive === 'boolean') q.set('is_active', String(params.isActive))
  const res = await fetch(`${API_BASE_URL}/api/production/materials?${q.toString()}`, {
    headers: {
      accept: '*/*',
      Authorization: `${getTokenType()} ${accessToken}`,
    },
  })
  const envelope = (await res.json()) as ApiEnvelope<ProductionMaterialListPage>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không tải được danh sách vật tư')
  }
  return envelope.data
}

/** GET /api/production/materials/:id — chi tiết vật tư (đơn giá NVL cho ước tính BOM). */
export async function fetchProductionMaterialById(materialId: string): Promise<ProductionMaterialDto | null> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    return null
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/materials/${encodeURIComponent(materialId)}`,
    {
      headers: {
        accept: '*/*',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionMaterialDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    return null
  }
  return envelope.data
}

/** Ánh xạ status API → cột Kanban (slug). */
export function productionTaskStatusToColumn(
  s: ProductionTaskApiStatus,
): 'waiting' | 'doing' | 'done' {
  switch (s) {
    case 'Waiting':
      return 'waiting'
    case 'Doing':
      return 'doing'
    case 'Done':
      return 'done'
    default:
      return 'waiting'
  }
}

/** PATCH /api/production/tasks/:id/assign — gán lệnh cho thợ (body { assignedTo: userId }). */
export async function assignProductionTask(
  taskId: string,
  assignedToUserId: string,
): Promise<ProductionTaskDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/tasks/${encodeURIComponent(taskId)}/assign`,
    {
      method: 'PATCH',
      headers: {
        accept: '*/*',
        'Content-Type': 'application/json',
        Authorization: `${getTokenType()} ${accessToken}`,
      },
      body: JSON.stringify({ assignedTo: assignedToUserId }),
    },
  )
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không nhận việc được')
  }
  return envelope.data
}

/** PATCH /api/production/tasks/:id/start — Waiting → Doing (bắt đầu làm). */
export async function startProductionTask(taskId: string): Promise<ProductionTaskDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/tasks/${encodeURIComponent(taskId)}/start`,
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
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không bắt đầu được lệnh')
  }
  return envelope.data
}

/** PATCH /api/production/tasks/:id/complete — Doing → Done (hoàn tất lệnh). */
export async function completeProductionTask(taskId: string): Promise<ProductionTaskDto> {
  const accessToken = getAccessToken()
  if (!accessToken) {
    throw new Error('Thiếu access token')
  }
  const res = await fetch(
    `${API_BASE_URL}/api/production/tasks/${encodeURIComponent(taskId)}/complete`,
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
  const envelope = (await res.json()) as ApiEnvelope<ProductionTaskDto>
  if (!res.ok || !envelope.success || !envelope.data) {
    throw new Error(envelope.message || 'Không hoàn tất được lệnh')
  }
  return envelope.data
}
