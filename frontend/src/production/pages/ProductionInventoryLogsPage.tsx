import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { AppFilterField, AppFilterInput, AppFilterSelect, AppPagination } from '../../shared/ui/listing'
import { productionPaths } from '../config/productionPaths'
import {
  fetchProductionInventoryLogs,
  fetchProductionMaterials,
  type ProductionInventoryLogDto,
  type ProductionMaterialDto,
  type ProductionInventoryTransactionType,
} from '../productionTasksApi'
import { productionTaskRefFromId } from '../utils/productionTaskRef'
import './ProductionInventoryLogsPage.css'

function txLabel(t: ProductionInventoryTransactionType): string {
  if (t === 'IMPORT') return 'Nhập'
  if (t === 'EXPORT') return 'Xuất'
  return 'Hao hụt'
}

function txClass(t: ProductionInventoryTransactionType): string {
  if (t === 'IMPORT') return 'th-prod-ilog__tx th-prod-ilog__tx--import'
  if (t === 'EXPORT') return 'th-prod-ilog__tx th-prod-ilog__tx--export'
  return 'th-prod-ilog__tx th-prod-ilog__tx--waste'
}

function fmtDate(iso: string): string {
  const d = iso.trim()
  if (!d) return '—'
  const noMs = d.includes('.') ? (d.split('.')[0] ?? d) : d
  return noMs.replace('T', ' ')
}

