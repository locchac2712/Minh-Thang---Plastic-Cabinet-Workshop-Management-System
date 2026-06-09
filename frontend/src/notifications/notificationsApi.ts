import { getAccessToken, getTokenType } from '../auth/storage'
import type {
  ApiEnvelope,
  ApiErrorJson,
  NotificationItemDto,
  NotificationPageResponse,
  UnreadCountResponse,
} from './notificationTypes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

function authHeader(): Record<string, string> {
  const accessToken = getAccessToken()
  if (!accessToken) return {}
  return { Authorization: `${getTokenType()} ${accessToken}` }
}

async function readApiError(res: Response, body: unknown): Promise<string> {
  if (body && typeof body === 'object') {
    const payload = body as ApiErrorJson
    if (payload.message?.trim()) return payload.message.trim()
    if (payload.errors) {
      const first = Object.values(payload.errors).find(Boolean)
      if (first) return first
    }
  }
  return res.statusText || 'Lỗi không xác định'
}

function normalizeNotificationItem(raw: unknown): NotificationItemDto {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    type: String(r.type ?? ''),
    title: String(r.title ?? ''),
    body: String(r.body ?? ''),
    targetUrl: r.targetUrl != null && String(r.targetUrl).trim() ? String(r.targetUrl) : null,
    metaJson: r.metaJson != null && String(r.metaJson).trim() ? String(r.metaJson) : null,
    createdAt: String(r.createdAt ?? ''),
    // Jackson/Lombok boolean `isRead` thường serialize thành `read` thay vì `isRead`.
    isRead: r.isRead === true || r.read === true,
    readAt: r.readAt != null && String(r.readAt).trim() ? String(r.readAt) : null,
  }
}

function normalizeNotificationPage(raw: NotificationPageResponse): NotificationPageResponse {
  return {
    ...raw,
    content: Array.isArray(raw.content) ? raw.content.map(normalizeNotificationItem) : [],
  }
}

function unwrapData<T>(raw: unknown, errorMessage: string): T {
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const data = (raw as ApiEnvelope<T>).data
    if (data !== undefined && data !== null) return data
  }
  if (raw !== null && raw !== undefined && typeof raw === 'object' && !('success' in raw)) {
    return raw as T
  }
  throw new Error(errorMessage)
}

export async function fetchNotifications(params?: {
  is_read?: boolean
  page?: number
  size?: number
  signal?: AbortSignal
}): Promise<NotificationPageResponse> {
  const q = new URLSearchParams()
  if (params?.is_read !== undefined) q.set('is_read', String(params.is_read))
  q.set('page', String(params?.page ?? 0))
  q.set('size', String(params?.size ?? 20))
  const res = await fetch(`${API_BASE_URL}/api/notifications?${q.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...authHeader(),
    },
    signal: params?.signal,
  })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readApiError(res, body))
  }
  return normalizeNotificationPage(
    unwrapData<NotificationPageResponse>(body, 'Phản hồi danh sách thông báo không hợp lệ'),
  )
}

export async function fetchUnreadCount(params?: {
  signal?: AbortSignal
}): Promise<number> {
  const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
    headers: {
      Accept: 'application/json',
      ...authHeader(),
    },
    signal: params?.signal,
  })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readApiError(res, body))
  }
  const data = unwrapData<UnreadCountResponse>(body, 'Phản hồi số thông báo chưa đọc không hợp lệ')
  return Math.max(0, Number(data.unreadCount ?? 0))
}

export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationItemDto> {
  const res = await fetch(
    `${API_BASE_URL}/api/notifications/${encodeURIComponent(notificationId)}/read`,
    {
      method: 'PATCH',
      headers: {
        Accept: 'application/json',
        ...authHeader(),
      },
    },
  )
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readApiError(res, body))
  }
  return normalizeNotificationItem(
    unwrapData<NotificationItemDto>(body, 'Phản hồi đánh dấu đã đọc không hợp lệ'),
  )
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      ...authHeader(),
    },
  })
  const body: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(await readApiError(res, body))
  }
}
