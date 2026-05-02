import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { fetchMeProfile } from '../../auth/authApi'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { productionPaths } from '../config/productionPaths'
import {
  createProductionTaskLog,
  fetchProductionTaskLogs,
  fetchProductionTasks,
  type ProductionTaskDto,
  type ProductionTaskLogEntryDto,
} from '../productionTasksApi'
import './ProductionActivityPage.css'

function formatDayHeading(isoDateKey: string): string {
  const d = new Date(`${isoDateKey}T12:00:00`)
  if (Number.isNaN(d.getTime())) return isoDateKey
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function logDateKeyLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10)
  return d.toLocaleDateString('en-CA')
}

function logTimeLabel(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function taskOptionLabel(t: ProductionTaskDto): string {
  const name = (t.productName?.trim() || 'Lệnh SX').slice(0, 72)
  return t.orderId ? `${name} · Theo đơn` : `${name} · MTS`
}

function taskDetailPath(t: ProductionTaskDto): string {
  return t.orderId ? productionPaths.tasks.byOrderTask(t.id) : productionPaths.tasks.internalTask(t.id)
}

export function ProductionActivityPage() {
  const fid = useId()
  const [tasks, setTasks] = useState<ProductionTaskDto[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [tasksError, setTasksError] = useState<string | null>(null)

  const [me, setMe] = useState<{ id: string } | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [meError, setMeError] = useState<string | null>(null)

  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [logs, setLogs] = useState<ProductionTaskLogEntryDto[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)

  const [taskQuery, setTaskQuery] = useState('')

  const [draftBody, setDraftBody] = useState('')
  const [draftImageUrl, setDraftImageUrl] = useState('')
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    setTasksLoading(true)
    setTasksError(null)
    try {
      const all: ProductionTaskDto[] = []
      let page = 0
      const size = 100
      for (;;) {
        const data = await fetchProductionTasks({ page, size })
        all.push(...data.content)
        if (data.last || data.content.length === 0) break
        page += 1
        if (page > 40) break
      }
      setTasks(all)
    } catch (e) {
      setTasks([])
      setTasksError(e instanceof Error ? e.message : 'Không tải được danh sách lệnh')
    } finally {
      setTasksLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTasks()
  }, [loadTasks])

  useEffect(() => {
    let cancelled = false
    setMeLoading(true)
    void (async () => {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) {
          setMe(null)
          setMeError('Chưa đăng nhập')
          setMeLoading(false)
        }
        return
      }
      try {
        const data = await fetchMeProfile({ accessToken: token, tokenType: getTokenType() })
        if (!cancelled) {
          setMe({ id: data.id })
          setMeError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setMe(null)
          setMeError(e instanceof Error ? e.message : 'Không lấy được hồ sơ')
        }
      } finally {
        if (!cancelled) setMeLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedTaskId) {
      setLogs([])
      setLogsError(null)
      return
    }
    let cancelled = false
    setLogsLoading(true)
    setLogsError(null)
    void fetchProductionTaskLogs(selectedTaskId)
      .then((data) => {
        if (!cancelled) setLogs(data)
      })
      .catch((e) => {
        if (!cancelled) {
          setLogs([])
          setLogsError(e instanceof Error ? e.message : 'Không tải được nhật ký')
        }
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedTaskId])

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId],
  )

  /** Chỉ lệnh đang giao cho user đăng nhập — không hiện lệnh của thợ khác. */
  const myTasks = useMemo(() => {
    if (!me?.id) return []
    return tasks.filter((t) => t.assignedToId === me.id)
  }, [tasks, me?.id])

  const tasksForSelect = useMemo(() => {
    const q = taskQuery.trim().toLowerCase()
    let list = !q
      ? myTasks
      : myTasks.filter((t) => {
          const oid = t.orderId ?? ''
          return (
            t.id.toLowerCase().includes(q) ||
            oid.toLowerCase().includes(q) ||
            (t.productName ?? '').toLowerCase().includes(q) ||
            (t.customRequirements ?? '').toLowerCase().includes(q)
          )
        })
    if (selectedTaskId) {
      const selected = myTasks.find((t) => t.id === selectedTaskId)
      if (selected && !list.some((t) => t.id === selectedTaskId)) {
        list = [selected, ...list]
      }
    }
    return list
  }, [myTasks, taskQuery, selectedTaskId])

  useEffect(() => {
    if (!selectedTaskId) return
    if (!myTasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId('')
    }
  }, [myTasks, selectedTaskId])

  const byDate = useMemo(() => {
    const map = new Map<string, ProductionTaskLogEntryDto[]>()
    for (const log of logs) {
      const key = logDateKeyLocal(log.createdAt)
      const list = map.get(key) ?? []
      list.push(log)
      map.set(key, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [logs])

  async function handleQuickSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!selectedTaskId.trim()) {
      setFormError('Chọn lệnh ở ô phía trên trước khi ghi nhật ký.')
      return
    }
    const desc = draftBody.trim()
    if (!desc) {
      setFormError('Nhập nội dung nhật ký.')
      return
    }
    setFormSubmitting(true)
    try {
      await createProductionTaskLog(selectedTaskId, {
        description: desc,
        imageUrl: draftImageUrl.trim() || null,
      })
      setDraftBody('')
      setDraftImageUrl('')
      try {
        const data = await fetchProductionTaskLogs(selectedTaskId)
        setLogs(data)
        setLogsError(null)
      } catch {
        /* đã lưu OK; stream có thể tự refetch từ effect */
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không ghi được nhật ký')
    } finally {
      setFormSubmitting(false)
    }
  }

  return (
    <div className="th-prod-daily">
      <header className="th-prod-daily__header">
        <h1 className="th-prod-daily__title">Nhật ký tiến độ xưởng</h1>
      </header>

      {tasksError ? (
        <p className="th-prod-daily__banner th-prod-daily__banner--error" role="alert">
          {tasksError}
        </p>
      ) : null}

      <div className="th-prod-daily__layout">
        <div className="th-prod-daily__panel" aria-label="Lệnh và ghi nhận">
          <div className="th-prod-daily__field th-prod-daily__field--task">
            <label className="th-prod-daily__label" htmlFor={`${fid}-task-q`}>
              Lệnh của tôi (xem &amp; ghi nhật ký)
            </label>
            <div className="th-prod-daily__search th-prod-daily__search--task">
              <span className="material-symbols-outlined th-prod-daily__search-icon" aria-hidden>
                search
              </span>
              <input
                id={`${fid}-task-q`}
                className="th-prod-daily__search-input"
                type="search"
                placeholder="Tìm trong lệnh của tôi (mã lệnh, đơn, sản phẩm…)"
                value={taskQuery}
                onChange={(e) => setTaskQuery(e.target.value)}
                autoComplete="off"
                disabled={tasksLoading || meLoading || !me?.id}
                aria-describedby={`${fid}-task-hint`}
              />
            </div>
            <select
              id={`${fid}-task`}
              className="th-prod-daily__select th-prod-daily__select--task"
              value={selectedTaskId}
              disabled={tasksLoading || meLoading || !me?.id || myTasks.length === 0}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              <option value="">— Chọn lệnh —</option>
              {tasksForSelect.map((t) => (
                <option key={t.id} value={t.id}>
                  {taskOptionLabel(t)}
                </option>
              ))}
            </select>
            <p id={`${fid}-task-hint`} className="th-prod-daily__task-hint">
              {meLoading
                ? 'Đang tải hồ sơ…'
                : meError
                  ? meError
                  : !me?.id
                    ? 'Không xác định được tài khoản — không liệt kê lệnh.'
                    : myTasks.length === 0
                      ? 'Không có lệnh nào đang giao cho bạn.'
                      : tasksForSelect.length === 0
                        ? 'Không có lệnh khớp ô tìm — đổi từ khóa hoặc xoá ô tìm.'
                        : `${myTasks.length} lệnh của bạn · đang hiện ${tasksForSelect.length} trong dropdown.`}
            </p>
          </div>

          <section className="th-prod-daily__compose" aria-label="Ghi tiến độ">
            <h2 className="th-prod-daily__compose-title">Ghi tiến độ</h2>
            <p className="th-prod-daily__compose-hint">
              Cùng lệnh đang chọn ở trên. Sau khi lưu, danh sách bên phải được làm mới.
            </p>
            {formError ? (
              <p className="th-prod-daily__form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <form className="th-prod-daily__form" onSubmit={(e) => void handleQuickSubmit(e)}>
              <div className="th-prod-daily__field">
                <label className="th-prod-daily__label" htmlFor={`${fid}-draft-body`}>
                  Việc đã làm
                </label>
                <textarea
                  id={`${fid}-draft-body`}
                  className="th-prod-daily__textarea"
                  rows={4}
                  placeholder="Ví dụ: Dán cạnh xong tấm 2–5…"
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  disabled={!selectedTaskId}
                />
              </div>
              <div className="th-prod-daily__field">
                <label className="th-prod-daily__label" htmlFor={`${fid}-draft-img`}>
                  URL ảnh (tuỳ chọn)
                </label>
                <input
                  id={`${fid}-draft-img`}
                  className="th-prod-daily__input"
                  type="url"
                  inputMode="url"
                  placeholder="https://…"
                  value={draftImageUrl}
                  onChange={(e) => setDraftImageUrl(e.target.value)}
                  autoComplete="off"
                  disabled={!selectedTaskId}
                />
              </div>
              <div className="th-prod-daily__form-actions">
                <button
                  type="submit"
                  className="th-prod-daily__btn th-prod-daily__btn--primary"
                  disabled={
                    formSubmitting ||
                    tasksLoading ||
                    meLoading ||
                    !selectedTaskId ||
                    myTasks.length === 0
                  }
                >
                  {formSubmitting ? 'Đang gửi…' : 'Lưu nhật ký'}
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="th-prod-daily__stream" aria-label="Nhật ký theo ngày">
          {!selectedTaskId ? (
            <p className="th-prod-daily__empty">
              Chọn một <strong>lệnh sản xuất</strong> ở danh sách để tải nhật ký.
            </p>
          ) : logsLoading ? (
            <p className="th-prod-daily__empty">Đang tải nhật ký…</p>
          ) : logsError ? (
            <p className="th-prod-daily__empty th-prod-daily__empty--error" role="alert">
              {logsError}
            </p>
          ) : byDate.length === 0 ? (
            <p className="th-prod-daily__empty">Chưa có bản ghi nhật ký cho lệnh này.</p>
          ) : (
            byDate.map(([date, entries]) => (
              <section key={date} className="th-prod-daily__day">
                <h2 className="th-prod-daily__day-title">{formatDayHeading(date)}</h2>
                <ul className="th-prod-daily__list">
                  {entries.map((log) => (
                    <li key={log.id} className="th-prod-daily__card">
                      <div className="th-prod-daily__card-top">
                        <time className="th-prod-daily__time" dateTime={log.createdAt}>
                          {logTimeLabel(log.createdAt)}
                        </time>
                        {selectedTask ? (
                          <span
                            className={
                              selectedTask.orderId
                                ? 'th-prod-daily__pill th-prod-daily__pill--order'
                                : 'th-prod-daily__pill th-prod-daily__pill--mts'
                            }
                          >
                            {selectedTask.orderId ? 'Theo đơn' : 'Dự trữ'}
                          </span>
                        ) : null}
                      </div>
                      <div className="th-prod-daily__card-task">
                        {selectedTask ? (
                          <Link className="th-prod-daily__task-link" to={taskDetailPath(selectedTask)}>
                            <code className="th-prod-daily__task-code">{selectedTask.id}</code>
                          </Link>
                        ) : (
                          <code className="th-prod-daily__task-code">{log.taskId}</code>
                        )}
                        <span className="th-prod-daily__task-label">
                          {selectedTask?.productName?.trim() || 'Lệnh SX'}
                        </span>
                      </div>
                      <p className="th-prod-daily__body">{log.description || '—'}</p>
                      {log.imageUrl?.trim() ? (
                        <div className="th-prod-daily__log-image">
                          <img src={log.imageUrl} alt="" loading="lazy" />
                        </div>
                      ) : null}
                      <div className="th-prod-daily__card-foot">
                        <span className="th-prod-daily__author">{log.userName}</span>
                        {log.imageUrl?.trim() ? (
                          <span className="th-prod-daily__photos">
                            <span className="material-symbols-outlined" aria-hidden>
                              photo_camera
                            </span>
                            Có ảnh
                          </span>
                        ) : (
                          <span className="th-prod-daily__photos th-prod-daily__photos--none">
                            Chưa ảnh
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
