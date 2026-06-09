import { useCallback, useEffect, useId, useState } from 'react'
import { Checkbox } from 'antd'
import { formatVND } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { AppFilterBar, AppFilterField, AppFilterInput, AppPagination } from '../../shared/ui/listing'
import './AccountantMaterialsPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type MaterialRow = {
  id: string
  code: string
  name: string
  unit: string
  unitCost: number
  stockQuantity: number
  minStockLevel: number
  isActive: boolean
  createdAt: string
  linkedSupplierCount?: number
}

type MaterialPage = {
  content: MaterialRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

export function AccountantMaterialsPage() {
  const fid = useId()
  const [search, setSearch] = useState('')
  const [activeOnly, setActiveOnly] = useState(true)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState<MaterialRow[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const load = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setRows([])
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    setLoading(true)
    setLoadError(null)
    const q = new URLSearchParams()
    q.set('page', String(pageIndex))
    q.set('size', String(pageSize))
    if (search.trim()) q.set('search', search.trim())
    if (activeOnly) q.set('is_active', 'true')
    const endpoints = ['/api/accountants/materials', '/api/accountant/materials']
    try {
      let okData: MaterialPage | null = null
      let lastMessage = 'Không tải được danh sách vật tư'
      for (const ep of endpoints) {
        const res = await fetch(`${API_BASE_URL}${ep}?${q.toString()}`, {
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
        })
        const envelope = (await res.json()) as ApiEnvelope<MaterialPage>
        if (res.ok && envelope.success && envelope.data) {
          okData = envelope.data
          break
        }
        lastMessage = envelope.message || lastMessage
      }
      if (!okData) throw new Error(lastMessage)
      setRows(okData.content)
      setTotalPages(okData.totalPages)
      setTotalElements(okData.totalElements)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được danh sách vật tư')
    } finally {
      setLoading(false)
    }
  }, [activeOnly, pageIndex, pageSize, search])

  useEffect(() => {
    void load()
  }, [load])


  return (
    <div className="th-acc-mat">
      <header className="th-acc-mat__header">
        <h1 className="th-acc-mat__title">Tất cả vật tư</h1>
        {loadError ? (
          <p className="th-acc-mat__error" role="alert">
            {loadError}
          </p>
        ) : null}
      </header>

      <div className="th-acc-mat__toolbar">
        <AppFilterBar>
          <AppFilterField search className="th-acc-mat__search">
            <AppFilterInput
              id={`${fid}-q`}
              placeholder="Tìm mã/tên vật tư..."
              value={search}
              onChangeValue={(value) => {
                setSearch(value)
                setPageIndex(0)
              }}
            />
          </AppFilterField>
          <label className="th-acc-mat__toggle">
            <Checkbox
              checked={activeOnly}
              onChange={(event) => {
                setActiveOnly(event.target.checked)
                setPageIndex(0)
              }}
            >
              Chỉ vật tư active
            </Checkbox>
          </label>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-acc-mat__loading">Đang tải dữ liệu…</p> : null}

      <div className="th-acc-table-shell">
        <table className="th-acc-data-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên vật tư</th>
              <th>Đơn vị</th>
              <th className="th-acc-data-table__num">Đơn giá</th>
              <th className="th-acc-data-table__num">Tồn kho</th>
              <th className="th-acc-data-table__num">Min</th>
              <th className="th-acc-data-table__num">NCC</th>
              <th>Trạng thái</th>
              <th>Tạo lúc</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="th-acc-data-table__empty">Không có vật tư khớp bộ lọc.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td><code>{r.code}</code><div className="th-acc-mat__id">{r.id}</div></td>
                  <td>{r.name}</td>
                  <td>{r.unit}</td>
                  <td className="th-acc-data-table__num">{formatVND(r.unitCost)}</td>
                  <td className="th-acc-data-table__num">{r.stockQuantity}</td>
                  <td className="th-acc-data-table__num">{r.minStockLevel}</td>
                  <td className="th-acc-data-table__num">
                    {(r.linkedSupplierCount ?? 0) === 0 && r.isActive ? (
                      <span className="th-acc-mat__warn" title="Chưa gán NCC — không lập PO được">
                        0
                      </span>
                    ) : (
                      (r.linkedSupplierCount ?? '—')
                    )}
                  </td>
                  <td>
                    <span className={r.isActive ? 'th-acc-mat__pill th-acc-mat__pill--ok' : 'th-acc-mat__pill'}>
                      {r.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-acc-mat__pager"
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

