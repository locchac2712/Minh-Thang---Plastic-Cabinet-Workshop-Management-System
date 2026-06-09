import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  fetchWasteTeamDetails,
  fetchWasteTeams,
  putWasteTeamRemark,
  type DirectorWasteTeamDetails,
  type DirectorWasteTeamRow,
  type WasteSeverity,
} from '../directorWasteApi'
import './DirectorWastagePage.css'

function formatLocalISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function defaultMonthRange(): { fromDate: string; toDate: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const from = new Date(y, m, 1)
  const to = new Date(y, m + 1, 0)
  return { fromDate: formatLocalISODate(from), toDate: formatLocalISODate(to) }
}

function riskLabel(s: WasteSeverity): string {
  const m: Record<WasteSeverity, string> = {
    CRITICAL: 'Nghiêm trọng',
    HIGH: 'Cao',
    WATCH: 'Theo dõi',
    OK: 'Chấp nhận',
  }
  return m[s]
}

function riskClassName(s: WasteSeverity): string {
  if (s === 'CRITICAL') return 'th-director-ws__risk th-director-ws__risk--critical'
  if (s === 'HIGH') return 'th-director-ws__risk th-director-ws__risk--high'
  if (s === 'WATCH') return 'th-director-ws__risk th-director-ws__risk--watch'
  return 'th-director-ws__risk th-director-ws__risk--ok'
}

function formatOptionalInstant(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}

