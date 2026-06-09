import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../../notifications/useNotifications'
import type { NotificationItemDto } from '../../../notifications/notificationTypes'
import './notificationDropdown.css'

type Props = {
  narrow: boolean
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

export function NotificationBellDropdown({ narrow }: Props) {
  const navigate = useNavigate()
  const { enabled, unreadCount, refreshUnreadCount, getInbox, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busyMarkAll, setBusyMarkAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<NotificationItemDto[]>([])
  const rootRef = useRef<HTMLDivElement | null>(null)

  const hasUnreadInList = useMemo(() => items.some((x) => !x.isRead), [items])

  useEffect(() => {
    if (!open) return
    const onPointer = (ev: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(ev.target as Node)) {
        setOpen(false)
      }
    }
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  async function loadList() {
    setLoading(true)
    setError(null)
    try {
      const page = await getInbox({ page: 0, size: 20 })
      setItems(page.content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được thông báo')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  async function toggleOpen() {
    if (!enabled) return
    const next = !open
    setOpen(next)
    if (next) {
      await loadList()
      await refreshUnreadCount().catch(() => undefined)
    }
  }

  async function handleMarkAll() {
    if (!hasUnreadInList || busyMarkAll) return
    setBusyMarkAll(true)
    setError(null)
    try {
      await markAllRead()
      setItems((prev) =>
        prev.map((x) => ({
          ...x,
          isRead: true,
          readAt: x.readAt ?? new Date().toISOString(),
        })),
      )
      await refreshUnreadCount().catch(() => undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không đánh dấu được tất cả thông báo')
    } finally {
      setBusyMarkAll(false)
    }
  }

  async function handleItemClick(item: NotificationItemDto) {
    setError(null)
    try {
      if (!item.isRead) {
        const updated = await markRead(item.id)
        setItems((prev) =>
          prev.map((x) => (x.id === item.id ? { ...x, isRead: true, readAt: updated.readAt } : x)),
        )
        await refreshUnreadCount().catch(() => undefined)
      }
      if (item.targetUrl?.trim()) {
        navigate(item.targetUrl.trim())
        setOpen(false)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không xử lý được thông báo')
    }
  }

  if (!enabled) return null

  return (
    <div className="th-noti" ref={rootRef}>
      <button
        type="button"
        className="th-noti__trigger"
        onClick={() => void toggleOpen()}
        aria-label="Mở thông báo"
        aria-expanded={open}
        title={narrow ? 'Thông báo' : undefined}
      >
        <span className="th-noti__icon-wrap">
          <span className="material-symbols-outlined" aria-hidden>
            notifications
          </span>
          {unreadCount > 0 ? <span className="th-noti__badge">{Math.min(99, unreadCount)}</span> : null}
        </span>
        {!narrow ? <span className="th-noti__label">Thông báo</span> : null}
      </button>

      {open ? (
        <div className="th-noti__menu" role="menu" aria-label="Thông báo">
          <div className="th-noti__head">
            <strong>Thông báo</strong>
            <button
              type="button"
              className="th-noti__mark-all"
              onClick={() => void handleMarkAll()}
              disabled={!hasUnreadInList || busyMarkAll}
            >
              {busyMarkAll ? 'Đang xử lý…' : 'Đánh dấu tất cả đã đọc'}
            </button>
          </div>

          {error ? (
            <p className="th-noti__error" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="th-noti__state">Đang tải…</p>
          ) : items.length === 0 ? (
            <p className="th-noti__state">Chưa có thông báo.</p>
          ) : (
            <div className="th-noti__list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`th-noti__item${item.isRead ? '' : ' is-unread'}`}
                  onClick={() => void handleItemClick(item)}
                >
                  <div className="th-noti__item-row">
                    <strong>{item.title}</strong>
                    {!item.isRead ? <span className="th-noti__dot" aria-hidden /> : null}
                  </div>
                  <p>{item.body}</p>
                  <small>{formatWhen(item.createdAt)}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