export function ProductionInventoryLogsPage() {
  const fid = useId()
  const [materialId, setMaterialId] = useState('')
  const [materialSearch, setMaterialSearch] = useState('')
  const [materialOpen, setMaterialOpen] = useState(false)
  const [materials, setMaterials] = useState<ProductionMaterialDto[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [materialsError, setMaterialsError] = useState<string | null>(null)
  const [taskId, setTaskId] = useState('')
  const [txType, setTxType] = useState<'' | ProductionInventoryTransactionType>('')
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [rows, setRows] = useState<ProductionInventoryLogDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const loadMaterials = useCallback(async () => {
    setMaterialsLoading(true)
    setMaterialsError(null)
    try {
      const all: ProductionMaterialDto[] = []
      let page = 0
      const size = 100
      for (;;) {
        const data = await fetchProductionMaterials({ page, size })
        all.push(...data.content)
        if (data.last || data.content.length === 0) break
        page += 1
        if (page > 40) break
      }
      setMaterials(all)
    } catch (e) {
      setMaterials([])
      setMaterialsError(e instanceof Error ? e.message : 'Không tải được vật tư')
    } finally {
      setMaterialsLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProductionInventoryLogs({
        materialId,
        taskId,
        transactionType: txType || undefined,
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
      setLoadError(e instanceof Error ? e.message : 'Không tải được nhật ký NVL')
    } finally {
      setLoading(false)
    }
  }, [materialId, taskId, txType, pageIndex, pageSize])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    void loadMaterials()
  }, [loadMaterials])

  const materialOptions = useMemo(() => {
    const q = materialSearch.trim().toLowerCase()
    if (!q) return materials
    return materials.filter((m) => m.code.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
  }, [materials, materialSearch])
  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === materialId) ?? null,
    [materials, materialId],
  )


  return (
    <div className="th-prod-ilog">
      <header className="th-prod-ilog__header">
        <h1 className="th-prod-ilog__title">Nhật ký NVL</h1>
      </header>

      {loadError ? (
        <p className="th-prod-ilog__error" role="alert">
          {loadError}
        </p>
      ) : null}
      {materialsError ? (
        <p className="th-prod-ilog__error" role="alert">
          {materialsError}
        </p>
      ) : null}

      <div className="th-prod-ilog__toolbar">
        <div className="th-prod-ilog__field">
          <label htmlFor={`${fid}-mat-q`}>Material ID</label>
          <button
            id={`${fid}-mat`}
            type="button"
            className="th-prod-ilog__combo-btn"
            disabled={materialsLoading}
            aria-haspopup="listbox"
            aria-expanded={materialOpen}
            onClick={() => setMaterialOpen((v) => !v)}
          >
            <span className="th-prod-ilog__combo-btn-text">
              {selectedMaterial ? `${selectedMaterial.code} · ${selectedMaterial.name}` : 'Tất cả vật tư'}
            </span>
            <span className="material-symbols-outlined" aria-hidden>
              {materialOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {materialOpen ? (
            <div className="th-prod-ilog__combo-pop" role="dialog" aria-label="Chọn vật tư">
              <input
                id={`${fid}-mat-q`}
                type="search"
                placeholder="Tìm trong dropdown…"
                value={materialSearch}
                autoComplete="off"
                onChange={(e) => setMaterialSearch(e.target.value)}
              />
              <div className="th-prod-ilog__combo-list" role="listbox" aria-labelledby={`${fid}-mat`}>
                <button
                  type="button"
                  className={materialId === '' ? 'th-prod-ilog__combo-opt th-prod-ilog__combo-opt--active' : 'th-prod-ilog__combo-opt'}
                  onClick={() => {
                    setMaterialId('')
                    setPageIndex(0)
                    setMaterialOpen(false)
                  }}
                >
                  Tất cả vật tư
                </button>
                {materialOptions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={
                      materialId === m.id
                        ? 'th-prod-ilog__combo-opt th-prod-ilog__combo-opt--active'
                        : 'th-prod-ilog__combo-opt'
                    }
                    onClick={() => {
                      setMaterialId(m.id)
                      setPageIndex(0)
                      setMaterialOpen(false)
                    }}
                  >
                    <span className="th-prod-ilog__combo-code">{m.code}</span>
                    <span>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <AppFilterField className="th-prod-ilog__field" label="Mã lệnh" search>
          <AppFilterInput
            id={`${fid}-task`}
            placeholder="LSX-2026-00001"
            value={taskId}
            onChangeValue={(value) => {
              setTaskId(value)
              setPageIndex(0)
            }}
          />
        </AppFilterField>
        <AppFilterField className="th-prod-ilog__field th-prod-ilog__field--sm" label="Loại giao dịch">
          <AppFilterSelect
            value={txType}
            onChangeValue={(value) => {
              setTxType(value as '' | ProductionInventoryTransactionType)
              setPageIndex(0)
            }}
            options={[
              { value: '', label: 'Tất cả' },
              { value: 'IMPORT', label: txLabel('IMPORT') },
              { value: 'EXPORT', label: txLabel('EXPORT') },
              { value: 'WASTE', label: txLabel('WASTE') },
            ]}
          />
        </AppFilterField>
      </div>

      {loading ? <p className="th-prod-ilog__loading">Đang tải nhật ký NVL…</p> : null}

      <div className="th-prod-table-shell">
        <table className="th-prod-data-table">
          <thead>
            <tr>
              <th scope="col">Thời gian</th>
              <th scope="col">Vật tư</th>
              <th scope="col">Task</th>
              <th scope="col">Loại</th>
              <th scope="col" className="th-prod-data-table__num">
                SL biến động
              </th>
              <th scope="col" className="th-prod-data-table__num">
                Đơn giá lúc đó
              </th>
              <th scope="col">Người tạo</th>
              <th scope="col">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="th-prod-data-table__empty">
                  Không có dữ liệu khớp bộ lọc.
                </td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((r) => (
                  <tr key={r.id}>
                    <td>{fmtDate(r.createdAt)}</td>
                    <td>
                      <code className="th-prod-ilog__mono">{r.materialId}</code>
                      <div className="th-prod-ilog__name">{r.materialName}</div>
                    </td>
                    <td>
                      {r.taskId ? (
                        <Link className="th-prod-ilog__task-link" to={productionPaths.tasks.byOrderTask(productionTaskRefFromId(r.taskId, r.taskDisplayCode))}>
                          <code className="th-prod-ilog__mono">
                            {productionTaskRefFromId(r.taskId, r.taskDisplayCode)}
                          </code>
                        </Link>
                      ) : (
                        <span className="th-prod-ilog__muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={txClass(r.transactionType)}>{txLabel(r.transactionType)}</span>
                    </td>
                    <td className="th-prod-data-table__num">{r.quantityChange}</td>
                    <td className="th-prod-data-table__num">{formatVND(r.unitPriceAtTime)}</td>
                    <td>{r.createdByName || '—'}</td>
                    <td className="th-prod-ilog__note">{r.note || '—'}</td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-prod-ilog__pager"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          simple
          showSizeChanger={false}
          onPageIndexChange={setPageIndex}
        />
      ) : null}
    </div>
  )
}