/** Tổ đội tay nghề & hao phí (wastage). */
export function DirectorWastagePage() {
  const fid = useId()
  const [{ fromDate, toDate }, setRange] = useState(defaultMonthRange)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [teams, setTeams] = useState<DirectorWasteTeamRow[]>([])
  const [details, setDetails] = useState<DirectorWasteTeamDetails | null>(null)
  const [selectedTeamUserId, setSelectedTeamUserId] = useState<string | null>(null)
  const [remarkDraft, setRemarkDraft] = useState('')

  const [teamsLoading, setTeamsLoading] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [teamsError, setTeamsError] = useState<string | null>(null)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [remarkSaving, setRemarkSaving] = useState(false)
  const [putRemarkError, setPutRemarkError] = useState<string | null>(null)

  const range = useMemo(() => ({ fromDate, toDate }), [fromDate, toDate])
  const rangeValid = fromDate.trim() !== '' && toDate.trim() !== '' && fromDate <= toDate

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 400)
    return () => window.clearTimeout(t)
  }, [search])

  const periodLabel = useMemo(
    () =>
      fromDate && toDate
        ? `Kỳ: ${fromDate} → ${toDate}`
        : 'Chọn kỳ',
    [fromDate, toDate],
  )

  useEffect(() => {
    if (!rangeValid) return
    let cancelled = false
    setTeamsLoading(true)
    setTeamsError(null)
    void (async () => {
      try {
        const list = await fetchWasteTeams({
          ...range,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        })
        if (!cancelled) {
          setTeams(list)
        }
      } catch (e) {
        if (!cancelled) {
          setTeamsError(e instanceof Error ? e.message : 'Lỗi tải bảng tổ')
          setTeams([])
        }
      } finally {
        if (!cancelled) setTeamsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [range, rangeValid, debouncedSearch])

  useEffect(() => {
    if (teams.length === 0) {
      setSelectedTeamUserId(null)
      return
    }
    setSelectedTeamUserId((prev) => {
      if (prev && teams.some((r) => r.teamUserId === prev)) return prev
      return teams[0]!.teamUserId
    })
  }, [teams])

  useEffect(() => {
    if (!rangeValid || !selectedTeamUserId) {
      setDetails(null)
      setDetailsError(null)
      return
    }
    let cancelled = false
    setDetailsLoading(true)
    setDetailsError(null)
    void (async () => {
      try {
        const d = await fetchWasteTeamDetails(selectedTeamUserId, range)
        if (!cancelled) setDetails(d)
      } catch (e) {
        if (!cancelled) {
          setDetailsError(e instanceof Error ? e.message : 'Không tải chi tiết')
          setDetails(null)
        }
      } finally {
        if (!cancelled) setDetailsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedTeamUserId, range, rangeValid])

  useEffect(() => {
    if (details) setRemarkDraft(details.remark ?? '')
  }, [details])

  const handleSaveRemark = useCallback(async () => {
    if (!selectedTeamUserId || !rangeValid) return
    setRemarkSaving(true)
    setPutRemarkError(null)
    try {
      const text = remarkDraft.trim()
      await putWasteTeamRemark(selectedTeamUserId, range, { remark: text.length ? text : null })
      const d = await fetchWasteTeamDetails(selectedTeamUserId, range)
      setDetails(d)
    } catch (e) {
      setPutRemarkError(e instanceof Error ? e.message : 'Không lưu được')
    } finally {
      setRemarkSaving(false)
    }
  }, [selectedTeamUserId, range, rangeValid, remarkDraft])

  return (
    <div className="th-director-ws">
      <header className="th-director-ws__header">
        <div>
          <p className="th-director-ws__period">
            <span className="material-symbols-outlined" aria-hidden>
              calendar_month
            </span>
            {periodLabel}
          </p>
          <h1 className="th-director-ws__title">Tổ đội tay nghề &amp; hao phí</h1>
        </div>
        <form
          className="th-director-ws__date-range"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="th-director-ws__date-range-row">
            <label className="th-director-ws__date-field">
              <span className="th-director-ws__date-label">Từ ngày</span>
              <input
                className="th-director-ws__date-input"
                type="date"
                value={fromDate}
                onChange={(e) => setRange((r) => ({ ...r, fromDate: e.target.value }))}
                max={toDate}
              />
            </label>
            <label className="th-director-ws__date-field">
              <span className="th-director-ws__date-label">Đến ngày</span>
              <input
                className="th-director-ws__date-input"
                type="date"
                value={toDate}
                onChange={(e) => setRange((r) => ({ ...r, toDate: e.target.value }))}
                min={fromDate}
              />
            </label>
            <button
              type="button"
              className="th-director-ws__date-btn"
              onClick={() => {
                const r = defaultMonthRange()
                setRange(r)
              }}
            >
              Tháng này
            </button>
          </div>
          {!rangeValid ? (
            <p className="th-director-ws__date-error" role="alert">
              Từ ngày phải trước hoặc bằng đến ngày.
            </p>
          ) : null}
        </form>
      </header>

      <div className="th-director-ws__toolbar">
        <div className="th-director-ws__search">
          <span className="material-symbols-outlined th-director-ws__search-icon" aria-hidden>
            search
          </span>
          <input
            id={`${fid}-search`}
            className="th-director-ws__search-input"
            type="search"
            placeholder="PIC, mã vật tư, tên vật tư…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            disabled={!rangeValid}
          />
        </div>
      </div>

      {teamsError ? (
        <p className="th-director-ws__banner-err" role="alert">
          {teamsError}
        </p>
      ) : null}

      {teamsLoading ? <p className="th-director-ws__inline-hint">Đang tải bảng tổ…</p> : null}

      <div className="th-director-ws__split">
        <div className="th-director-ws__table-wrap" aria-busy={teamsLoading}>
          <table className="th-director-ws-table">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">Tổ sản xuất</th>
                <th scope="col">Sản phẩm</th>
                <th scope="col" className="th-director-ws-table__col-num">
                  Số lần
                </th>
                <th scope="col" className="th-director-ws-table__col-num">
                  Số lượng
                </th>
                <th scope="col" className="th-director-ws-table__col-num">
                  Thiệt hại
                </th>
                <th scope="col">Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {teamsError ? (
                <tr>
                  <td colSpan={7} className="th-director-ws-table__empty">
                    Không tải được dữ liệu.
                  </td>
                </tr>
              ) : !rangeValid ? (
                <tr>
                  <td colSpan={7} className="th-director-ws-table__empty">
                    Chỉnh kỳ từ–đến hợp lệ.
                  </td>
                </tr>
              ) : teams.length === 0 && !teamsLoading ? (
                <tr>
                  <td colSpan={7} className="th-director-ws-table__empty">
                    Không có dữ liệu tổ trong kỳ / bộ lọc.
                  </td>
                </tr>
              ) : (
                teams.map((r) => {
                  const active = r.teamUserId === selectedTeamUserId
                  return (
                    <tr
                      key={r.teamUserId}
                      className={
                        active
                          ? 'th-director-ws-table__row th-director-ws-table__row--active'
                          : 'th-director-ws-table__row'
                      }
                      tabIndex={0}
                      role="button"
                      aria-selected={active}
                      aria-label={`Chọn tổ ${r.teamLabel ?? r.picName ?? r.teamUserId}`}
                      onClick={() => setSelectedTeamUserId(r.teamUserId)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedTeamUserId(r.teamUserId)
                        }
                      }}
                    >
                      <td className="th-director-ws-table__rank">{r.rank}</td>
                      <td>
                        <span className="th-director-ws-table__name">{r.teamLabel ?? '—'}</span>
                      </td>
                      <td className="th-director-ws-table__muted">{r.areaLabel ?? '—'}</td>
                      <td className="th-director-ws-table__num">{r.eventCount}</td>
                      <td className="th-director-ws-table__num">{r.boardEquivalent}</td>
                      <td className="th-director-ws-table__money">{formatVND(r.estimatedDamageVnd)}</td>
                      <td>
                        <span className={riskClassName(r.severity)}>{riskLabel(r.severity)}</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <aside className="th-director-ws__detail" aria-label="Chi tiết tổ chọn">
          {detailsLoading ? <p className="th-director-ws__inline-hint">Đang tải chi tiết…</p> : null}
          {detailsError && !detailsLoading ? (
            <p className="th-director-ws__panel-err" role="alert">
              {detailsError}
            </p>
          ) : null}
          {!detailsLoading && details && !detailsError ? (
            <>
              <h2 className="th-director-ws__detail-title">Chi tiết hao phí</h2>
              <p className="th-director-ws__detail-sub">
                {details.teamLabel ?? details.picName ?? '—'} — {details.areaLabel ?? '—'}
              </p>
              <dl className="th-director-ws__dl">
                <dt>Sự kiện gần nhất</dt>
                <dd>{formatOptionalInstant(details.latestEventAt)}</dd>
                <dt>Vật tư nổi bật</dt>
                <dd>
                  {details.topMaterialName
                    ? `${details.topMaterialName}${details.topMaterialCode ? ` (${details.topMaterialCode})` : ''}`
                    : '—'}
                </dd>
                <dt>Diện tích quy đổi</dt>
                <dd>
                  {details.equivalentAreaSqm != null
                    ? `${details.equivalentAreaSqm} m²`
                    : '— (chưa gán)'}
                </dd>
              </dl>
              <div className="th-director-ws__breakdown">
                <h3 className="th-director-ws__breakdown-title">Phân bổ theo mã vật tư</h3>
                <div className="th-director-ws__table-wrap th-director-ws__table-wrap--nested">
                  <table className="th-director-ws-mini">
                    <thead>
                      <tr>
                        <th scope="col">Mã hàng</th>
                        <th scope="col">Mô tả</th>
                        <th scope="col" className="th-director-ws-table__col-num">
                          SL
                        </th>
                        <th scope="col" className="th-director-ws-table__col-num">
                          Thiệt hại
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {details.materialRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="th-director-ws-table__empty">
                            Không có dòng vật tư.
                          </td>
                        </tr>
                      ) : (
                        details.materialRows.map((m) => (
                          <tr key={m.materialId}>
                            <td>
                              <code className="th-director-ws__sku">{m.materialCode}</code>
                            </td>
                            <td>{m.materialName}</td>
                            <td className="th-director-ws-table__num">{m.quantityAbs}</td>
                            <td className="th-director-ws-table__money">{formatVND(m.damageVnd)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="th-director-ws__note">
                <p className="th-director-ws__note-kicker">Nhận xét / hành động</p>
                <textarea
                  className="th-director-ws__remark-textarea"
                  rows={4}
                  value={remarkDraft}
                  onChange={(e) => setRemarkDraft(e.target.value)}
                  disabled={remarkSaving}
                  placeholder="Ghi chú theo tổ trong kỳ…"
                />
                {putRemarkError ? (
                  <p className="th-director-ws__panel-err" role="alert">
                    {putRemarkError}
                  </p>
                ) : null}
                <button
                  type="button"
                  className="th-director-ws__remark-btn"
                  onClick={() => void handleSaveRemark()}
                  disabled={remarkSaving || !rangeValid}
                >
                  {remarkSaving ? 'Đang lưu…' : 'Lưu nhận xét'}
                </button>
              </div>
            </>
          ) : !detailsLoading && !selectedTeamUserId && !detailsError ? (
            <p className="th-director-ws__detail-empty">Chọn một dòng để xem phân bổ vật tư.</p>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
