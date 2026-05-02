import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAccessToken, getTokenType } from '../../auth/storage'
import './AccountantPurchasingAlertsPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type Severity = 'critical' | 'low'
type SeverityFilter = 'all' | Severity

type AlertRow = {
  id: string
  code: string
  name: string
  unit: string
  stockQuantity: number
  minStockLevel: number
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

function alertSeverity(a: AlertRow): Severity {
  if (a.minStockLevel <= 0) return 'critical'
  return a.stockQuantity <= a.minStockLevel * 0.5 ? 'critical' : 'low'
}

function alertSeverityLabel(s: Severity): string {
  return s === 'critical' ? 'Khẩn' : 'Dưới min'
}

function severityRowClass(s: Severity): string {
  return s === 'critical' ? 'th-acc-alerts__sev th-acc-alerts__sev--critical' : 'th-acc-alerts__sev th-acc-alerts__sev--low'
}

export function AccountantPurchasingAlertsPage() {
  const fid = useId()
  const [rows, setRows] = useState<AlertRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [severity, setSeverity] = useState<SeverityFilter>('all')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setRows([])
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/accountant/purchases/low-stock-alerts`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<AlertRow[]>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được danh sách cảnh báo tồn thấp')
      }
      setRows(Array.isArray(envelope.data) ? envelope.data : [])
    } catch (e) {
      setRows([])
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách cảnh báo tồn thấp')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((a) => {
      const sev = alertSeverity(a)
      if (severity !== 'all' && sev !== severity) return false
      if (!q) return true
      return (
        a.code.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q)
      )
    })
  }, [rows, severity, search])

  return (
    <div className="th-acc-alerts">
      <header className="th-acc-alerts__header">
        <h1 className="th-acc-alerts__title">Cảnh báo tồn thấp</h1>
        {loadError ? <p className="th-acc-alerts__lead">{loadError}</p> : null}
      </header>

      <div className="th-acc-alerts__toolbar">
        <div className="th-acc-alerts__tabs" role="tablist" aria-label="Mức độ">
          {(
            [
              { id: 'all' as const, label: 'Tất cả' },
              { id: 'critical' as const, label: 'Khẩn' },
              { id: 'low' as const, label: 'Dưới min' },
            ] as const
          ).map((t) => {
            const active = severity === t.id
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? 'th-acc-alerts__tab th-acc-alerts__tab--active' : 'th-acc-alerts__tab'}
                onClick={() => setSeverity(t.id)}
              >
                {t.label}
              </button>
            )
          })}
        </div>
        <div className="th-acc-alerts__search">
          <span className="material-symbols-outlined" aria-hidden>
            search
          </span>
          <input
            id={`${fid}-q`}
            type="search"
            placeholder="Mã hàng, tên vật tư, NCC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="th-acc-table-shell">
        <table className="th-acc-data-table">
          <thead>
            <tr>
              <th scope="col">Mức độ</th>
              <th scope="col">Mã hàng / tên</th>
              <th scope="col">Material ID</th>
              <th scope="col" className="th-acc-data-table__num">
                Tồn
              </th>
              <th scope="col" className="th-acc-data-table__num">
                Tối thiểu
              </th>
              <th scope="col" className="th-acc-data-table__num">
                Thiếu
              </th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="th-acc-data-table__empty">
                  Không có cảnh báo khớp bộ lọc.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className={severityRowClass(alertSeverity(a))}>{alertSeverityLabel(alertSeverity(a))}</span>
                  </td>
                  <td>
                    <code className="th-acc-alerts__sku">{a.code}</code>
                    <div className="th-acc-alerts__name">{a.name}</div>
                  </td>
                  <td className="th-acc-data-table__zone">
                    <code>{a.id}</code>
                  </td>
                  <td className="th-acc-data-table__num">
                    {a.stockQuantity} {a.unit}
                  </td>
                  <td className="th-acc-data-table__num">{a.minStockLevel}</td>
                  <td className="th-acc-data-table__num th-acc-data-table__num--gap">
                    {Math.max(0, a.minStockLevel - a.stockQuantity)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="th-acc-alerts__footer">
        <Link className="th-acc-alerts__link" to="/admin/materials">
          Chi tiết vật tư (Admin)
          <span className="material-symbols-outlined" aria-hidden>
            open_in_new
          </span>
        </Link>
      </footer>
    </div>
  )
}
