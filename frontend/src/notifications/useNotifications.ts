import { useContext } from 'react'
import { NotificationsContext } from './NotificationsProvider'

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications phải được dùng bên trong NotificationsProvider')
  }
  return ctx
}
