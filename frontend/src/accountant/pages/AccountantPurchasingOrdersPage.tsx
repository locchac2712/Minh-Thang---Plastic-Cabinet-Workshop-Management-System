import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatVND } from '../../admin/partners/agencyModel'
import { getAccessToken, getTokenType } from '../../auth/storage'
import { accountantPaths } from '../config/accountantPaths'
import { AppFilterBar, AppFilterField, AppFilterSelect, AppPagination } from '../../shared/ui/listing'
import './AccountantPurchasingOrdersPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'

type PurchaseStatus = 'Pending' | 'Recieved' | 'Received' | 'Canceled'
type PaymentStatus = 'Paid' | 'Unpaid' | 'Partial'
type PurchaseStatusFilter = 'all' | PurchaseStatus
type PaymentStatusFilter = 'all' | PaymentStatus

type PurchaseRow = {
  id: string
  supplierId: string
  supplierName: string
  totalAmount: number
  paidAmount: number
  paymentStatus: PaymentStatus
  status: PurchaseStatus
  createdAt: string
  updatedAt: string
}

type SupplierOption = {
  id: string
  name: string
}

type MaterialOption = {
  id: string
  code: string
  name: string
}

type CreatePoItemDraft = {
  materialId: string
  quantity: string
  unitPrice: string
}

