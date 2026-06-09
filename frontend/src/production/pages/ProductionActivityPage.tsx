import { useCallback, useEffect, useId, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Input } from 'antd'
import { fetchMeProfile } from '../../auth/authApi'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { productionPaths } from '../config/productionPaths'
import {
  createProductionTaskLog,
  fetchProductionTaskLogs,
  fetchProductionTasks,
  uploadProductionImageFile,
  type ProductionTaskDto,
  type ProductionTaskLogEntryDto,
} from '../productionTasksApi'
import { ProductionActivityTaskSelect } from '../components/ProductionActivityTaskSelect'
import { productionTaskRef, productionTaskRefFromId } from '../utils/productionTaskRef'
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

function taskDetailPath(t: ProductionTaskDto): string {
  const ref = productionTaskRef(t)
  return t.orderId ? productionPaths.tasks.byOrderTask(ref) : productionPaths.tasks.internalTask(ref)
}

const LOG_BODY_MAX_CHARS = 265

type TaskCompletionScope = 'open' | 'all'

function isOpenProductionTask(t: ProductionTaskDto): boolean {
  return t.status !== 'Done'
}

type ActivityLocationState = {
  preselectTaskId?: string
}

export function ProductionActivityPage() {
  const location = useLocation()
  const fid = useId()
  const [tasks, setTasks] = useState<ProductionTaskDto[]>([])
  const [tasksLoading, setTasksLoading] = useState(true)
  const [tasksError, setTasksError] = useState<string | null>(null)

  const [me, setMe] = useState<{ id: string } | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [meError, setMeError] = useState<string | null>(null)

  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [taskCompletionScope, setTaskCompletionScope] = useState<TaskCompletionScope>('open')
  const [logs, setLogs] = useState<ProductionTaskLogEntryDto[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [logsError, setLogsError] = useState<string | null>(null)

  const [draftBody, setDraftBody] = useState('')
  const [draftImageFile, setDraftImageFile] = useState<File | null>(null)
  const [draftImagePreview, setDraftImagePreview] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [bodyError, setBodyError] = useState<string | null>(null)

  useEffect(() => {
    if (!draftImageFile) {
      setDraftImagePreview(null)
      return
    }
    const url = URL.createObjectURL(draftImageFile)
    setDraftImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [draftImageFile])

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
    const pre = (location.state as ActivityLocationState | null)?.preselectTaskId?.trim()
    if (!pre || tasksLoading || tasks.length === 0) return
    if (tasks.some((t) => t.id === pre)) {
      setSelectedTaskId(pre)
      setTaskCompletionScope('open')
    }
  }, [location.state, tasks, tasksLoading])

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

  const visibleTasks = useMemo(() => {
    if (taskCompletionScope === 'all') return myTasks
    return myTasks.filter(isOpenProductionTask)
  }, [myTasks, taskCompletionScope])

  useEffect(() => {
    if (!selectedTaskId) return
    if (!visibleTasks.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId('')
    }
  }, [visibleTasks, selectedTaskId])

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
      setBodyError('Nhập việc đã làm — trường bắt buộc.')
      return
    }
    setBodyError(null)
    setFormSubmitting(true)
    try {
      let imageUrl: string | null = null
      if (draftImageFile) {
        imageUrl = await uploadProductionImageFile(draftImageFile)
      }
      await createProductionTaskLog(selectedTaskId, {
        description: desc,
        imageUrl,
      })
      setDraftBody('')
      setDraftImageFile(null)
      setBodyError(null)
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
            <div className="th-prod-daily__task-head">
              <label className="th-prod-daily__label" htmlFor={`${fid}-task`}>
                Lệnh của tôi (xem &amp; ghi nhật ký)
              </label>
              <label className="th-prod-daily__switch th-prod-daily__switch--scope">
                <span
                  className={
                    taskCompletionScope === 'open'
                      ? 'th-prod-daily__switch-side th-prod-daily__switch-side--active'
                      : 'th-prod-daily__switch-side'
                  }
                >
                  Chưa xong
                </span>
                <input
                  type="checkbox"
                  className="th-prod-daily__switch-input"
                  checked={taskCompletionScope === 'all'}
                  onChange={(e) => setTaskCompletionScope(e.target.checked ? 'all' : 'open')}
                  aria-describedby={`${fid}-task-hint`}
                />
                <span className="th-prod-daily__switch-track" aria-hidden />
                <span
                  className={
                    taskCompletionScope === 'all'
                      ? 'th-prod-daily__switch-side th-prod-daily__switch-side--active'
                      : 'th-prod-daily__switch-side'
                  }
                >
                  Tất cả
                </span>
              </label>
            </div>
            <ProductionActivityTaskSelect
              id={`${fid}-task`}
              className="th-prod-daily__task-select"
              value={selectedTaskId}
              onChangeValue={setSelectedTaskId}
              tasks={visibleTasks}
              loading={tasksLoading || meLoading}
              disabled={tasksLoading || meLoading || !me?.id || visibleTasks.length === 0}
            />
            <p id={`${fid}-task-hint`} className="th-prod-daily__task-hint">
              {meLoading
                ? 'Đang tải hồ sơ…'
                : meError
                  ? meError
                  : !me?.id
                    ? 'Không xác định được tài khoản — không liệt kê lệnh.'
                    : myTasks.length === 0
                      ? 'Không có lệnh nào đang giao cho bạn.'
                      : taskCompletionScope === 'open' && visibleTasks.length === 0
                        ? 'Mọi lệnh của bạn đã hoàn thành — bật «Tất cả» để xem lại nhật ký.'
                        : taskCompletionScope === 'open'
                          ? `${visibleTasks.length} lệnh chưa xong · gõ trong dropdown để lọc.`
                          : `${myTasks.length} lệnh (gồm đã xong) · gõ trong dropdown để lọc.`}
            </p>
          </div>

          <section className="th-prod-daily__compose" aria-label="Cập nhật tiến độ">
            <h2 className="th-prod-daily__compose-title">Cập nhật tiến độ</h2>
            <p className="th-prod-daily__compose-hint">
              Ghi việc đã làm và tải ảnh minh hoạ (tuỳ chọn). Sau khi lưu, nhật ký bên phải được làm mới.
            </p>
            {formError ? (
              <p className="th-prod-daily__form-error" role="alert">
                {formError}
              </p>
            ) : null}
            <form className="th-prod-daily__form" onSubmit={(e) => void handleQuickSubmit(e)}>
              <div className="th-prod-daily__field">
                <label className="th-prod-daily__label" htmlFor={`${fid}-draft-body`}>
                  Việc đã làm <abbr title="bắt buộc">*</abbr>
                </label>
                <Input.TextArea
                  id={`${fid}-draft-body`}
                  className="th-prod-daily__textarea"
                  placeholder="Ví dụ: Dán cạnh xong tấm 2–5…"
                  value={draftBody}
                  onChange={(e) => {
                    const next = e.target.value
                    setDraftBody(next)
                    if (bodyError && next.trim()) setBodyError(null)
                  }}
                  onBlur={() => {
                    if (selectedTaskId && !draftBody.trim()) {
                      setBodyError('Nhập việc đã làm — trường bắt buộc.')
                    }
                  }}
                  disabled={!selectedTaskId}
                  maxLength={LOG_BODY_MAX_CHARS}
                  showCount
                  autoSize={{ minRows: 4 }}
                  required
                  aria-required
                  status={bodyError ? 'error' : undefined}
                  aria-invalid={bodyError ? true : undefined}
                  aria-describedby={bodyError ? `${fid}-draft-body-error` : undefined}
                />
                {bodyError ? (
                  <p id={`${fid}-draft-body-error`} className="th-prod-daily__field-error" role="alert">
                    {bodyError}
                  </p>
                ) : null}
              </div>
              <div className="th-prod-daily__field">
                <span className="th-prod-daily__label" id={`${fid}-draft-img-label`}>
                  Tải ảnh lên
                </span>
                <div className="th-prod-daily__upload">
                  <input
                    id={`${fid}-draft-img`}
                    className="th-prod-daily__upload-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={!selectedTaskId || formSubmitting}
                    aria-labelledby={`${fid}-draft-img-label`}
                    onChange={(e) => setDraftImageFile(e.target.files?.[0] ?? null)}
                  />
                  <label htmlFor={`${fid}-draft-img`} className="th-prod-daily__upload-btn">
                    <span className="material-symbols-outlined" aria-hidden>
                      add_photo_alternate
                    </span>
                    {draftImageFile ? 'Đổi ảnh' : 'Chọn ảnh từ máy'}
                  </label>
                  {draftImageFile ? (
                    <button
                      type="button"
                      className="th-prod-daily__upload-clear"
                      disabled={formSubmitting}
                      onClick={() => setDraftImageFile(null)}
                    >
                      Gỡ ảnh
                    </button>
                  ) : null}
                </div>
                {draftImageFile ? (
                  <p className="th-prod-daily__upload-name">{draftImageFile.name}</p>
                ) : (
                  <p className="th-prod-daily__upload-hint">JPG, PNG — tối đa theo giới hạn server.</p>
                )}
                {draftImagePreview ? (
                  <div className="th-prod-daily__upload-preview">
                    <img src={draftImagePreview} alt="Xem trước ảnh tiến độ" />
                  </div>
                ) : null}
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
                    visibleTasks.length === 0 ||
                    !draftBody.trim()
                  }
                >
                  {formSubmitting ? 'Đang tải lên…' : 'Lưu nhật ký'}
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
                            <code className="th-prod-daily__task-code">{productionTaskRef(selectedTask)}</code>
                          </Link>
                        ) : (
                          <code className="th-prod-daily__task-code">
                            {productionTaskRefFromId(log.taskId, log.taskDisplayCode)}
                          </code>
                        )}
                        <span className="th-prod-daily__task-label">
                          {selectedTask
                            ? `${selectedTask.productName?.trim() || 'Lệnh SX'} · SL ${selectedTask.quantity}`
                            : 'Lệnh SX'}
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
