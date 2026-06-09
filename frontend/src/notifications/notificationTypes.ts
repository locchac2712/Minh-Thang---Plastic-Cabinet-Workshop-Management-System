export type NotificationItemDto = {
  id: string
  type: string
  title: string
  body: string
  targetUrl: string | null
  metaJson: string | null
  createdAt: string
  isRead: boolean
  readAt: string | null
}

export type NotificationPageResponse = {
  content: NotificationItemDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type UnreadCountResponse = {
  unreadCount: number
}

export type ApiEnvelope<T> = {
  success?: boolean
  statusCode?: number
  message?: string
  data?: T
}

export type ApiErrorJson = {
  success?: boolean
  statusCode?: number
  message?: string
  errors?: Record<string, string>
}
