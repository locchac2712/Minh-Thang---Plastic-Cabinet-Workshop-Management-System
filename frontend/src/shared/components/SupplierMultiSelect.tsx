import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  AdminSupplierApiError,
  fetchAdminSuppliers,
  type SupplierResponse,
} from '../../admin/partners/adminSuppliersApi'

type Props = {
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  /** Chỉ NCC active (mặc định true) */
  activeOnly?: boolean
}

export function SupplierMultiSelect({
  value,
  onChange,
  disabled = false,
  activeOnly = true,
}: Props) {
  const fid = useId()
  const [options, setOptions] = useState<SupplierResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    void (async () => {
      try {
        const all: SupplierResponse[] = []
        let page = 0
        for (;;) {
          const data = await fetchAdminSuppliers({ page, size: 100 })
          all.push(...data.content)
          if (data.last || data.content.length === 0) break
          page += 1
          if (page > 20) break
        }
        if (!cancelled) {
          setOptions(activeOnly ? all.filter((s) => s.isActive) : all)
        }
      } catch (e) {
        if (!cancelled) {
          setOptions([])
          setLoadError(
            e instanceof AdminSupplierApiError ? e.message : 'Không tải được danh sách NCC',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeOnly])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((s) => s.name.toLowerCase().includes(q))
  }, [options, query])

  const toggle = useCallback(
    (id: string) => {
      if (disabled) return
      if (value.includes(id)) {
        onChange(value.filter((x) => x !== id))
      } else {
        onChange([...value, id])
      }
    },
    [disabled, onChange, value],
  )

  const selectedNames = useMemo(() => {
    const map = new Map(options.map((s) => [s.id, s.name]))
    return value.map((id) => map.get(id) ?? id.slice(0, 8))
  }, [options, value])

  return (
    <div className="th-supplier-multi">
      {loadError ? (
        <p className="th-admin-users__api-error" role="alert">
          {loadError}
        </p>
      ) : null}
      {selectedNames.length > 0 ? (
        <div className="th-supplier-multi__chips" aria-label="NCC đã chọn">
          {selectedNames.map((name, i) => (
            <span key={value[i]} className="th-supplier-multi__chip">
              {name}
              {!disabled ? (
                <button
                  type="button"
                  className="th-supplier-multi__chip-remove"
                  onClick={() => toggle(value[i])}
                  aria-label={`Bỏ ${name}`}
                >
                  ×
                </button>
              ) : null}
            </span>
          ))}
        </div>
      ) : (
        <p className="th-supplier-multi__hint">Chưa chọn NCC nào.</p>
      )}
      {!disabled ? (
        <>
          <label className="th-admin-product-create__field" htmlFor={`${fid}-q`}>
            <span className="th-admin-product-create__label">Thêm NCC cung cấp</span>
            <input
              id={`${fid}-q`}
              type="search"
              className="th-admin-product-create__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm tên NCC…"
              disabled={loading}
              autoComplete="off"
            />
          </label>
          <ul className="th-supplier-multi__list" role="listbox" aria-multiselectable="true">
            {loading ? (
              <li className="th-supplier-multi__empty">Đang tải…</li>
            ) : filtered.length === 0 ? (
              <li className="th-supplier-multi__empty">Không có NCC phù hợp.</li>
            ) : (
              filtered.map((s) => {
                const checked = value.includes(s.id)
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      className={`th-supplier-multi__option${checked ? ' is-selected' : ''}`}
                      onClick={() => toggle(s.id)}
                    >
                      <span>{s.name}</span>
                      {checked ? (
                        <span className="material-symbols-outlined" aria-hidden>
                          check
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </>
      ) : null}
    </div>
  )
}
