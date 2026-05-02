import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import './CategorySearchSelect.css'

export type CategoryOption = { id: string; label: string }

type Props = {
  options: readonly CategoryOption[]
  value: string
  onChange: (id: string) => void
  /** Giao diện: thanh lọc (toolbar) hoặc ô form */
  variant?: 'toolbar' | 'field'
  /** Nhãn hiển thị khi không tìm thấy option khớp value */
  placeholder?: string
  /** id phần tử nhãn ngoài (toolbar) */
  'aria-labelledby'?: string
  /** Placeholder ô tìm trong panel */
  searchPlaceholder?: string
  /**
   * Khi bật: không lọc client — `options` do parent cung cấp (thường từ API).
   * Mỗi lần mở panel hoặc đổi nội dung ô tìm sẽ gọi `onRemoteSearch` (có debounce).
   */
  remoteSearch?: boolean
  onRemoteSearch?: (query: string) => void
  remoteSearchDebounceMs?: number
}

export function CategorySearchSelect({
  options,
  value,
  onChange,
  variant = 'field',
  placeholder = 'Chọn…',
  'aria-labelledby': ariaLabelledBy,
  searchPlaceholder = 'Tìm ngành hàng…',
  remoteSearch = false,
  onRemoteSearch,
  remoteSearchDebounceMs = 320,
}: Props) {
  const uid = useId()
  const listboxId = `${uid}-listbox`
  const searchId = `${uid}-search`

  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null)

  const selectedLabel = useMemo(() => {
    const hit = options.find((o) => o.id === value)
    return hit?.label ?? placeholder
  }, [options, value, placeholder])

  const q = search.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (remoteSearch) return options
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, q, remoteSearch])

  useEffect(() => {
    if (!open || !remoteSearch || !onRemoteSearch) return
    const query = search.trim()
    const t = window.setTimeout(() => {
      onRemoteSearch(query)
    }, remoteSearchDebounceMs)
    return () => window.clearTimeout(t)
  }, [open, search, remoteSearch, onRemoteSearch, remoteSearchDebounceMs])

  const updatePanelPos = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const width = Math.max(r.width, 220)
    let left = r.left
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8)
    setPanelPos({
      top: r.bottom + 4,
      left,
      width,
    })
  }, [])

  useLayoutEffect(() => {
    if (!open) {
      setPanelPos(null)
      return
    }
    updatePanelPos()
  }, [open, updatePanelPos])

  useEffect(() => {
    if (!open) return
    const onScrollResize = () => {
      updatePanelPos()
    }
    window.addEventListener('scroll', onScrollResize, true)
    window.addEventListener('resize', onScrollResize)
    return () => {
      window.removeEventListener('scroll', onScrollResize, true)
      window.removeEventListener('resize', onScrollResize)
    }
  }, [open, updatePanelPos])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) {
      setSearch('')
      requestAnimationFrame(() => searchInputRef.current?.focus())
    }
  }, [open])

  const handlePick = (id: string) => {
    onChange(id)
    setOpen(false)
    setSearch('')
    triggerRef.current?.focus()
  }

  const panel =
    open && panelPos
      ? createPortal(
          <div
            ref={panelRef}
            id={listboxId}
            className="th-cat-search-select__panel"
            role="listbox"
            style={{
              position: 'fixed',
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
              zIndex: 10050,
            }}
          >
            <div className="th-cat-search-select__search-wrap">
              <span className="material-symbols-outlined th-cat-search-select__search-icon" aria-hidden>
                search
              </span>
              <input
                id={searchId}
                ref={searchInputRef}
                type="search"
                className="th-cat-search-select__search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls={listboxId}
                onKeyDown={(e) => {
                  e.stopPropagation()
                }}
              />
            </div>
            <ul className="th-cat-search-select__list" role="presentation">
              {filtered.length === 0 ? (
                <li className="th-cat-search-select__empty">Không có kết quả</li>
              ) : (
                filtered.map((o) => (
                  <li key={o.id === '' ? '__all' : o.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={value === o.id}
                      className={`th-cat-search-select__option${value === o.id ? ' th-cat-search-select__option--active' : ''}`}
                      onClick={() => handlePick(o.id)}
                    >
                      {o.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>,
          document.body,
        )
      : null

  return (
    <div
      ref={rootRef}
      className={`th-cat-search-select th-cat-search-select--${variant}`}
    >
      <button
        ref={triggerRef}
        type="button"
        className="th-cat-search-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-labelledby={ariaLabelledBy}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="th-cat-search-select__trigger-text">{selectedLabel}</span>
        <span className="material-symbols-outlined th-cat-search-select__chevron" aria-hidden>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {panel}
    </div>
  )
}
