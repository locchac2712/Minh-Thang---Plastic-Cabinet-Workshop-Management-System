import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Checkbox } from 'antd'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  AppFilterBar,
  AppFilterField,
  AppFilterInput,
  AppFilterSelect,
  AppPagination,
} from '../../shared/ui/listing'
import { fetchProductionMaterials, type ProductionMaterialDto } from '../productionTasksApi'
import './ProductionInventoryStockPage.css'

export function ProductionInventoryStockPage() {
  const fid = useId()
  const [rows, setRows] = useState<ProductionMaterialDto[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [alertOnly, setAlertOnly] = useState(false)
  const [search, setSearch] = useState('')

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchProductionMaterials({
        page: pageIndex,
        size: pageSize,
        search: search.trim() || undefined,
        isActive:
          statusFilter === ''
            ? undefined
            : statusFilter === 'active'
              ? true
              : false,
      })
      setRows(data.content)
      setTotalElements(data.totalElements)
      setTotalPages(data.totalPages)
    } catch (e) {
      setRows([])
      setTotalElements(0)
      setTotalPages(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách vật tư')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, search, statusFilter])

  useEffect(() => {
    void fetchRows()
  }, [fetchRows])

  const filteredRows = useMemo(() => {
    if (!alertOnly) return rows
    return rows.filter((r) => r.stockQuantity <= r.minStockLevel)
  }, [rows, alertOnly])

  return (
    <div className="th-prod-stock">
      <header className="th-prod-stock__header">
        <h1 className="th-prod-stock__title">Tồn kho vật tư</h1>
        {loadError ? <p className="th-prod-stock__api-error">{loadError}</p> : null}
      </header>

      <div className="th-prod-stock__toolbar">
        <AppFilterBar className="th-prod-stock__filter-bar">
          <AppFilterField className="th-prod-stock__tabs" label="Trạng thái vật tư">
            <AppFilterSelect
              value={statusFilter}
              onChangeValue={(value) => {
                setStatusFilter(value as '' | 'active' | 'inactive')
                setPageIndex(0)
              }}
              options={[
                { value: '', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </AppFilterField>
          <div className="th-prod-stock__filter-alert">
            <span className="th-listing-filter-label">Cảnh báo tồn</span>
            <div className="th-prod-stock__filter-alert-control">
              <Checkbox
                checked={alertOnly}
                onChange={(event) => setAlertOnly(event.target.checked)}
              >
                Chỉ dòng cảnh báo
              </Checkbox>
            </div>
          </div>
          <AppFilterField search label="Tìm kiếm">
            <AppFilterInput
              id={`${fid}-q`}
              placeholder="Mã, tên vật tư…"
              value={search}
              onChangeValue={(value) => {
                setSearch(value)
                setPageIndex(0)
              }}
            />
          </AppFilterField>
        </AppFilterBar>
      </div>

      <div className="th-prod-table-shell">
        <table className="th-prod-data-table">
          <thead>
            <tr>
              <th scope="col">SKU</th>
              <th scope="col">Tên vật tư</th>
              <th scope="col">Material ID</th>
              <th scope="col" className="th-prod-data-table__num">
                Tồn
              </th>
              <th scope="col" className="th-prod-data-table__num">
                Tối thiểu
              </th>
              <th scope="col" className="th-prod-data-table__num">
                Giá vốn / ĐV
              </th>
              <th scope="col">ĐVT</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="th-prod-data-table__empty">
                  Không có dòng khớp bộ lọc.
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <code className="th-prod-stock__sku">{r.code}</code>
                  </td>
                  <td className="th-prod-data-table__name">{r.name}</td>
                  <td className="th-prod-data-table__zone">
                    <code>{r.id}</code>
                  </td>
                  <td className="th-prod-data-table__num">
                    {r.stockQuantity}
                  </td>
                  <td className="th-prod-data-table__num">{r.minStockLevel}</td>
                  <td className="th-prod-data-table__num">{formatVND(r.unitCost)}</td>
                  <td>{r.unit}</td>
                  <td>
                    <span
                      className={
                        r.isActive
                          ? 'th-prod-stock__pill th-prod-stock__pill--ok'
                          : 'th-prod-stock__pill th-prod-stock__pill--critical'
                      }
                    >
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="th-prod-data-table__sync">
                    {new Date(r.createdAt).toLocaleString('vi-VN')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-prod-stock__pager"
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
