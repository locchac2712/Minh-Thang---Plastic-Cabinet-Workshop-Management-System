import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { isAuthenticated } from '../auth/storage'
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from './notificationsApi'
import type { NotificationItemDto, NotificationPageResponse } from './notificationTypes'

const POLL_MS = 45_000
const AUTHLESS_PATHS = new Set(['/login', '/forgot-password', '/reset-password'])

type NotificationsContextValue = {
  enabled: boolean
  unreadCount: number
  refreshUnreadCount: (signal?: AbortSignal) => Promise<void>
  getInbox: (params?: { page?: number; size?: number; is_read?: boolean }) => Promise<NotificationPageResponse>
  markRead: (notificationId: string) => Promise<NotificationItemDto>
  markAllRead: () => Promise<void>
}

export const NotificationsContext = createContext<NotificationsContextValue | null>(null)

type Props = {
  children: ReactNode
}

export function NotificationsProvider({ children }: Props) {
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const baseTitleRef = useRef<string>(typeof document !== 'undefined' ? document.title : 'ERP')

  const enabled =
    isAuthenticated() &&
    !AUTHLESS_PATHS.has(location.pathname) &&
    !location.pathname.startsWith('/track/')

  const refreshUnreadCount = useCallback(
    async (signal?: AbortSignal) => {
      if (!enabled) {
        setUnreadCount(0)
        return
      }
      const count = await fetchUnreadCount({ signal })
      setUnreadCount(count)
    },
    [enabled],
  )

  useEffect(() => {
    if (!enabled) {
      setUnreadCount(0)
      return
    }
    const ac = new AbortController()
    void refreshUnreadCount(ac.signal).catch(() => undefined)
    return () => ac.abort()
  }, [enabled, refreshUnreadCount])

  useEffect(() => {
    if (!enabled) return

    let stopped = false
    const tick = () => {
      if (stopped) return
      if (document.visibilityState === 'hidden') return
      void refreshUnreadCount().catch(() => undefined)
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }

    const timer = window.setInterval(tick, POLL_MS)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, refreshUnreadCount])

  useEffect(() => {
    if (!enabled) {
      document.title = baseTitleRef.current
      return
    }
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ERP`
      return
    }
    document.title = baseTitleRef.current
  }, [enabled, unreadCount])

  const getInbox = useCallback(
    async (params?: { page?: number; size?: number; is_read?: boolean }) => {
      return fetchNotifications({
        page: params?.page ?? 0,
        size: params?.size ?? 20,
        is_read: params?.is_read,
      })
    },
    [],
  )

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setUnreadCount(0)
  }, [])

  const markRead = useCallback(async (notificationId: string) => {
    const item = await markNotificationRead(notificationId)
    setUnreadCount((count) => Math.max(0, count - 1))
    return item
  }, [])

  const value = useMemo<NotificationsContextValue>(
    () => ({
      enabled,
      unreadCount,
      refreshUnreadCount,
      getInbox,
      markRead,
      markAllRead,
    }),
    [enabled, unreadCount, refreshUnreadCount, getInbox, markRead, markAllRead],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}
