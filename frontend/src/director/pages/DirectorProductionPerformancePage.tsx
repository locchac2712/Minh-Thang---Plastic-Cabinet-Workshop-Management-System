import { useEffect, useMemo, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  fetchDirectorShopFloorReport,
  type ShopFloorAssigneeStats,
  type ShopFloorPerformanceReport,
} from '../directorShopFloorApi'
import {
  fetchWasteTeams,
  type DirectorWasteTeamRow,
  type WasteSeverity,
} from '../directorWasteApi'
import '../../admin/pages/AdminUsersPage.css'
import './DirectorProductionPerformancePage.css'

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
  return {
    fromDate: formatLocalISODate(new Date(y, m, 1)),
    toDate: formatLocalISODate(new Date(y, m + 1, 0)),
  }
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
  if (s === 'CRITICAL') return 'th-director-perf__risk th-director-perf__risk--critical'
  if (s === 'HIGH') return 'th-director-perf__risk th-director-perf__risk--high'
  if (s === 'WATCH') return 'th-director-perf__risk th-director-perf__risk--watch'
  return 'th-director-perf__risk th-director-perf__risk--ok'
}

type MergedPicRow = ShopFloorAssigneeStats & { waste?: DirectorWasteTeamRow }

function mergeAssigneeWithWaste(
  assignees: ShopFloorAssigneeStats[],
  wasteTeams: DirectorWasteTeamRow[],
): MergedPicRow[] {
  const wasteByUser = new Map(wasteTeams.map((w) => [w.teamUserId, w]))
  const rows: MergedPicRow[] = assignees.map((a) => ({
    ...a,
    waste: wasteByUser.get(a.userId),
  }))
  const seen = new Set(assignees.map((a) => a.userId))
  for (const w of wasteTeams) {
    if (seen.has(w.teamUserId)) continue
    rows.push({
      userId: w.teamUserId,
      fullName: w.picName?.trim() || w.teamLabel?.trim() || '—',
      doneCount: 0,
      withExpectedCount: 0,
      onTimeCount: 0,
      onTimePercent: 0,
      totalDoneQuantity: 0,
      waste: w,
    })
  }
  return rows.sort((a, b) => b.doneCount - a.doneCount || b.totalDoneQuantity - a.totalDoneQuantity)
}

function pct(n: number): string {
  return Number.isFinite(n) ? `${n.toFixed(1)}%` : '—'
}