type PurchasePageData = {
  content: PurchaseRow[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

type SupplierPageData = {
  content: SupplierOption[]
}

type ApiEnvelope<T> = {
  success: boolean
  statusCode: number
  message: string
  data?: T
}

type CreatePurchasePayload = {
  supplierId: string
  totalAmount: number
  items: Array<{
    materialId: string
    quantity: number
    unitPrice: number
  }>
}

type CreatePurchaseResult = {
  id: string
}

function statusPillClass(s: PurchaseStatus): string {
  const base = 'th-acc-orders__pill'
  const mod: Record<PurchaseStatus, string> = {
    Pending: `${base} ${base}--wait`,
    Recieved: `${base} ${base}--go`,
    Received: `${base} ${base}--go`,
    Canceled: `${base} ${base}--bad`,
  }
  return mod[s]
}

function paymentPillClass(s: PaymentStatus): string {
  const base = 'th-acc-orders__pill'
  const mod: Record<PaymentStatus, string> = {
    Unpaid: `${base} ${base}--bad`,
    Partial: `${base} ${base}--partial`,
    Paid: `${base} ${base}--done`,
  }
  return mod[s]
}

function statusLabel(s: PurchaseStatus): string {
  if (s === 'Pending') return 'Chờ xử lý'
  if (s === 'Recieved' || s === 'Received') return 'Đã nhận'
  return 'Đã hủy'
}

function paymentLabel(s: PaymentStatus): string {
  if (s === 'Unpaid') return 'Chưa thanh toán'
  if (s === 'Partial') return 'Thanh toán một phần'
  return 'Đã thanh toán'
}

export function AccountantPurchasingOrdersPage() {
  const fid = useId()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<PurchaseStatusFilter>('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatusFilter>('all')
  const [supplierIdFilter, setSupplierIdFilter] = useState('all')
  const [supplierQuery, setSupplierQuery] = useState('')
  const [supplierOpen, setSupplierOpen] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize] = useState(20)
  const [rows, setRows] = useState<PurchaseRow[]>([])
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [createSupplierId, setCreateSupplierId] = useState('')
  const [materialOptions, setMaterialOptions] = useState<MaterialOption[]>([])
  const [createItems, setCreateItems] = useState<CreatePoItemDraft[]>([
    { materialId: '', quantity: '1', unitPrice: '0' },
  ])
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [receiveTarget, setReceiveTarget] = useState<PurchaseRow | null>(null)
  const [receiveSubmitting, setReceiveSubmitting] = useState(false)
  const [receiveError, setReceiveError] = useState<string | null>(null)
  const [payTarget, setPayTarget] = useState<PurchaseRow | null>(null)
  const [payAmountInput, setPayAmountInput] = useState('')
  const [paySubmitting, setPaySubmitting] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const loadSuppliers = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/accountant/suppliers?page=0&size=200`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<SupplierPageData>
      if (!res.ok || !envelope.success || !envelope.data) return
      setSupplierOptions(envelope.data.content)
    } catch {
      // keep supplier filter usable with "all" option only
    }
  }, [])

  const loadMaterials = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) return
    try {
      const endpoints = ['/api/accountants/materials', '/api/accountant/materials']
      let loaded = false
      for (const ep of endpoints) {
        const res = await fetch(`${API_BASE_URL}${ep}?page=0&size=200&is_active=true`, {
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
        })
        const envelope = (await res.json()) as ApiEnvelope<{
          content: Array<{ id: string; code: string; name: string }>
        }>
        if (!res.ok || !envelope.success || !envelope.data) continue
        setMaterialOptions(
          envelope.data.content.map((m) => ({ id: m.id, code: m.code, name: m.name })),
        )
        loaded = true
        break
      }
      if (!loaded) setMaterialOptions([])
    } catch {
      setMaterialOptions([])
    }
  }, [])

  const loadOrders = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setRows([])
      setLoadError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    setLoading(true)
    setLoadError(null)
    try {
      const q = new URLSearchParams()
      if (statusFilter !== 'all') q.set('status', statusFilter)
      if (paymentStatusFilter !== 'all') q.set('payment_status', paymentStatusFilter)
      if (supplierIdFilter !== 'all') q.set('supplier_id', supplierIdFilter)
      q.set('page', String(pageIndex))
      q.set('size', String(pageSize))
      const res = await fetch(`${API_BASE_URL}/api/accountant/purchases?${q.toString()}`, {
        headers: {
          accept: '*/*',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
      })
      const envelope = (await res.json()) as ApiEnvelope<PurchasePageData>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tải được đơn mua')
      }
      setRows(envelope.data.content)
      setTotalPages(envelope.data.totalPages)
      setTotalElements(envelope.data.totalElements)
    } catch (e) {
      setRows([])
      setTotalPages(0)
      setTotalElements(0)
      setLoadError(e instanceof Error ? e.message : 'Không tải được đơn mua')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, paymentStatusFilter, statusFilter, supplierIdFilter])

  useEffect(() => {
    void loadSuppliers()
  }, [loadSuppliers])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    void loadMaterials()
  }, [loadMaterials])

  const filteredSupplierOptions = useMemo(() => {
    const q = supplierQuery.trim().toLowerCase()
    if (!q) return supplierOptions
    return supplierOptions.filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }, [supplierOptions, supplierQuery])

  const supplierLabel = useMemo(() => {
    if (supplierIdFilter === 'all') return 'Tất cả NCC'
    return supplierOptions.find((s) => s.id === supplierIdFilter)?.name ?? supplierIdFilter
  }, [supplierIdFilter, supplierOptions])

  const createTotal = useMemo(
    () =>
      createItems.reduce((sum, it) => {
        const q = Number(it.quantity)
        const p = Number(it.unitPrice)
        if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p < 0) return sum
        return sum + q * p
      }, 0),
    [createItems],
  )

  const resetCreateForm = () => {
    setCreateSupplierId('')
    setCreateItems([{ materialId: '', quantity: '1', unitPrice: '0' }])
    setCreateError(null)
  }

  const submitCreatePurchase = useCallback(async () => {
    const accessToken = getAccessToken()
    if (!accessToken) {
      setCreateError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    if (!createSupplierId) {
      setCreateError('Vui lòng chọn nhà cung cấp.')
      return
    }
    const mappedItems = createItems.map((it) => ({
      materialId: it.materialId.trim(),
      quantity: Number(it.quantity),
      unitPrice: Number(it.unitPrice),
    }))
    if (
      mappedItems.length === 0 ||
      mappedItems.some((it) => !it.materialId || !Number.isFinite(it.quantity) || it.quantity <= 0 || !Number.isFinite(it.unitPrice) || it.unitPrice < 0)
    ) {
      setCreateError('Vui lòng nhập hợp lệ vật tư, số lượng (>0) và đơn giá (>=0).')
      return
    }
    const payload: CreatePurchasePayload = {
      supplierId: createSupplierId,
      totalAmount: mappedItems.reduce((s, it) => s + it.quantity * it.unitPrice, 0),
      items: mappedItems,
    }
    setCreateSubmitting(true)
    setCreateError(null)
    setNotice(null)
    try {
      const res = await fetch(`${API_BASE_URL}/api/accountant/purchases`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `${getTokenType()} ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })
      const envelope = (await res.json()) as ApiEnvelope<CreatePurchaseResult>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không tạo được đơn mua')
      }
      setNotice(`Đã tạo đơn mua ${envelope.data.id}.`)
      setCreateOpen(false)
      resetCreateForm()
      await loadOrders()
      navigate(accountantPaths.purchasing.orderDetail(envelope.data.id))
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Không tạo được đơn mua')
    } finally {
      setCreateSubmitting(false)
    }
  }, [API_BASE_URL, createItems, createSupplierId, loadOrders, navigate])

  const submitReceivePurchase = useCallback(async () => {
    if (!receiveTarget) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setReceiveError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    setReceiveSubmitting(true)
    setReceiveError(null)
    setNotice(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/accountant/purchases/${encodeURIComponent(receiveTarget.id)}/receive`,
        {
          method: 'PATCH',
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
        },
      )
      const envelope = (await res.json()) as ApiEnvelope<PurchaseRow>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không xác nhận đã nhận được hàng')
      }
      setNotice(`Đã xác nhận nhận hàng cho đơn mua ${receiveTarget.id}.`)
      setReceiveTarget(null)
      await loadOrders()
    } catch (e) {
      setReceiveError(e instanceof Error ? e.message : 'Không xác nhận đã nhận được hàng')
    } finally {
      setReceiveSubmitting(false)
    }
  }, [API_BASE_URL, loadOrders, receiveTarget])

  const submitPurchasePayment = useCallback(async () => {
    if (!payTarget) return
    const accessToken = getAccessToken()
    if (!accessToken) {
      setPayError('Thiếu access token. Vui lòng đăng nhập lại.')
      return
    }
    const paidAmount = Number(payAmountInput)
    if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
      setPayError('Số tiền thanh toán phải lớn hơn 0.')
      return
    }
    setPaySubmitting(true)
    setPayError(null)
    setNotice(null)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/accountant/purchases/${encodeURIComponent(payTarget.id)}/pay`,
        {
          method: 'PATCH',
          headers: {
            accept: '*/*',
            'Content-Type': 'application/json',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: JSON.stringify({ paidAmount }),
        },
      )
      const envelope = (await res.json()) as ApiEnvelope<PurchaseRow>
      if (!res.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.message || 'Không cập nhật được thanh toán đơn mua')
      }
      setNotice(`Đã cập nhật thanh toán đơn mua ${payTarget.id}: ${formatVND(paidAmount)}.`)
      setPayTarget(null)
      setPayAmountInput('')
      await loadOrders()
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Không cập nhật được thanh toán đơn mua')
    } finally {
      setPaySubmitting(false)
    }
  }, [API_BASE_URL, loadOrders, payAmountInput, payTarget])

  return (
    <div className="th-acc-orders">
      <header className="th-acc-orders__header">
        <h1 className="th-acc-orders__title">Đơn mua hàng</h1>
        <div className="th-acc-orders__head-actions">
          <button
            type="button"
            className="th-acc-orders__create-btn"
            onClick={() => {
              setCreateOpen(true)
              setCreateError(null)
            }}
          >
            Tạo đơn mua
          </button>
        </div>
        {loadError ? (
          <p className="th-acc-orders__error" role="alert">
            {loadError}
          </p>
        ) : null}
        {notice ? <p className="th-acc-orders__notice">{notice}</p> : null}
      </header>

      <div className="th-acc-orders__toolbar">
        <AppFilterBar>
          <AppFilterField label="Trạng thái đơn mua" className="th-acc-orders__field">
            <AppFilterSelect
              value={statusFilter}
              onChangeValue={(value) => {
                setStatusFilter(value as PurchaseStatusFilter)
                setPageIndex(0)
              }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'Pending', label: 'Chờ xử lý' },
                { value: 'Received', label: 'Đã nhận' },
                { value: 'Canceled', label: 'Đã hủy' },
              ]}
            />
          </AppFilterField>

          <AppFilterField label="Thanh toán" className="th-acc-orders__field">
            <AppFilterSelect
              value={paymentStatusFilter}
              onChangeValue={(value) => {
                setPaymentStatusFilter(value as PaymentStatusFilter)
                setPageIndex(0)
              }}
              options={[
                { value: 'all', label: 'Tất cả' },
                { value: 'Unpaid', label: 'Chưa thanh toán' },
                { value: 'Partial', label: 'Thanh toán một phần' },
                { value: 'Paid', label: 'Đã thanh toán' },
              ]}
            />
          </AppFilterField>

          <div className="th-acc-orders__field th-acc-orders__field--combo">
            <span>Nhà cung cấp</span>
            <button
              id={`${fid}-supplier`}
              type="button"
              className="th-acc-orders__combo-btn"
              aria-expanded={supplierOpen}
              onClick={() => setSupplierOpen((v) => !v)}
            >
              <span>{supplierLabel}</span>
              <span className="material-symbols-outlined" aria-hidden>
                {supplierOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {supplierOpen ? (
              <div className="th-acc-orders__combo-pop">
                <input
                  type="search"
                  className="th-acc-orders__combo-search"
                  value={supplierQuery}
                  onChange={(e) => setSupplierQuery(e.target.value)}
                  placeholder="Tìm NCC trong dropdown..."
                />
                <button
                  type="button"
                  className={`th-acc-orders__combo-option${supplierIdFilter === 'all' ? ' is-active' : ''}`}
                  onClick={() => {
                    setSupplierIdFilter('all')
                    setPageIndex(0)
                    setSupplierOpen(false)
                  }}
                >
                  Tất cả NCC
                </button>
                {filteredSupplierOptions.length === 0 ? (
                  <p className="th-acc-orders__combo-empty">Không có NCC phù hợp.</p>
                ) : (
                  filteredSupplierOptions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`th-acc-orders__combo-option${supplierIdFilter === s.id ? ' is-active' : ''}`}
                      onClick={() => {
                        setSupplierIdFilter(s.id)
                        setPageIndex(0)
                        setSupplierOpen(false)
                      }}
                    >
                      <span>{s.name}</span>
                      <code>{s.id}</code>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </AppFilterBar>
      </div>

      {loading ? <p className="th-acc-orders__loading">Đang tải dữ liệu…</p> : null}

      <div className="th-acc-table-shell">
        <table className="th-acc-data-table">
          <thead>
            <tr>
              <th scope="col">Mã đơn mua</th>
              <th scope="col">Nhà cung cấp</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Thanh toán</th>
              <th scope="col" className="th-acc-data-table__num">
                Tổng tiền
              </th>
              <th scope="col" className="th-acc-data-table__num">
                Đã trả
              </th>
              <th scope="col" className="th-acc-data-table__num">
                Còn lại
              </th>
              <th scope="col">Tạo lúc</th>
              <th scope="col">Cập nhật</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="th-acc-data-table__empty">
                  Không có đơn khớp bộ lọc.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="th-acc-data-table__clickable"
                  onClick={() => navigate(accountantPaths.purchasing.orderDetail(row.id))}
                >
                  <td>
                    <code className="th-acc-orders__po">{row.id}</code>
                  </td>
                  <td>
                    <span className="th-acc-orders__sup">{row.supplierName}</span>
                    <code className="th-acc-orders__sup-code">{row.supplierId}</code>
                  </td>
                  <td>
                    <span className={statusPillClass(row.status)}>{statusLabel(row.status)}</span>
                  </td>
                  <td>
                    <span className={paymentPillClass(row.paymentStatus)}>{paymentLabel(row.paymentStatus)}</span>
                  </td>
                  <td className="th-acc-data-table__num th-acc-data-table__money">{formatVND(row.totalAmount)}</td>
                  <td className="th-acc-data-table__num">{formatVND(row.paidAmount)}</td>
                  <td className="th-acc-data-table__num">{formatVND(Math.max(0, row.totalAmount - row.paidAmount))}</td>
                  <td className="th-acc-data-table__date">{new Date(row.createdAt).toLocaleString('vi-VN')}</td>
                  <td className="th-acc-data-table__date">{new Date(row.updatedAt).toLocaleString('vi-VN')}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="th-acc-orders__actions">
                      {row.status === 'Pending' ? (
                        <button
                          type="button"
                          className="th-acc-orders__receive-btn"
                          onClick={() => {
                            setReceiveError(null)
                            setReceiveTarget(row)
                          }}
                        >
                          Đã nhận
                        </button>
                      ) : null}
                      {(row.paymentStatus === 'Unpaid' || row.paymentStatus === 'Partial') ? (
                        <button
                          type="button"
                          className="th-acc-orders__pay-btn"
                          onClick={() => {
                            setPayError(null)
                            setPayTarget(row)
                            setPayAmountInput('')
                          }}
                        >
                          Cập nhật thanh toán
                        </button>
                      ) : null}
                      {row.status !== 'Pending' &&
                      row.paymentStatus !== 'Unpaid' &&
                      row.paymentStatus !== 'Partial' ? (
                        <span className="th-acc-orders__action-muted">—</span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <AppPagination
          className="th-acc-orders__pager"
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalElements}
          simple
          showSizeChanger={false}
          onPageIndexChange={setPageIndex}
        />
      ) : null}

      {createOpen ? (
        <dialog open className="th-dlg" onClick={() => (!createSubmitting ? setCreateOpen(false) : null)}>
          <section
            className="th-dlg__panel th-admin-users th-acc-orders__create-dlg"
            role="dialog"
            aria-modal="true"
            aria-label="Tạo đơn mua"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  add_shopping_cart
                </span>
              </div>
              <h3 className="th-dlg__title">Tạo đơn mua</h3>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => (!createSubmitting ? setCreateOpen(false) : null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>
            <div className="th-dlg__body th-acc-dlg-body">
              {createError ? (
                <p className="th-admin-users__api-error" role="alert">
                  {createError}
                </p>
              ) : null}
              <label className="th-acc-orders__field">
                <span>Nhà cung cấp</span>
                <select
                  value={createSupplierId}
                  onChange={(e) => setCreateSupplierId(e.target.value)}
                  disabled={createSubmitting}
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {supplierOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="th-acc-orders__create-items">
                <div className="th-acc-orders__create-items-head">
                  <strong>Dòng vật tư</strong>
                  <button
                    type="button"
                    className="th-acc-orders__add-line-btn"
                    disabled={createSubmitting}
                    onClick={() =>
                      setCreateItems((prev) => [...prev, { materialId: '', quantity: '1', unitPrice: '0' }])
                    }
                  >
                    + Thêm dòng
                  </button>
                </div>
                {createItems.map((it, idx) => (
                  <div key={`line-${idx}`} className="th-acc-orders__create-line">
                    <select
                      value={it.materialId}
                      disabled={createSubmitting}
                      onChange={(e) =>
                        setCreateItems((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, materialId: e.target.value } : x)),
                        )
                      }
                    >
                      <option value="">Chọn vật tư</option>
                      {materialOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.code} · {m.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={it.quantity}
                      disabled={createSubmitting}
                      onChange={(e) =>
                        setCreateItems((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, quantity: e.target.value } : x)),
                        )
                      }
                      placeholder="SL"
                    />
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={it.unitPrice}
                      disabled={createSubmitting}
                      onChange={(e) =>
                        setCreateItems((prev) =>
                          prev.map((x, i) => (i === idx ? { ...x, unitPrice: e.target.value } : x)),
                        )
                      }
                      placeholder="Đơn giá"
                    />
                    <button
                      type="button"
                      className="th-acc-orders__remove-line-btn"
                      disabled={createSubmitting || createItems.length <= 1}
                      onClick={() => setCreateItems((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
              <p className="th-acc-orders__create-total">Tổng tiền tạm tính: {formatVND(createTotal)}</p>
            </div>
            <footer className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-users__btn-ghost"
                disabled={createSubmitting}
                onClick={() => {
                  setCreateOpen(false)
                  resetCreateForm()
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="th-admin-users__btn-primary"
                disabled={createSubmitting}
                onClick={() => void submitCreatePurchase()}
              >
                {createSubmitting ? 'Đang tạo…' : 'Tạo đơn'}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}

      {receiveTarget ? (
        <dialog open className="th-dlg" onClick={() => (!receiveSubmitting ? setReceiveTarget(null) : null)}>
          <section
            className="th-dlg__panel th-admin-users"
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận đã nhận hàng"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  inventory_2
                </span>
              </div>
              <h3 className="th-dlg__title">Xác nhận đã nhận hàng</h3>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => (!receiveSubmitting ? setReceiveTarget(null) : null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>
            <div className="th-dlg__body th-acc-dlg-body">
              <p>
                Xác nhận đơn mua <code>{receiveTarget.id}</code> đã nhận xong?
              </p>
              {receiveError ? (
                <p className="th-admin-users__api-error" role="alert">
                  {receiveError}
                </p>
              ) : null}
            </div>
            <footer className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-users__btn-ghost"
                disabled={receiveSubmitting}
                onClick={() => setReceiveTarget(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="th-admin-users__btn-primary"
                disabled={receiveSubmitting}
                onClick={() => void submitReceivePurchase()}
              >
                {receiveSubmitting ? 'Đang xác nhận…' : 'Xác nhận đã nhận'}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}

      {payTarget ? (
        <dialog open className="th-dlg" onClick={() => (!paySubmitting ? setPayTarget(null) : null)}>
          <section
            className="th-dlg__panel th-admin-users"
            role="dialog"
            aria-modal="true"
            aria-label="Cập nhật thanh toán PO"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  payments
                </span>
              </div>
              <h3 className="th-dlg__title">Cập nhật thanh toán đơn mua</h3>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => (!paySubmitting ? setPayTarget(null) : null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>
            <div className="th-dlg__body th-acc-dlg-body">
              <p>
                Đơn mua: <code>{payTarget.id}</code>
              </p>
              <p>
                Còn lại hiện tại: <strong>{formatVND(Math.max(0, payTarget.totalAmount - payTarget.paidAmount))}</strong>
              </p>
              <label className="th-acc-orders__field">
                <span>Số tiền thanh toán thêm</span>
                <input
                  type="number"
                  min={1}
                  step={1000}
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  disabled={paySubmitting}
                  placeholder="Ví dụ: 5000"
                />
              </label>
              {payError ? (
                <p className="th-admin-users__api-error" role="alert">
                  {payError}
                </p>
              ) : null}
            </div>
            <footer className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-users__btn-ghost"
                disabled={paySubmitting}
                onClick={() => setPayTarget(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="th-admin-users__btn-primary"
                disabled={paySubmitting}
                onClick={() => void submitPurchasePayment()}
              >
                {paySubmitting ? 'Đang cập nhật…' : 'Xác nhận thanh toán'}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}
    </div>
  )
}
