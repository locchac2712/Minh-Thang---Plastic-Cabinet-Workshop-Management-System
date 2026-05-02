import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { formatVND } from '../../admin/partners/agencyModel'
import { fetchMeProfile } from '../../auth/authApi'
import { getAccessToken, getTokenType } from '../../auth/storage'
import {
  AppFilterBar,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import {
  createProductionInventoryWaste,
  fetchProductionInventoryLogs,
  fetchProductionMaterials,
  fetchProductionTaskDetails,
  fetchProductionTasks,
  type ProductionInventoryLogDto,
  type ProductionMaterialDto,
  type ProductionTaskDetailDto,
  type ProductionTaskDto,
} from '../productionTasksApi'
import './ProductionInventoryWastagePage.css'

function fmtDate(iso: string): string {
  const d = iso.trim()
  if (!d) return '—'
  const noMs = d.includes('.') ? (d.split('.')[0] ?? d) : d
  return noMs.replace('T', ' ')
}

function taskOptionLabel(t: ProductionTaskDto): string {
  const name = (t.productName?.trim() || 'Lệnh SX').slice(0, 72)
  return t.orderId ? `${name} · Theo đơn` : `${name} · MTS`
}

export function ProductionInventoryWastagePage() {
  const fid = useId()
  const wasteDlgTitleId = useId()
  const dlgRef = useRef<HTMLDialogElement>(null)

  const [materialId, setMaterialId] = useState('')
  const [search, setSearch] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [rows, setRows] = useState<ProductionInventoryLogDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [materials, setMaterials] = useState<ProductionMaterialDto[]>([])

  const [me, setMe] = useState<{ id: string } | null>(null)
  const [tasks, setTasks] = useState<ProductionTaskDto[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [tasksError, setTasksError] = useState<string | null>(null)

  const [wasteDialogOpen, setWasteDialogOpen] = useState(false)
  const [createTaskId, setCreateTaskId] = useState('')
  const [createMaterialId, setCreateMaterialId] = useState('')
  const [createQuantity, setCreateQuantity] = useState('1')
  const [createNote, setCreateNote] = useState('')
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createNotice, setCreateNotice] = useState<string | null>(null)

  const [taskDetail, setTaskDetail] = useState<ProductionTaskDetailDto | null>(null)
  const [taskDetailLoading, setTaskDetailLoading] = useState(false)
  const [taskDetailError, setTaskDetailError] = useState<string | null>(null)

  const loadMaterials = useCallback(async () => {
    try {
      const all: ProductionMaterialDto[] = []
      let page = 0
      for (;;) {
        const data = await fetchProductionMaterials({ page, size: 100 })
        all.push(...data.content)
        if (data.last || data.content.length === 0) break
        page += 1
        if (page > 40) break
      }
      setMaterials(all)
    } catch {
      setMaterials([])
    }
  }, [])

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

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProductionInventoryLogs({
        materialId,
        transactionType: 'WASTE',
        page: pageIndex,
        size: pageSize,
      })
      setRows(data.content)
      setTotalPages(data.totalPages)
      setTotalElements(data.totalElements)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được dữ liệu wastage')
    } finally {
      setLoading(false)
    }
  }, [materialId, pageIndex, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadMaterials()
  }, [loadMaterials])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) setMe(null)
        return
      }
      try {
        const data = await fetchMeProfile({ accessToken: token, tokenType: getTokenType() })
        if (!cancelled) setMe({ id: data.id })
      } catch {
        if (!cancelled) setMe(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!wasteDialogOpen) return
    void loadTasks()
  }, [wasteDialogOpen, loadTasks])

  useEffect(() => {
    const el = dlgRef.current
    if (!el) return
    if (wasteDialogOpen) {
      if (!el.open) el.showModal()
    } else if (el.open) {
      el.close()
    }
  }, [wasteDialogOpen])

  /** Chỉ lệnh đang giao cho user đăng nhập — giống trang nhật ký tiến độ. */
  const myTasks = useMemo(() => {
    if (!me?.id) return []
    return tasks.filter((t) => t.assignedToId === me.id)
  }, [tasks, me?.id])

  useEffect(() => {
    if (!createTaskId) return
    if (!myTasks.some((t) => t.id === createTaskId)) {
      setCreateTaskId('')
    }
  }, [myTasks, createTaskId])

  useEffect(() => {
    setCreateMaterialId('')
  }, [createTaskId])

  useEffect(() => {
    const tid = createTaskId.trim()
    if (!tid) {
      setTaskDetail(null)
      setTaskDetailError(null)
      setTaskDetailLoading(false)
      return
    }
    let cancelled = false
    setTaskDetailLoading(true)
    setTaskDetailError(null)
    void fetchProductionTaskDetails(tid)
      .then((d) => {
        if (!cancelled) setTaskDetail(d)
      })
      .catch((e) => {
        if (!cancelled) {
          setTaskDetail(null)
          setTaskDetailError(e instanceof Error ? e.message : 'Không tải được BOM')
        }
      })
      .finally(() => {
        if (!cancelled) setTaskDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [createTaskId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => {
      return (
        r.id.toLowerCase().includes(q) ||
        r.materialId.toLowerCase().includes(q) ||
        r.materialName.toLowerCase().includes(q) ||
        (r.taskId ?? '').toLowerCase().includes(q) ||
        (r.note ?? '').toLowerCase().includes(q) ||
        r.createdByName.toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  const openWasteDialog = useCallback(() => {
    setCreateError(null)
    setCreateNotice(null)
    setCreateTaskId('')
    setCreateMaterialId('')
    setCreateQuantity('1')
    setCreateNote('')
    setTaskDetail(null)
    setTaskDetailError(null)
    setWasteDialogOpen(true)
  }, [])

  const closeWasteDialog = useCallback(() => {
    if (createSubmitting) return
    setWasteDialogOpen(false)
  }, [createSubmitting])

  const handleCreateWaste = useCallback(async () => {
    const task = createTaskId.trim()
    const material = createMaterialId.trim()
    const qty = Number(createQuantity)
    if (!task) {
      setCreateError('Vui lòng chọn lệnh của bạn.')
      return
    }
    if (!myTasks.some((t) => t.id === task)) {
      setCreateError('Lệnh không thuộc danh sách đang giao cho bạn.')
      return
    }
    if (!material) {
      setCreateError('Vui lòng chọn vật tư trong BOM.')
      return
    }
    if (!taskDetail?.bomItems.some((b) => b.materialId === material)) {
      setCreateError('Vật tư phải chọn từ BOM của lệnh.')
      return
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setCreateError('Số lượng xuất bù phải lớn hơn 0.')
      return
    }
    setCreateSubmitting(true)
    setCreateError(null)
    setCreateNotice(null)
    try {
      const created = await createProductionInventoryWaste({
        taskId: task,
        materialId: material,
        quantityChange: -Math.abs(qty),
        note: createNote,
      })
      setCreateNotice(`Đã xuất bù thành công phiếu ${created.id}.`)
      setWasteDialogOpen(false)
      setCreateTaskId('')
      setCreateMaterialId('')
      setCreateQuantity('1')
      setCreateNote('')
      setTaskDetail(null)
      await load()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Không xuất bù hư hỏng được')
    } finally {
      setCreateSubmitting(false)
    }
  }, [
    createTaskId,
    createMaterialId,
    createQuantity,
    createNote,
    load,
    myTasks,
    taskDetail,
  ])

  const bomEmpty =
    Boolean(createTaskId.trim()) &&
    !taskDetailLoading &&
    !taskDetailError &&
    taskDetail &&
    taskDetail.bomItems.length === 0

  const canSubmitWaste =
    Boolean(createTaskId.trim() && createMaterialId.trim()) &&
    !taskDetailLoading &&
    !taskDetailError &&
    taskDetail &&
    taskDetail.bomItems.length > 0

  return (
    <div className="th-prod-waste">
      <header className="th-prod-waste__header">
        <h1 className="th-prod-waste__title">Hư hỏng / Wastage — xuất bổ sung</h1>
      </header>

      {loadError ? (
        <p className="th-prod-waste__hint" role="alert">
          {loadError}
        </p>
      ) : null}
      {loading ? <p className="th-prod-waste__hint">Đang tải dữ liệu wastage…</p> : null}
      {createNotice ? <p className="th-prod-waste__ok">{createNotice}</p> : null}

      <div className="th-prod-waste__main">
        <div className="th-prod-waste__panel">
          <div className="th-prod-waste__toolbar">
            <AppFilterBar>
              <AppFilterField className="th-prod-waste__tabs" label="Vật tư">
                <AppFilterSelect
                  value={materialId}
                  onChangeValue={(value) => {
                    setMaterialId(value)
                    setPageIndex(0)
                  }}
                  options={[
                    { value: '', label: 'Tất cả vật tư' },
                    ...materials.map((m) => ({ value: m.id, label: `${m.code} · ${m.name}` })),
                  ]}
                />
              </AppFilterField>
              <div className="th-prod-waste__actions">
                <button type="button" className="th-prod-waste__create-btn" onClick={openWasteDialog}>
                  Xuất bù hư hỏng
                </button>
              </div>
              <AppFilterField search className="th-prod-waste__search">
                <AppFilterInput
                  id={`${fid}-q`}
                  placeholder="Tìm: mã phiếu, lệnh SX, mã NVL, ghi chú…"
                  value={search}
                  onChangeValue={setSearch}
                />
              </AppFilterField>
            </AppFilterBar>
          </div>

          <div className="th-prod-table-shell">
            <table className="th-prod-data-table">
              <thead>
                <tr>
                  <th scope="col">Thời gian</th>
                  <th scope="col">Lệnh SX</th>
                  <th scope="col">Vật tư</th>
                  <th scope="col" className="th-prod-data-table__num">
                    Hao hụt
                  </th>
                  <th scope="col" className="th-prod-data-table__num">
                    Đơn giá
                  </th>
                  <th scope="col">Người tạo</th>
                  <th scope="col">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="th-prod-data-table__empty">
                      Không có phiếu khớp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filtered.map((r) => (
                    <tr key={r.id}>
                      <td>{fmtDate(r.createdAt)}</td>
                      <td>
                        <code className="th-prod-waste__req">{r.taskId ?? '—'}</code>
                      </td>
                      <td>
                        <code className="th-prod-waste__sku">{r.materialId}</code>
                        <div className="th-prod-waste__mat">{r.materialName}</div>
                      </td>
                      <td className="th-prod-data-table__num th-prod-data-table__num--bad">{r.quantityChange}</td>
                      <td className="th-prod-data-table__num">{formatVND(r.unitPriceAtTime)}</td>
                      <td>{r.createdByName}</td>
                      <td>
                        <div className="th-prod-waste__detail">{r.note ?? '—'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 ? (
            <AppPagination
              className="th-prod-waste__pager"
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={totalElements}
              simple
              showSizeChanger={false}
              onPageIndexChange={setPageIndex}
            />
          ) : null}
        </div>
      </div>

      <dialog
        ref={dlgRef}
        className="th-dlg"
        aria-labelledby={wasteDlgTitleId}
        aria-modal="true"
        onClose={closeWasteDialog}
        onClick={(e) => {
          if (e.target === dlgRef.current) closeWasteDialog()
        }}
      >
        <div className="th-dlg__panel th-admin-users th-prod-waste__dlg" onClick={(e) => e.stopPropagation()}>
          <header className="th-dlg__head">
            <div className="th-dlg__head-icon">
              <span className="material-symbols-outlined" aria-hidden>
                inventory_2
              </span>
            </div>
            <h2 id={wasteDlgTitleId} className="th-dlg__title">
              Xuất bù hư hỏng
            </h2>
            <button
              type="button"
              className="th-dlg__close"
              onClick={closeWasteDialog}
              disabled={createSubmitting}
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined" aria-hidden>
                close
              </span>
            </button>
          </header>
          <div className="th-dlg__body th-prod-dlg-body th-prod-waste__dlg-body">
            {createError ? (
              <p className="th-prod-waste__hint" role="alert">
                {createError}
              </p>
            ) : null}
            {tasksError ? (
              <p className="th-prod-waste__hint" role="alert">
                {tasksError}
              </p>
            ) : null}

            <div className="th-prod-waste__field">
              <label htmlFor={`${fid}-waste-task`}>Lệnh của tôi</label>
              <select
                id={`${fid}-waste-task`}
                value={createTaskId}
                onChange={(e) => setCreateTaskId(e.target.value)}
                disabled={tasksLoading || !me}
              >
                <option value="">{tasksLoading ? 'Đang tải lệnh…' : '— Chọn lệnh —'}</option>
                {myTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {taskOptionLabel(t)} — {t.id}
                  </option>
                ))}
              </select>
              {!me ? (
                <p className="th-prod-waste__dlg-muted">Cần đăng nhập để xem lệnh được giao.</p>
              ) : myTasks.length === 0 && !tasksLoading ? (
                <p className="th-prod-waste__dlg-muted">Không có lệnh nào đang giao cho bạn.</p>
              ) : null}
            </div>

            {createTaskId.trim() ? (
              <>
                {taskDetailLoading ? (
                  <p className="th-prod-waste__dlg-muted">Đang tải BOM…</p>
                ) : null}
                {taskDetailError ? (
                  <p className="th-prod-waste__hint" role="alert">
                    {taskDetailError}
                  </p>
                ) : null}
                {bomEmpty ? (
                  <p className="th-prod-waste__hint" role="status">
                    Lệnh này chưa có dòng BOM — không thể chọn vật tư để xuất bù.
                  </p>
                ) : null}
                {taskDetail && !taskDetailLoading && !taskDetailError && taskDetail.bomItems.length > 0 ? (
                  <>
                    <p className="th-prod-waste__bom-preview">
                      <strong>{taskDetail.productName?.trim() || 'Sản phẩm'}</strong>
                      {taskDetail.orderId ? ` · Đơn ${taskDetail.orderId}` : ' · MTS'}
                    </p>
                    <div className="th-prod-waste__field">
                      <label htmlFor={`${fid}-waste-material`}>Vật tư (theo BOM)</label>
                      <select
                        id={`${fid}-waste-material`}
                        value={createMaterialId}
                        onChange={(e) => setCreateMaterialId(e.target.value)}
                      >
                        <option value="">— Chọn NVL trong BOM —</option>
                        {taskDetail.bomItems.map((b) => (
                          <option key={b.materialId} value={b.materialId}>
                            {b.materialCode} · {b.materialName} ({b.unit}) · ĐM {b.quantityPerUnit}/SP
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}

            <div className="th-prod-waste__row2">
              <div className="th-prod-waste__field">
                <label htmlFor={`${fid}-waste-qty`}>Số lượng xuất bù</label>
                <input
                  id={`${fid}-waste-qty`}
                  type="number"
                  min={1}
                  step="1"
                  value={createQuantity}
                  onChange={(e) => setCreateQuantity(e.target.value)}
                  disabled={createSubmitting}
                />
              </div>
              <div className="th-prod-waste__field">
                <label htmlFor={`${fid}-waste-note`}>Ghi chú</label>
                <input
                  id={`${fid}-waste-note`}
                  type="text"
                  placeholder="Lý do xuất bù…"
                  value={createNote}
                  onChange={(e) => setCreateNote(e.target.value)}
                />
              </div>
            </div>
            <p className="th-prod-waste__create-hint">Hệ thống gửi quantityChange dưới dạng số âm.</p>
          </div>
          <div className="th-dlg__footer">
            <button
              type="button"
              className="th-admin-users__btn-ghost"
              onClick={closeWasteDialog}
              disabled={createSubmitting}
            >
              Hủy
            </button>
            <button
              type="button"
              className="th-admin-users__btn-primary"
              disabled={createSubmitting || !canSubmitWaste}
              onClick={() => void handleCreateWaste()}
            >
              {createSubmitting ? 'Đang xuất bù…' : 'Xác nhận xuất bù'}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  )
}