/** Hiệu suất xưởng — KPI lệnh SX + bảng PIC (join hao phí). */
export function DirectorProductionPerformancePage() {
  const [{ fromDate, toDate }, setRange] = useState(defaultMonthRange)
  const [report, setReport] = useState<ShopFloorPerformanceReport | null>(null)
  const [wasteTeams, setWasteTeams] = useState<DirectorWasteTeamRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const [sf, waste] = await Promise.all([
          fetchDirectorShopFloorReport({ fromDate, toDate }),
          fetchWasteTeams({ fromDate, toDate }),
        ])
        if (cancelled) return
        setReport(sf)
        setWasteTeams(waste)
      } catch (e) {
        if (!cancelled) {
          setReport(null)
          setWasteTeams([])
          setError(e instanceof Error ? e.message : 'Không tải được hiệu suất xưởng')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [fromDate, toDate])

  const mergedRows = useMemo(
    () => mergeAssigneeWithWaste(report?.byAssignee ?? [], wasteTeams),
    [report, wasteTeams],
  )

  const kpi = report?.kpi
  const wip = report?.wip

  return (
    <div className="th-director-perf">
      <header className="th-director-perf__header">
        <p className="th-director-perf__period">
          <span className="material-symbols-outlined" aria-hidden>
            precision_manufacturing
          </span>
          Điều hành sản xuất
        </p>
        <h1 className="th-director-perf__title">Hiệu suất xưởng</h1>
      </header>

      <div className="th-director-perf__filters">
        <label className="th-director-perf__field">
          <span>Từ ngày</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setRange((r) => ({ ...r, fromDate: e.target.value }))}
          />
        </label>
        <label className="th-director-perf__field">
          <span>Đến ngày</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setRange((r) => ({ ...r, toDate: e.target.value }))}
          />
        </label>
      </div>

      {error ? (
        <p className="th-admin-users__api-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? <p className="th-director-perf__hint">Đang tải báo cáo…</p> : null}

      {!loading && report ? (
        <>
          <ul className="th-director-perf__stats">
            <li className="th-director-perf__stat">
              <span className="th-director-perf__stat-label">Lệnh hoàn thành</span>
              <span className="th-director-perf__stat-value">{kpi?.doneCompletedInPeriod ?? 0}</span>
            </li>
            <li className="th-director-perf__stat th-director-perf__stat--accent">
              <span className="th-director-perf__stat-label">Đúng hạn lệnh</span>
              <span className="th-director-perf__stat-value">{pct(Number(kpi?.onTimePercent ?? 0))}</span>
              <span className="th-director-perf__stat-hint">
                {kpi?.onTimeCount ?? 0} / {kpi?.doneWithExpectedDate ?? 0} có hẹn
              </span>
            </li>
            <li className="th-director-perf__stat th-director-perf__stat--warn">
              <span className="th-director-perf__stat-label">Lệnh trễ</span>
              <span className="th-director-perf__stat-value">{kpi?.lateCount ?? 0}</span>
              {kpi?.averageDelayDaysLate != null && Number(kpi.averageDelayDaysLate) > 0 ? (
                <span className="th-director-perf__stat-hint">
                  TB {Number(kpi.averageDelayDaysLate).toFixed(1)} ngày trễ
                </span>
              ) : null}
            </li>
            <li className="th-director-perf__stat">
              <span className="th-director-perf__stat-label">Lệnh đang xử lý</span>
              <span className="th-director-perf__stat-value">
                {(wip?.waitingCount ?? 0) + (wip?.doingCount ?? 0)} lệnh
              </span>
              <span className="th-director-perf__stat-hint">
                Số lượng {(wip?.waitingTotalQuantity ?? 0) + (wip?.doingTotalQuantity ?? 0)}
              </span>
            </li>
          </ul>

          <div className="th-director-perf__table-wrap">
            <h2 className="th-director-perf__table-title">Theo người phụ trách</h2>
            <table className="th-director-perf__table">
              <thead>
                <tr>
                  <th scope="col">Người phụ trách</th>
                  <th scope="col" className="th-director-perf__num">
                    Lệnh hoàn thành
                  </th>
                  <th scope="col" className="th-director-perf__num">
                    Sản lượng hoàn thành
                  </th>
                  <th scope="col" className="th-director-perf__num">
                    Tỷ lệ đúng hạn
                  </th>
                  <th scope="col" className="th-director-perf__num">
                    Số lần hao phí
                  </th>
                  <th scope="col" className="th-director-perf__num">
                    Thiệt hại ước tính
                  </th>
                  <th scope="col">Mức rủi ro hao phí</th>
                </tr>
              </thead>
              <tbody>
                {mergedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="th-director-perf__empty">
                      Không có dữ liệu trong kỳ.
                    </td>
                  </tr>
                ) : (
                  mergedRows.map((row) => (
                    <tr key={row.userId}>
                      <td>
                        <span className="th-director-perf__pic">{row.fullName}</span>
                        {row.waste?.teamLabel ? (
                          <span className="th-director-perf__team">{row.waste.teamLabel}</span>
                        ) : null}
                      </td>
                      <td className="th-director-perf__num">{row.doneCount}</td>
                      <td className="th-director-perf__num">{row.totalDoneQuantity}</td>
                      <td className="th-director-perf__num">{pct(Number(row.onTimePercent))}</td>
                      <td className="th-director-perf__num">{row.waste?.eventCount ?? '—'}</td>
                      <td className="th-director-perf__num">
                        {row.waste ? formatVND(row.waste.estimatedDamageVnd) : '—'}
                      </td>
                      <td>
                        {row.waste ? (
                          <span className={riskClassName(row.waste.severity)}>
                            {riskLabel(row.waste.severity)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
