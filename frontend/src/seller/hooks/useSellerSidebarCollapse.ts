import { useCallback, useEffect, useState } from 'react'

const LS_KEY = 'tunhua-seller-sidebar-collapsed'
const HTML_CLASS = 'th-seller-sidebar-collapsed'

function readCollapsed(fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw === null) return fallback
    const v = JSON.parse(raw) as unknown
    return typeof v === 'boolean' ? v : fallback
  } catch {
    return fallback
  }
}

/** Rail sidebar Seller — tách biệt key/class với Admin để hai shell không đè state. */
export function useSellerSidebarCollapse() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1025px)').matches : true
  )
  const [collapsed, setCollapsed] = useState(() => readCollapsed(false))

  const isNarrow = isDesktop && collapsed

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1025px)')
    const onChange = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(collapsed))
    } catch {
      /* ignore */
    }
  }, [collapsed])

  useEffect(() => {
    document.documentElement.classList.toggle(HTML_CLASS, isNarrow)
    return () => document.documentElement.classList.remove(HTML_CLASS)
  }, [isNarrow])

  const toggle = useCallback(() => {
    setCollapsed((c) => !c)
  }, [])

  return { collapsed, isNarrow, isDesktop, toggle }
}
