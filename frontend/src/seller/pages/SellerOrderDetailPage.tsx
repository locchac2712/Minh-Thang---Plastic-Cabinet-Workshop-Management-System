import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import type { SellerQuotationListDto, SellerQuotationStatus } from '../sellerQuotationsApi'
import { SellerPushProductionDialog } from '../components/SellerPushProductionDialog'
import { formatVND } from '../../admin/partners/agencyModel'
import { sellerPaths } from '../config/sellerPaths'
import {
  sellerOrderKindLabel,
  sellerOrderRowStatusLabel,
  type SellerOrderDetail,
  type SellerOrderListRowStatus,
  fetchSellerOrderProductionTasks,
  fetchSellerOrderPayments,
  fetchSellerOrderById,
  mapSellerOrderDtoToDetail,
  markSellerOrderDone,
  pushSellerOrderToProduction,
  submitSellerOrder,
  updateSellerOrder,
  createSellerOrderPayment,
  type CreateSellerOrderPayload,
  type SellerApiOrderStatus,
  type SellerOrderListDto,
  type SellerOrderProductionTaskDto,
  type SellerOrderPaymentDto,
} from '../sellerOrdersApi'
import {
  fetchSellerQuotationById,
  inferQuotationStatusFromOrder,
  resolveQuotationPipeline,
} from '../sellerQuotationsApi'
import { getAccessToken, getTokenType } from '../../auth/storage'
import '../../admin/pages/AdminUsersPage.css'
import './SellerOrderDetailPage.css'

type SellerOrderDetailVariant = 'order' | 'quotation'

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildSellerOrderPrintDocumentHtml(
  detail: SellerOrderDetail,
  variant: SellerOrderDetailVariant,
): string {
  const heading = variant === 'quotation' ? 'BÁO GIÁ' : 'PHIẾU ĐẶT HÀNG'
  const printedAt = new Date().toLocaleString('vi-VN')
  const itemsSum = detail.items.reduce((s, x) => s + x.lineTotalVnd, 0)
  const rows = detail.items
    .map((line) => {
      const kind = line.kind === 'custom' ? 'Custom' : 'Catalog'
      const note = line.lineNote ? ` — ${escapeHtmlText(line.lineNote)}` : ''
      const cost =
        line.unitCostAtTimeVnd != null ? escapeHtmlText(formatVND(line.unitCostAtTimeVnd)) : '—'
      return `<tr>
        <td class="num">${line.lineNo}</td>
        <td>${kind}</td>
        <td>${escapeHtmlText(line.sku)}</td>
        <td>${escapeHtmlText(line.productName)}${note}</td>
        <td class="num">${line.qty}</td>
        <td class="num">${escapeHtmlText(formatVND(line.unitPriceVnd))}</td>
        <td class="num">${cost}</td>
        <td class="num">${escapeHtmlText(formatVND(line.lineTotalVnd))}</td>
      </tr>`
    })
    .join('')

  const internalNoteBlock =
    detail.internalNote && detail.internalNote.trim() && detail.internalNote !== '—'
      ? `<p style="margin-top:16px"><strong>Ghi chú:</strong> ${escapeHtmlText(detail.internalNote)}</p>`
      : ''

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8"/>
<title>${escapeHtmlText(heading)} ${escapeHtmlText(detail.orderCode)}</title>
<style>
  body { font-family: var(--th-font-sans, system-ui, sans-serif); font-size: 0.75rem; color: #111; margin: 16px; }
  h1 { font-size: 1.125rem; margin: 0 0 4px; }
  .meta { color: #444; margin-bottom: 16px; font-size: 0.6875rem; }
  .agency { margin-bottom: 16px; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
  .agency strong { display: block; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; font-weight: 600; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .totals { margin-top: 12px; max-width: 320px; margin-left: auto; }
  .totals table { margin: 0; }
  .totals td { border: none; padding: 4px 8px; }
  .totals td:first-child { text-align: right; color: #444; }
  .totals tr.grand td { font-weight: 700; font-size: 0.8125rem; border-top: 1px solid #333; }
  @media print { body { margin: 10mm; } }
</style>
</head>
<body>
  <h1>${escapeHtmlText(heading)}</h1>
  <div class="meta">
    <div>Mã: <strong>${escapeHtmlText(detail.orderCode)}</strong> · ${escapeHtmlText(sellerOrderKindLabel(detail.orderKind))} · ${escapeHtmlText(sellerOrderRowStatusLabel(detail.status))}</div>
    <div>Ngày lập: ${escapeHtmlText(detail.orderedAt)} · In lúc: ${escapeHtmlText(printedAt)}</div>
  </div>
  <div class="agency">
    <strong>${escapeHtmlText(detail.agencyShortName)} (${escapeHtmlText(detail.agencyCode)})</strong>
    <div>${escapeHtmlText(detail.agencyLegalName)}</div>
    <div>Điện thoại: ${escapeHtmlText(detail.agencyPhone)} · Email: ${escapeHtmlText(detail.agencyEmail)}</div>
    <div>Địa chỉ: ${escapeHtmlText(detail.agencyAddress)} · ${escapeHtmlText(detail.agencyCity)}</div>
  </div>
  <table>
    <thead>
      <tr>
        <th class="num">#</th>
        <th>Loại</th>
        <th>Mã hàng</th>
        <th>Tên hạng mục</th>
        <th class="num">SL</th>
        <th class="num">Đơn giá</th>
        <th class="num">Giá vốn</th>
        <th class="num">Thành tiền</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="7" style="text-align:right;font-weight:600">Cộng các dòng</td>
        <td class="num">${escapeHtmlText(formatVND(itemsSum))}</td>
      </tr>
    </tfoot>
  </table>
  <div class="totals">
    <table>
      <tr><td>Giá trước giảm</td><td class="num">${escapeHtmlText(formatVND(detail.subtotalBeforeDiscountVnd))}</td></tr>
      ${
        detail.discountVnd > 0
          ? `<tr><td>Tổng chiết khấu</td><td class="num">−${escapeHtmlText(formatVND(detail.discountVnd))}</td></tr>`
          : ''
      }
      <tr><td>Thành tiền hàng</td><td class="num">${escapeHtmlText(formatVND(detail.totalVnd))}</td></tr>
      <tr><td>Phí giao / lắp (ước)</td><td class="num">${detail.shippingFeeVnd === 0 ? '—' : escapeHtmlText(formatVND(detail.shippingFeeVnd))}</td></tr>
      <tr><td>Phí dịch vụ khác</td><td class="num">${detail.serviceFeeVnd === 0 ? '—' : escapeHtmlText(formatVND(detail.serviceFeeVnd))}</td></tr>
      <tr class="grand"><td>Tổng thanh toán</td><td class="num">${escapeHtmlText(formatVND(detail.grandTotalVnd))}</td></tr>
      <tr><td>${detail.orderDetailSource === 'api' ? 'Đã thanh toán' : 'Đã cọc'}</td><td class="num">${escapeHtmlText(formatVND(detail.depositVnd))}</td></tr>
      <tr><td>Còn phải thu</td><td class="num">${escapeHtmlText(formatVND(detail.balanceDueVnd))}</td></tr>
    </table>
  </div>
  ${internalNoteBlock}
</body>
</html>`
}

function isSellerBackendOrderIdParam(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim())
}

/**
 * Chỉ hiển thị từ xưởng đang ráp trở đi (không còn Nháp / Chờ duyệt trên thanh tiến độ).
 * draft · pending · approved: chưa vào xưởng → cả 3 bước đều upcoming (stepIndex -1).
 */
const ORDER_FACTORY_PIPELINE_STEP_BY_STATUS: Partial<Record<SellerOrderListRowStatus, number>> = {
  draft: -1,
  pending: -1,
  pending_approval: -1,
  approved: -1,
  producing: 0,
  shipping: 1,
  done: 2,
  canceled: -1,
}

const ORDER_FACTORY_PIPELINE: { status: SellerOrderDetail['status']; label: string; hint: string }[] = [
  { status: 'producing', label: 'Xưởng ráp', hint: 'BOM — thợ thi công' },
  { status: 'shipping', label: 'Giao hàng', hint: 'Xe tải / nhận tại kho' },
  { status: 'done', label: 'Hoàn tất', hint: 'Nghiệm thu — công nợ' },
]

function agencyInitials(shortName: string): string {
  const p = shortName.trim().split(/\s+/)
  if (p.length >= 2) {
    const a = p[0]?.[0]
    const b = p[p.length - 1]?.[0]
    if (a && b) return (a + b).toUpperCase()
  }
  return shortName.slice(0, 2).toUpperCase() || 'KH'
}

export function SellerOrderDetailInner({
  variant,
  orderCode,
}: {
  variant: SellerOrderDetailVariant
  orderCode: string
}) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'
  const [searchParams, setSearchParams] = useSearchParams()
  const isUuidParam = Boolean(orderCode && isSellerBackendOrderIdParam(orderCode))

  const [apiDetail, setApiDetail] = useState<SellerOrderDetail | null>(null)
  const [quotationStatus, setQuotationStatus] = useState<SellerQuotationStatus | null>(null)
  const [orderApiStatus, setOrderApiStatus] = useState<SellerApiOrderStatus | null>(null)
  /** Phải true ngay khi vào URL UUID — nếu false ở frame đầu, `!detail` sẽ redirect về list trước khi fetch chạy. */
  const [apiLoading, setApiLoading] = useState(() => isUuidParam)
  const [apiError, setApiError] = useState<string | null>(null)

  const [draftEditOpen, setDraftEditOpen] = useState(false)
  const [draftEditForm, setDraftEditForm] = useState<CreateSellerOrderPayload | null>(null)
  const [draftEditSaving, setDraftEditSaving] = useState(false)
  const [draftEditError, setDraftEditError] = useState<string | null>(null)
  const [draftAgencyOptions, setDraftAgencyOptions] = useState<
    { id: string; shortName: string; code: string }[]
  >([])
  const [submitOrderLoading, setSubmitOrderLoading] = useState(false)
  const [pushProductionOpen, setPushProductionOpen] = useState(false)
  const [pushProductionLoading, setPushProductionLoading] = useState(false)
  const [pushProductionError, setPushProductionError] = useState<string | null>(null)
  const [markDoneOpen, setMarkDoneOpen] = useState(false)
  const [markDoneLoading, setMarkDoneLoading] = useState(false)
  const [markDoneError, setMarkDoneError] = useState<string | null>(null)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'history' | 'new'>('history')
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false)
  const [paymentHistoryError, setPaymentHistoryError] = useState<string | null>(null)
  const [paymentHistoryRows, setPaymentHistoryRows] = useState<SellerOrderPaymentDto[]>([])
  const [newPayAmount, setNewPayAmount] = useState('')
  const [newPayMethod, setNewPayMethod] = useState('')
  const [newPayNote, setNewPayNote] = useState('')
  const [newPayImageUrl, setNewPayImageUrl] = useState('')
  const [newPayImageFile, setNewPayImageFile] = useState<File | null>(null)
  const [newPaySubmitting, setNewPaySubmitting] = useState(false)
  const [newPayError, setNewPayError] = useState<string | null>(null)
  const [factoryTasksLoading, setFactoryTasksLoading] = useState(false)
  const [factoryTasksError, setFactoryTasksError] = useState<string | null>(null)
  const [factoryTasks, setFactoryTasks] = useState<SellerOrderProductionTaskDto[]>([])

  const mockDetail = undefined

  useEffect(() => {
    if (!isUuidParam || !orderCode) {
      setApiDetail(null)
      setApiError(null)
      setApiLoading(false)
      setOrderApiStatus(null)
      setQuotationStatus(null)
      return
    }
    let cancelled = false
    setApiLoading(true)
    setApiError(null)
    void (async () => {
      try {
        if (variant === 'quotation') {
          const d = await fetchSellerQuotationById(orderCode)
          if (!cancelled) {
            setApiDetail(mapSellerOrderDtoToDetail(d))
            setOrderApiStatus(d.status)
            setQuotationStatus(d.quotationStatus ?? inferQuotationStatusFromOrder(d))
          }
        } else {
          const dto = await fetchSellerOrderById(orderCode)
          if (!cancelled) {
            setApiDetail(mapSellerOrderDtoToDetail(dto))
            setOrderApiStatus(dto.status)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setApiDetail(null)
          setOrderApiStatus(null)
          setQuotationStatus(null)
          setApiError(
            e instanceof Error
              ? e.message
              : variant === 'quotation'
                ? 'Không tải được chi tiết báo giá'
                : 'Không tải được chi tiết đơn',
          )
        }
      } finally {
        if (!cancelled) setApiLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isUuidParam, orderCode, variant])

  useEffect(() => {
    setDraftEditOpen(false)
    setDraftEditForm(null)
    setDraftEditError(null)
  }, [orderCode])

  useEffect(() => {
    if (!draftEditOpen) return
    let cancelled = false
    void (async () => {
      try {
        const data = await fetchSellerAgencies({ page: 0, size: 200, is_active: true })
        if (!cancelled) {
          setDraftAgencyOptions(
            data.content.map((a) => ({ id: a.id, shortName: a.shortName, code: a.code })),
          )
        }
      } catch {
        if (!cancelled) setDraftAgencyOptions([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [draftEditOpen])

  const detail = apiDetail ?? mockDetail

  /** Tiến độ đơn hàng: chỉ 3 bước xưởng → giao → hoàn tất. */
  const orderFactoryStepIndex = useMemo(() => {
    if (!detail) return -1
    const fromMap = ORDER_FACTORY_PIPELINE_STEP_BY_STATUS[detail.status]
    if (fromMap !== undefined) return fromMap
    return ORDER_FACTORY_PIPELINE.findIndex((p) => p.status === detail.status)
  }, [detail])

  const factoryProgress = null

  const factoryTasksOrdered = useMemo(
    () =>
      [...factoryTasks].sort(
        (a, b) =>
          new Date(b.taskCreatedAt || b.expectedEndDate || '').getTime() -
          new Date(a.taskCreatedAt || a.expectedEndDate || '').getTime(),
      ),
    [factoryTasks],
  )

  const itemsSumVnd = useMemo(
    () => detail?.items.reduce((s, x) => s + x.lineTotalVnd, 0) ?? 0,
    [detail],
  )

  const isProducing = detail?.status === 'producing'
  const detailTab =
    isProducing && searchParams.get('tab') === 'factory' ? 'factory' : 'detail'

  useEffect(() => {
    if (detail?.status !== 'producing' && searchParams.get('tab')) {
      setSearchParams({}, { replace: true })
    }
  }, [detail?.status, searchParams, setSearchParams])

  useEffect(() => {
    if (!isProducing || detailTab !== 'factory' || !isUuidParam || !orderCode) return
    let cancelled = false
    setFactoryTasksLoading(true)
    setFactoryTasksError(null)
    void (async () => {
      try {
        const tasks = await fetchSellerOrderProductionTasks(orderCode)
        if (!cancelled) setFactoryTasks(tasks)
      } catch (e) {
        if (!cancelled) {
          setFactoryTasks([])
          setFactoryTasksError(e instanceof Error ? e.message : 'Không tải được tiến độ xưởng')
        }
      } finally {
        if (!cancelled) setFactoryTasksLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [detailTab, isProducing, isUuidParam, orderCode])

  const handlePrintQuotation = useCallback(() => {
    if (!detail) return
    const html = buildSellerOrderPrintDocumentHtml(detail, variant)
    /* Không truyền noopener vào window.open: Chromium trả về null → luôn báo chặn popup dù thực tế không chặn. */
    const w = window.open('about:blank', '_blank')
    if (!w) {
      window.alert('Không mở được cửa sổ in. Vui lòng cho phép popup cho trang này.')
      return
    }
    w.opener = null
    w.document.write(html)
    w.document.close()
    w.focus()
    const doPrint = () => {
      try {
        w.print()
      } catch {
        /* ignore */
      }
    }
    if (w.document.readyState === 'complete') {
      window.setTimeout(doPrint, 0)
    } else {
      w.addEventListener('load', () => window.setTimeout(doPrint, 0))
    }
  }, [detail, variant])

  const mergeDtoIntoState = useCallback(
    (dto: SellerOrderListDto) => {
      setApiDetail(mapSellerOrderDtoToDetail(dto))
      setOrderApiStatus(dto.status)
      if (variant === 'quotation') {
        const q = dto as SellerQuotationListDto
        setQuotationStatus(q.quotationStatus ?? inferQuotationStatusFromOrder(dto))
      }
    },
    [variant],
  )

  const handlePushProductionConfirm = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setPushProductionLoading(true)
    setPushProductionError(null)
    try {
      const dto = await pushSellerOrderToProduction(orderCode)
      mergeDtoIntoState(dto)
      setPushProductionOpen(false)
    } catch (e) {
      setPushProductionError(
        e instanceof Error ? e.message : 'Không đẩy đơn xuống kho sản xuất được',
      )
    } finally {
      setPushProductionLoading(false)
    }
  }, [isUuidParam, mergeDtoIntoState, orderCode])

  const handleMarkDoneConfirm = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setMarkDoneLoading(true)
    setMarkDoneError(null)
    try {
      const dto = await markSellerOrderDone(orderCode)
      mergeDtoIntoState(dto)
      setMarkDoneOpen(false)
    } catch (e) {
      setMarkDoneError(
        e instanceof Error ? e.message : 'Không thể hoàn thành đơn hàng',
      )
    } finally {
      setMarkDoneLoading(false)
    }
  }, [isUuidParam, mergeDtoIntoState, orderCode])

  const loadPaymentHistory = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setPaymentHistoryLoading(true)
    setPaymentHistoryError(null)
    try {
      const rows = await fetchSellerOrderPayments(orderCode)
      setPaymentHistoryRows(rows)
    } catch (e) {
      setPaymentHistoryRows([])
      setPaymentHistoryError(e instanceof Error ? e.message : 'Không tải được lịch sử thanh toán')
    } finally {
      setPaymentHistoryLoading(false)
    }
  }, [isUuidParam, orderCode])

  useEffect(() => {
    if (!paymentDialogOpen || paymentTab !== 'history') return
    void loadPaymentHistory()
  }, [loadPaymentHistory, paymentDialogOpen, paymentTab])

  const handleCreatePayment = useCallback(async () => {
    if (!isUuidParam || !orderCode || !detail) return
    const amount = Number(newPayAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setNewPayError('Số tiền thanh toán phải lớn hơn 0.')
      return
    }
    const paymentMethod = newPayMethod.trim()
    if (!paymentMethod) {
      setNewPayError('Vui lòng chọn phương thức thanh toán.')
      return
    }
    const isCash = paymentMethod === 'Tiền mặt'
    setNewPaySubmitting(true)
    setNewPayError(null)
    try {
      let finalProofImage: string | null = null
      if (!isCash) {
        finalProofImage = newPayImageUrl.trim() || null
      }
      if (!isCash && newPayImageFile) {
        const accessToken = getAccessToken()
        if (!accessToken) {
          throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.')
        }
        const uploadBody = new FormData()
        uploadBody.append('file', newPayImageFile)
        const uploadRes = await fetch(`${API_BASE_URL}/api/uploadable/image`, {
          method: 'POST',
          headers: {
            accept: '*/*',
            Authorization: `${getTokenType()} ${accessToken}`,
          },
          body: uploadBody,
        })
        const uploadEnvelope = (await uploadRes.json()) as {
          success: boolean
          message: string
          data?: { url?: string }
        }
        if (!uploadRes.ok || !uploadEnvelope.success || !uploadEnvelope.data?.url) {
          throw new Error(uploadEnvelope.message || 'Upload ảnh thất bại')
        }
        finalProofImage = uploadEnvelope.data.url
      }

      await createSellerOrderPayment({
        orderId: orderCode,
        agencyId: detail.agencyId,
        amount,
        paymentMethod,
        proofImage: finalProofImage,
        note: newPayNote.trim() || null,
      })
      setNewPayAmount('')
      setNewPayMethod('')
      setNewPayNote('')
      setNewPayImageUrl('')
      setNewPayImageFile(null)
      setPaymentTab('history')
      await loadPaymentHistory()
    } catch (e) {
      setNewPayError(e instanceof Error ? e.message : 'Không tạo được thanh toán')
    } finally {
      setNewPaySubmitting(false)
    }
  }, [
    API_BASE_URL,
    detail,
    isUuidParam,
    loadPaymentHistory,
    newPayAmount,
    newPayImageFile,
    newPayImageUrl,
    newPayMethod,
    newPayNote,
    orderCode,
  ])

  const closeDraftEdit = useCallback(() => {
    setDraftEditOpen(false)
    setDraftEditForm(null)
    setDraftEditError(null)
  }, [])

  const openDraftEdit = useCallback(() => {
    if (!detail?.apiOrderLinesForEdit?.length) return
    setDraftEditForm({
      agencyId: detail.agencyId,
      discountAmount: detail.discountVnd,
      shippingFee: detail.shippingFeeVnd,
      shippingAddress: detail.agencyAddress,
      expectedDeliveryDate: detail.expectedDeliveryDate,
      note: detail.internalNote !== '—' && detail.internalNote?.trim() ? detail.internalNote : null,
      items: detail.apiOrderLinesForEdit.map((li) => ({
        productId: li.productId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
      })),
    })
    setDraftEditError(null)
    setDraftEditOpen(true)
  }, [detail])

  const patchDraftLine = useCallback(
    (index: number, patch: Partial<CreateSellerOrderPayload['items'][number]>) => {
      setDraftEditForm((prev) => {
        if (!prev) return prev
        const items = prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it))
        return { ...prev, items }
      })
    },
    [],
  )

  const handleDraftEditSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!draftEditForm || !isUuidParam || !orderCode) return
      const bad = draftEditForm.items.some((it) => it.quantity <= 0 || it.unitPrice < 0)
      if (bad) {
        setDraftEditError('Số lượng và đơn giá phải hợp lệ.')
        return
      }
      setDraftEditSaving(true)
      setDraftEditError(null)
      try {
        const payload: CreateSellerOrderPayload = {
          agencyId: draftEditForm.agencyId,
          discountAmount: draftEditForm.discountAmount,
          shippingFee: draftEditForm.shippingFee,
          shippingAddress: draftEditForm.shippingAddress,
          expectedDeliveryDate: draftEditForm.expectedDeliveryDate,
          note: draftEditForm.note,
          items: draftEditForm.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        }
        const dto = await updateSellerOrder(orderCode, payload)
        mergeDtoIntoState(dto)
        closeDraftEdit()
      } catch (err) {
        setDraftEditError(err instanceof Error ? err.message : 'Không lưu được')
      } finally {
        setDraftEditSaving(false)
      }
    },
    [closeDraftEdit, draftEditForm, isUuidParam, mergeDtoIntoState, orderCode],
  )

  const handleSubmitOrder = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    const confirmed = window.confirm(
      'Gửi đơn lên để duyệt?\n\nSau khi gửi, đơn chuyển sang trạng thái Chờ duyệt và không thể chỉnh sửa nháp nữa.',
    )
    if (!confirmed) return
    setSubmitOrderLoading(true)
    try {
      const dto = await submitSellerOrder(orderCode)
      mergeDtoIntoState(dto)
      closeDraftEdit()
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Không gửi được đơn duyệt')
    } finally {
      setSubmitOrderLoading(false)
    }
  }, [closeDraftEdit, isUuidParam, mergeDtoIntoState, orderCode])

  const listPath = variant === 'quotation' ? sellerPaths.quotations : sellerPaths.orders

  if (!orderCode) {
    return <Navigate to={listPath} replace />
  }

  if (isUuidParam && apiLoading) {
    return (
      <div className="th-seller-order-detail">
        <p className="th-seller-order-detail__muted" style={{ padding: '2rem 1rem' }}>
          {variant === 'quotation' ? 'Đang tải chi tiết báo giá…' : 'Đang tải chi tiết đơn…'}
        </p>
      </div>
    )
  }

  if (isUuidParam && apiError) {
    return (
      <div className="th-seller-order-detail" style={{ padding: '1rem' }}>
        <p className="th-admin-users__api-error" role="alert">
          {apiError}
        </p>
        <p style={{ marginTop: '1rem' }}>
          <Link className="th-seller-order-detail__btn th-seller-order-detail__btn--muted" to={listPath}>
            ← Quay lại danh sách
          </Link>
        </p>
      </div>
    )
  }

  if (!detail) {
    return <Navigate to={listPath} replace />
  }

  const quotationPipeline =
    variant === 'quotation' && quotationStatus != null && orderApiStatus != null
      ? resolveQuotationPipeline(quotationStatus, orderApiStatus)
      : null

  const formatFactoryLogTime = (iso: string) => {
    const t = Date.parse(iso)
    if (Number.isNaN(t)) return iso || '—'
    return new Date(t).toLocaleString('vi-VN')
  }

  return (
    <div className="th-seller-order-detail">
      <SellerPushProductionDialog
        open={pushProductionOpen}
        orderCode={detail.orderCode}
        contextHint={`${detail.agencyShortName} · ${formatVND(detail.grandTotalVnd)}`}
        isSubmitting={pushProductionLoading}
        submitError={pushProductionError}
        onClose={() => {
          if (pushProductionLoading) return
          setPushProductionOpen(false)
          setPushProductionError(null)
        }}
        onConfirm={() => void handlePushProductionConfirm()}
      />
      {markDoneOpen ? (
        <dialog open className="th-dlg" onClick={() => (!markDoneLoading ? setMarkDoneOpen(false) : null)}>
          <section
            className="th-dlg__panel th-admin-users"
            role="dialog"
            aria-modal="true"
            aria-label="Hoàn thành đơn hàng"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  task_alt
                </span>
              </div>
              <h3 className="th-dlg__title">Xác nhận hoàn thành đơn hàng</h3>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => (!markDoneLoading ? setMarkDoneOpen(false) : null)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>
            <div className="th-dlg__body">
              <p>
                Đơn <code>{detail.orderCode}</code> đang ở trạng thái xưởng ráp. Xác nhận chuyển sang <strong>Hoàn tất</strong>?
              </p>
              {markDoneError ? (
                <p className="th-admin-users__api-error" role="alert">
                  {markDoneError}
                </p>
              ) : null}
            </div>
            <footer className="th-dlg__footer">
              <button
                type="button"
                className="th-admin-users__btn-ghost"
                disabled={markDoneLoading}
                onClick={() => setMarkDoneOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="th-admin-users__btn-primary"
                disabled={markDoneLoading}
                onClick={() => void handleMarkDoneConfirm()}
              >
                {markDoneLoading ? 'Đang cập nhật…' : 'Xác nhận hoàn tất'}
              </button>
            </footer>
          </section>
        </dialog>
      ) : null}
      <div className="th-seller-order-detail__hero">
        <nav className="th-seller-order-detail__breadcrumb" aria-label="Breadcrumb">
          <ol className="th-seller-order-detail__breadcrumb-list">
            <li className="th-seller-order-detail__breadcrumb-item">
              <Link to={sellerPaths.dashboard} className="th-seller-order-detail__breadcrumb-link">
                Trang NVBH
              </Link>
              <span className="th-seller-order-detail__breadcrumb-sep" aria-hidden>
                <span className="material-symbols-outlined">chevron_right</span>
              </span>
            </li>
            <li className="th-seller-order-detail__breadcrumb-item">
              <Link to={listPath} className="th-seller-order-detail__breadcrumb-link">
                {variant === 'quotation' ? 'Báo giá' : 'Đơn đặt hàng'}
              </Link>
              <span className="th-seller-order-detail__breadcrumb-sep" aria-hidden>
                <span className="material-symbols-outlined">chevron_right</span>
              </span>
            </li>
            <li className="th-seller-order-detail__breadcrumb-item">
              <span className="th-seller-order-detail__breadcrumb-current" aria-current="page">
                {detail.orderCode}
              </span>
            </li>
          </ol>
        </nav>

        <header className="th-seller-order-detail__header">
          <div className="th-seller-order-detail__header-main">
            <div className="th-seller-order-detail__title-row">
              <span className="material-symbols-outlined th-seller-order-detail__title-icon" aria-hidden>
                {variant === 'quotation' ? 'request_quote' : 'receipt_long'}
              </span>
              <div>
                <p className="th-seller-order-detail__kicker">
                  {variant === 'quotation' ? 'Báo giá NVBH' : 'Đơn đặt hàng bán sỉ'}
                </p>
                <h1 className="th-seller-order-detail__title">
                  <code className="th-seller-order-detail__order-code">{detail.orderCode}</code>
                </h1>
                <ul className="th-seller-order-detail__meta-chips" aria-label="Thông tin nhanh đơn">
                  <li>
                    <span className="material-symbols-outlined" aria-hidden>
                      calendar_today
                    </span>
                    Lập {detail.orderedAt}
                  </li>
                  <li>
                    <span className="material-symbols-outlined" aria-hidden>
                      view_list
                    </span>
                    {detail.lineCount} dòng
                  </li>
                  <li>
                    <span className="material-symbols-outlined" aria-hidden>
                      person
                    </span>
                    {detail.createdByName ? `Tạo bởi ${detail.createdByName}` : `NVBH ${SELLER_LOGIN_NAME}`}
                  </li>
                </ul>
              </div>
            </div>
            <div className="th-seller-order-detail__header-right">
            <div className="th-seller-order-detail__header-badges">
              <span
                className={`th-seller-order-detail__pill th-seller-order-detail__pill--kind th-seller-order-detail__pill--kind-${detail.orderKind}`}
                title={
                  detail.orderKind === 'ready_made'
                    ? 'Thành phẩm chuẩn từ catalog'
                    : 'Đơn theo thiết kế riêng'
                }
              >
                {sellerOrderKindLabel(detail.orderKind)}
              </span>
              <span className={`th-seller-order-detail__pill th-seller-order-detail__pill--${detail.status}`}>
                  {sellerOrderRowStatusLabel(detail.status)}
              </span>
              {detail.discountVnd > 0 ? (
                <span className="th-seller-order-detail__pill th-seller-order-detail__pill--discount">
                  Tổng chiết khấu {formatVND(detail.discountVnd)}
                </span>
              ) : null}
              </div>
              <div className="th-seller-order-detail__header-actions">
                {detail.status === 'draft' && detail.orderDetailSource === 'api' && isUuidParam ? (
                  <button
                    type="button"
                    className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                    onClick={() => void handleSubmitOrder()}
                    disabled={submitOrderLoading || draftEditSaving}
                  >
                    {submitOrderLoading ? 'Đang gửi…' : 'Gửi đơn duyệt'}
                  </button>
                ) : null}
                {detail.status !== 'draft' &&
                detail.status !== 'pending' &&
                detail.status !== 'pending_approval' &&
                detail.orderDetailSource === 'api' &&
                isUuidParam ? (
                  <button
                    type="button"
                    className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost"
                    onClick={() => {
                      setPaymentDialogOpen(true)
                      setPaymentTab('history')
                      setPaymentHistoryError(null)
                    }}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      payments
                    </span>
                    Thanh toán
                  </button>
                ) : null}
                {detail.status === 'approved' && detail.orderDetailSource === 'api' && isUuidParam ? (
                  <button
                    type="button"
                    className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                    onClick={() => {
                      setPushProductionError(null)
                      setPushProductionOpen(true)
                    }}
                    disabled={pushProductionLoading}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      precision_manufacturing
                    </span>
                    Đẩy xuống kho sản xuất
                  </button>
                ) : null}
                {detail.status === 'producing' && detail.orderDetailSource === 'api' && isUuidParam ? (
                  <button
                    type="button"
                    className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                    onClick={() => {
                      setMarkDoneError(null)
                      setMarkDoneOpen(true)
                    }}
                    disabled={markDoneLoading}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      task_alt
                    </span>
                    Hoàn thành đơn hàng
                  </button>
                ) : null}
                <button
                  type="button"
                  className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost"
                  onClick={() => handlePrintQuotation()}
                >
                  <span className="material-symbols-outlined" aria-hidden>
                    print
                  </span>
                  In báo giá
                </button>
                <Link to={listPath} className="th-seller-order-detail__btn th-seller-order-detail__btn--muted">
                  Quay lại danh sách
                </Link>
              </div>
            </div>
          </div>
          <div className="th-seller-order-detail__summary-callout">
            <span className="material-symbols-outlined th-seller-order-detail__summary-callout-icon" aria-hidden>
              notes
            </span>
            <p className="th-seller-order-detail__summary-line">{detail.summary}</p>
          </div>
          {detail.orderKind === 'custom' && detail.requirementDescription ? (
            <div
              className="th-seller-order-detail__requirement-callout"
              aria-labelledby="th-sod-requirement-title"
            >
              <span
                className="material-symbols-outlined th-seller-order-detail__requirement-callout-icon"
                aria-hidden
              >
                engineering
              </span>
              <div className="th-seller-order-detail__requirement-callout-body">
                <p id="th-sod-requirement-title" className="th-seller-order-detail__requirement-callout-kicker">
                  Mô tả yêu cầu (đơn custom)
                </p>
                <p className="th-seller-order-detail__requirement-callout-text">{detail.requirementDescription}</p>
              </div>
            </div>
          ) : null}
        </header>
      </div>

      {detail.orderDetailSource === 'api' &&
      detail.status === 'draft' &&
      detail.apiOrderLinesForEdit?.length ? (
        <section className="th-seller-order-detail__draft-banner" aria-label="Sửa đơn nháp">
          {!draftEditOpen ? (
            <div className="th-seller-order-detail__draft-banner-inner">
              <p className="th-seller-order-detail__draft-banner-text">
                <span className="material-symbols-outlined" aria-hidden>
                  edit_note
                </span>
                Đơn Nháp — có thể cập nhật nội dung trước khi chốt gửi duyệt.
              </p>
              <button
                type="button"
                className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                onClick={openDraftEdit}
              >
                Sửa đơn
              </button>
            </div>
          ) : draftEditForm ? (
            <form className="th-seller-order-detail__draft-form" onSubmit={handleDraftEditSubmit}>
              {draftEditError ? (
                <p className="th-admin-users__api-error" role="alert">
                  {draftEditError}
                </p>
              ) : null}
              <div className="th-seller-order-detail__draft-fields">
                <label className="th-seller-order-detail__field">
                  <span>Khách sỉ</span>
                  <select
                    value={draftEditForm.agencyId}
                    onChange={(e) =>
                      setDraftEditForm((f) => (f ? { ...f, agencyId: e.target.value } : f))
                    }
                    required
                  >
                    {!draftAgencyOptions.some((x) => x.id === draftEditForm.agencyId) ? (
                      <option value={draftEditForm.agencyId}>
                        {detail.agencyShortName} (hiện tại)
                      </option>
                    ) : null}
                    {draftAgencyOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.shortName} ({a.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="th-seller-order-detail__field">
                  <span>Chiết khấu (₫)</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={draftEditForm.discountAmount}
                    onChange={(e) =>
                      setDraftEditForm((f) =>
                        f ? { ...f, discountAmount: Number(e.target.value) || 0 } : f,
                      )
                    }
                  />
                </label>
                <label className="th-seller-order-detail__field">
                  <span>Phí giao (₫)</span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={draftEditForm.shippingFee}
                    onChange={(e) =>
                      setDraftEditForm((f) =>
                        f ? { ...f, shippingFee: Number(e.target.value) || 0 } : f,
                      )
                    }
                  />
                </label>
                <label className="th-seller-order-detail__field th-seller-order-detail__field--full">
                  <span>Địa chỉ giao hàng</span>
                  <input
                    type="text"
                    value={draftEditForm.shippingAddress}
                    onChange={(e) =>
                      setDraftEditForm((f) => (f ? { ...f, shippingAddress: e.target.value } : f))
                    }
                    required
                  />
                </label>
                <label className="th-seller-order-detail__field">
                  <span>Ngày giao dự kiến</span>
                  <input
                    type="date"
                    value={draftEditForm.expectedDeliveryDate ?? ''}
                    onChange={(e) =>
                      setDraftEditForm((f) =>
                        f
                          ? {
                              ...f,
                              expectedDeliveryDate: e.target.value.trim() || null,
                            }
                          : f,
                      )
                    }
                  />
                </label>
                <label className="th-seller-order-detail__field th-seller-order-detail__field--full">
                  <span>Ghi chú đơn</span>
                  <textarea
                    value={draftEditForm.note ?? ''}
                    onChange={(e) =>
                      setDraftEditForm((f) =>
                        f ? { ...f, note: e.target.value ? e.target.value : null } : f,
                      )
                    }
                    rows={2}
                  />
                </label>
              </div>
              <div className="th-seller-order-detail__draft-lines">
                <p className="th-seller-order-detail__draft-lines-title">Dòng hàng</p>
                <div className="th-seller-order-detail__table-wrap">
                  <table className="th-seller-order-detail__table th-seller-order-detail__table--edit">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Mã sản phẩm</th>
                        <th>Tên sản phẩm</th>
                        <th className="th-seller-order-detail__th-num">SL</th>
                        <th className="th-seller-order-detail__th-num">Đơn giá</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draftEditForm.items.map((line, idx) => (
                        <tr key={`${line.productId ?? 'c'}-${idx}`}>
                          <td className="th-seller-order-detail__td-num">{idx + 1}</td>
                          <td>
                            <code className="th-seller-order-detail__sku">
                              {line.productId ?? '—'}
                            </code>
                          </td>
                          <td>
                            <span className="th-seller-order-detail__draft-line-name-readonly">
                              {detail.items[idx]?.productName ?? '—'}
                            </span>
                          </td>
                          <td className="th-seller-order-detail__td-num">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              className="th-seller-order-detail__inline-input th-seller-order-detail__inline-input--num"
                              value={line.quantity}
                              onChange={(e) =>
                                patchDraftLine(idx, { quantity: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                          <td className="th-seller-order-detail__td-num">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              className="th-seller-order-detail__inline-input th-seller-order-detail__inline-input--num"
                              value={line.unitPrice}
                              onChange={(e) =>
                                patchDraftLine(idx, { unitPrice: Number(e.target.value) || 0 })
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="th-seller-order-detail__draft-actions">
                <button
                  type="submit"
                  className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                  disabled={draftEditSaving || submitOrderLoading}
                >
                  {draftEditSaving ? 'Đang lưu…' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost"
                  disabled={draftEditSaving || submitOrderLoading}
                  onClick={closeDraftEdit}
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : null}
        </section>
      ) : null}

      {isProducing ? (
        <div className="th-seller-order-detail__page-tabs" role="tablist" aria-label="Nội dung chi tiết đơn">
          <button
            type="button"
            role="tab"
            id="th-sod-tab-detail"
            aria-selected={detailTab === 'detail'}
            aria-controls="th-sod-panel-detail"
            className={
              detailTab === 'detail'
                ? 'th-seller-order-detail__page-tab th-seller-order-detail__page-tab--active'
                : 'th-seller-order-detail__page-tab'
            }
            onClick={() => setSearchParams({}, { replace: true })}
          >
            <span className="material-symbols-outlined" aria-hidden>
              description
            </span>
            Chi tiết đơn
          </button>
          <button
            type="button"
            role="tab"
            id="th-sod-tab-factory"
            aria-selected={detailTab === 'factory'}
            aria-controls="th-sod-panel-factory"
            className={
              detailTab === 'factory'
                ? 'th-seller-order-detail__page-tab th-seller-order-detail__page-tab--active'
                : 'th-seller-order-detail__page-tab'
            }
            onClick={() => setSearchParams({ tab: 'factory' }, { replace: true })}
          >
            <span className="material-symbols-outlined" aria-hidden>
              precision_manufacturing
            </span>
            Tiến độ xưởng
          </button>
        </div>
      ) : null}

      {detailTab === 'factory' ? (
        <div
          id="th-sod-panel-factory"
          role="tabpanel"
          aria-labelledby="th-sod-tab-factory"
          className="th-seller-order-detail__tab-panel"
        >
          <section className="th-seller-order-detail__card th-seller-order-detail__card--wide">
            <h2 className="th-seller-order-detail__card-title">
              <span className="material-symbols-outlined" aria-hidden>
                manufacturing
              </span>
              Tiến độ xưởng
            </h2>
            {isUuidParam ? (
              factoryTasksLoading ? (
                <p className="th-seller-order-detail__muted">Đang tải nhật ký xưởng…</p>
              ) : factoryTasksError ? (
                <p className="th-admin-users__api-error" role="alert">
                  {factoryTasksError}
                </p>
              ) : factoryTasksOrdered.length === 0 ? (
                <p className="th-seller-order-detail__muted">Chưa có nhật ký tiến độ nào.</p>
              ) : (
                <div className="th-seller-order-detail__factory-task-list">
                  {factoryTasksOrdered.map((task) => (
                    <article key={task.taskId} className="th-seller-order-detail__factory-task-card">
                      <div className="th-seller-order-detail__factory-task-head">
                        <div className="th-seller-order-detail__factory-task-title">
                          <strong>{task.productName || 'Lệnh sản xuất'}</strong>
                          <span>SL: {task.quantity}</span>
                        </div>
                        <span
                          className={`th-seller-order-detail__factory-task-pill th-seller-order-detail__factory-task-pill--${task.status.toLowerCase()}`}
                        >
                          {task.status === 'Waiting'
                            ? 'Chờ làm'
                            : task.status === 'Doing'
                              ? 'Đang làm'
                              : 'Hoàn tất'}
                        </span>
                      </div>
                      <div className="th-seller-order-detail__factory-task-meta">
                        <code>{task.taskId}</code>
                        <span>Thợ: {task.assignedToName || '—'}</span>
                        <span>
                          Hạn: {task.expectedEndDate || '—'}
                        </span>
                      </div>
                      {task.activityLogs?.length ? (
                        <ol className="th-seller-order-detail__factory-log-list">
                          {[...task.activityLogs]
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                            )
                            .map((log) => (
                            <li key={log.id} className="th-seller-order-detail__factory-log-item">
                              <div className="th-seller-order-detail__factory-log-head">
                                <div className="th-seller-order-detail__factory-log-meta">
                                  <strong>{log.userName}</strong>
                                  <span>{formatFactoryLogTime(log.createdAt)}</span>
                                </div>
                              </div>
                              <p className="th-seller-order-detail__factory-log-desc">{log.description}</p>
                              {log.imageUrl ? (
                                <a href={log.imageUrl} target="_blank" rel="noreferrer">
                                  Xem ảnh minh chứng
                                </a>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="th-seller-order-detail__muted">Lệnh chưa có nhật ký tiến độ.</p>
                      )}
                    </article>
                  ))}
                </div>
              )
            ) : factoryProgress ? (
              <p className="th-seller-order-detail__muted">
                Đơn mẫu chưa có nhật ký tiến độ xưởng; đang hiển thị luồng minh hoạ.
              </p>
            ) : (
              <p className="th-seller-order-detail__muted">Không có dữ liệu tiến độ xưởng.</p>
            )}
          </section>
        </div>
      ) : (
        <div
          id="th-sod-panel-detail"
          role="tabpanel"
          aria-labelledby={isProducing ? 'th-sod-tab-detail' : undefined}
          aria-label={!isProducing ? 'Chi tiết đơn hàng' : undefined}
          className="th-seller-order-detail__tab-panel"
        >
      <section
        className={
          variant === 'quotation' && quotationPipeline?.isRejectedFlow
            ? 'th-seller-order-detail__pipeline th-seller-order-detail__pipeline--quotation-rejected'
            : detail.status === 'canceled' && variant !== 'quotation'
              ? 'th-seller-order-detail__pipeline th-seller-order-detail__pipeline--canceled'
              : 'th-seller-order-detail__pipeline'
        }
        aria-labelledby="th-sod-pipeline-title"
      >
        <div className="th-seller-order-detail__pipeline-head">
          <h2 id="th-sod-pipeline-title" className="th-seller-order-detail__pipeline-title">
            {variant === 'quotation' ? 'Tiến độ báo giá' : 'Tiến độ xử lý'}
          </h2>
        </div>
        {variant === 'quotation' && quotationPipeline ? (
          <ol className="th-seller-order-detail__pipeline-steps">
            {quotationPipeline.steps.map((step, i) => {
              const last = i === quotationPipeline.steps.length - 1
              const done = step.state === 'done'
              const skipped = step.state === 'skipped'
              const current = step.state === 'current'
              const leftLineDone =
                i > 0 &&
                (quotationPipeline.steps[i - 1]!.state === 'done' ||
                  quotationPipeline.steps[i - 1]!.state === 'skipped')
              const rightLineDone =
                !last &&
                (step.state === 'done' ||
                  (step.state === 'skipped' && quotationPipeline.steps[i + 1]?.state === 'current'))
              return (
                <li
                  key={`qt-${i}-${step.label}`}
                  className={
                    skipped
                      ? 'th-seller-order-detail__pstep th-seller-order-detail__pstep--skipped'
                      : done
                        ? 'th-seller-order-detail__pstep th-seller-order-detail__pstep--done'
                        : current
                          ? 'th-seller-order-detail__pstep th-seller-order-detail__pstep--current'
                          : 'th-seller-order-detail__pstep'
                  }
                >
                  <div className="th-seller-order-detail__pstep-rail">
                    <span
                      className={
                        i === 0
                          ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--spacer'
                          : leftLineDone
                            ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--done'
                            : 'th-seller-order-detail__pstep-seg'
                      }
                      aria-hidden
                    />
                    <span className="th-seller-order-detail__pstep-marker" aria-hidden>
                      {done ? (
                        <span className="material-symbols-outlined th-seller-order-detail__pstep-check">
                          check
                        </span>
                      ) : skipped ? (
                        <span className="th-seller-order-detail__pstep-skip" aria-hidden>
                          —
                        </span>
                      ) : (
                        <span className="th-seller-order-detail__pstep-num">{i + 1}</span>
                      )}
                    </span>
                    <span
                      className={
                        last
                          ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--spacer'
                          : rightLineDone
                            ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--done'
                            : 'th-seller-order-detail__pstep-seg'
                      }
                      aria-hidden
                    />
                  </div>
                  <div className="th-seller-order-detail__pstep-body">
                    <span className="th-seller-order-detail__pstep-label">{step.label}</span>
                    {step.hint.trim() ? (
                      <span className="th-seller-order-detail__pstep-hint">{step.hint}</span>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        ) : variant === 'quotation' ? (
          <p className="th-seller-order-detail__muted" role="status">
            Không hiển thị được tiến độ báo giá (thiếu trạng thái).
          </p>
        ) : detail.status === 'canceled' ? (
          <div
            className="th-seller-order-detail__pipeline-canceled"
            role="status"
            aria-label={`Trạng thái: ${sellerOrderRowStatusLabel(detail.status)}`}
          >
            <span className="th-seller-order-detail__pipeline-canceled-marker" aria-hidden>
              <span className="material-symbols-outlined th-seller-order-detail__pipeline-canceled-x">
                close
              </span>
            </span>
            <span className="th-seller-order-detail__pipeline-canceled-label">
              {sellerOrderRowStatusLabel(detail.status)}
            </span>
            <span className="th-seller-order-detail__pipeline-canceled-hint">
              Đơn đã dừng — không còn các bước xử lý tiếp theo.
            </span>
          </div>
        ) : (
          <ol className="th-seller-order-detail__pipeline-steps">
            {ORDER_FACTORY_PIPELINE.map((p, i) => {
              const done = orderFactoryStepIndex > i || detail.status === 'done'
              const current = i === orderFactoryStepIndex && detail.status !== 'done'
              const last = i === ORDER_FACTORY_PIPELINE.length - 1
              const leftLineDone =
                i > 0 && (orderFactoryStepIndex > i - 1 || detail.status === 'done')
              const rightLineDone =
                !last && (orderFactoryStepIndex > i || detail.status === 'done')
              return (
                <li
                  key={p.status}
                  className={
                    done
                      ? 'th-seller-order-detail__pstep th-seller-order-detail__pstep--done'
                      : current
                        ? 'th-seller-order-detail__pstep th-seller-order-detail__pstep--current'
                        : 'th-seller-order-detail__pstep'
                  }
                >
                  <div className="th-seller-order-detail__pstep-rail">
                    <span
                      className={
                        i === 0
                          ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--spacer'
                          : leftLineDone
                            ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--done'
                            : 'th-seller-order-detail__pstep-seg'
                      }
                      aria-hidden
                    />
                    <span className="th-seller-order-detail__pstep-marker" aria-hidden>
                      {done ? (
                        <span className="material-symbols-outlined th-seller-order-detail__pstep-check">
                          check
                        </span>
                      ) : (
                        <span className="th-seller-order-detail__pstep-num">{i + 1}</span>
                      )}
                    </span>
                    <span
                      className={
                        last
                          ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--spacer'
                          : rightLineDone
                            ? 'th-seller-order-detail__pstep-seg th-seller-order-detail__pstep-seg--done'
                            : 'th-seller-order-detail__pstep-seg'
                      }
                      aria-hidden
                    />
                  </div>
                  <div className="th-seller-order-detail__pstep-body">
                    <span className="th-seller-order-detail__pstep-label">{p.label}</span>
                    <span className="th-seller-order-detail__pstep-hint">{p.hint}</span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <div className="th-seller-order-detail__grid">
        <section className="th-seller-order-detail__card" aria-labelledby="th-sod-agency">
          <h2 id="th-sod-agency" className="th-seller-order-detail__card-title">
            <span className="material-symbols-outlined" aria-hidden>
              domain
            </span>
            Khách sỉ
          </h2>
          <div className="th-seller-order-detail__agency">
            <div className="th-seller-order-detail__agency-top">
              <div className="th-seller-order-detail__agency-avatar" aria-hidden>
                {agencyInitials(detail.agencyShortName)}
              </div>
              <div className="th-seller-order-detail__agency-id">
                <div className="th-seller-order-detail__agency-name-row">
                  <span className="th-seller-order-detail__agency-name">{detail.agencyShortName}</span>
                  <code className="th-seller-order-detail__agency-code">{detail.agencyCode}</code>
                </div>
                <p className="th-seller-order-detail__agency-legal">{detail.agencyLegalName}</p>
              </div>
            </div>
            <ul className="th-seller-order-detail__contact-list">
              <li className="th-seller-order-detail__contact-row">
                <span className="th-seller-order-detail__contact-icon" aria-hidden>
                  <span className="material-symbols-outlined">call</span>
                </span>
                <div>
                  <span className="th-seller-order-detail__contact-label">Điện thoại</span>
                  <a
                    className="th-seller-order-detail__contact-value"
                    href={`tel:${detail.agencyPhone.replace(/\s/g, '')}`}
                  >
                    {detail.agencyPhone}
                  </a>
                </div>
              </li>
              <li className="th-seller-order-detail__contact-row">
                <span className="th-seller-order-detail__contact-icon" aria-hidden>
                  <span className="material-symbols-outlined">mail</span>
                </span>
                <div>
                  <span className="th-seller-order-detail__contact-label">Email</span>
                  <a className="th-seller-order-detail__contact-value" href={`mailto:${detail.agencyEmail}`}>
                    {detail.agencyEmail}
                  </a>
                </div>
              </li>
              <li className="th-seller-order-detail__contact-row">
                <span className="th-seller-order-detail__contact-icon" aria-hidden>
                  <span className="material-symbols-outlined">location_on</span>
                </span>
                <div>
                  <span className="th-seller-order-detail__contact-label">Địa chỉ giao dự kiến</span>
                  <span className="th-seller-order-detail__contact-value th-seller-order-detail__contact-value--multiline">
                    {detail.agencyAddress}
                    <span className="th-seller-order-detail__muted"> · {detail.agencyCity}</span>
                  </span>
                </div>
              </li>
            </ul>
            <Link
              to={sellerPaths.agency(detail.agencyId)}
              className="th-seller-order-detail__link-btn"
            >
              Mở hồ sơ khách
              <span className="material-symbols-outlined" aria-hidden>
                arrow_forward
              </span>
            </Link>
          </div>
        </section>

        <section className="th-seller-order-detail__card" aria-labelledby="th-sod-money">
          <h2 id="th-sod-money" className="th-seller-order-detail__card-title">
            <span className="material-symbols-outlined" aria-hidden>
              payments
            </span>
            Tổng hợp tiền
          </h2>
          <div className="th-seller-order-detail__money-inner">
            <p className="th-seller-order-detail__money-section-label">Giá trị đơn</p>
            <ul className="th-seller-order-detail__money-rows">
              <li>
                <span>Giá trước giảm</span>
                <strong>{formatVND(detail.subtotalBeforeDiscountVnd)}</strong>
              </li>
              {detail.discountVnd > 0 ? (
                <li className="th-seller-order-detail__money-rows--discount">
                  <span>Tổng chiết khấu</span>
                  <strong>−{formatVND(detail.discountVnd)}</strong>
                </li>
              ) : null}
              <li>
                <span>Thành tiền hàng</span>
                <strong>{formatVND(detail.totalVnd)}</strong>
              </li>
              <li>
                <span>Phí giao / lắp (ước)</span>
                <strong>{detail.shippingFeeVnd === 0 ? '—' : formatVND(detail.shippingFeeVnd)}</strong>
              </li>
              <li>
                <span>Phí dịch vụ khác</span>
                <strong>{detail.serviceFeeVnd === 0 ? '—' : formatVND(detail.serviceFeeVnd)}</strong>
              </li>
            </ul>
            <p className="th-seller-order-detail__money-section-label">Thanh toán</p>
            <ul className="th-seller-order-detail__money-rows th-seller-order-detail__money-rows--tight">
              <li className="th-seller-order-detail__money-rows--total">
                <span>Tổng thanh toán</span>
                <strong>{formatVND(detail.grandTotalVnd)}</strong>
              </li>
              <li>
                <span>{detail.orderDetailSource === 'api' ? 'Đã thanh toán' : 'Đã cọc'}</span>
                <strong className="th-seller-order-detail__money-deposit">{formatVND(detail.depositVnd)}</strong>
              </li>
              <li className="th-seller-order-detail__money-rows--due">
                <span>Còn phải thu</span>
                <strong>{formatVND(detail.balanceDueVnd)}</strong>
              </li>
            </ul>
          </div>
        </section>

        <section className="th-seller-order-detail__card th-seller-order-detail__card--wide" aria-labelledby="th-sod-lines">
          <h2 id="th-sod-lines" className="th-seller-order-detail__card-title">
            <span className="material-symbols-outlined" aria-hidden>
              inventory_2
            </span>
            Dòng hàng &amp; BOM ảo
          </h2>
          
          <div className="th-seller-order-detail__table-wrap">
            <table className="th-seller-order-detail__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Loại</th>
                  <th>Mã hàng</th>
                  <th>Tên hạng mục</th>
                  <th className="th-seller-order-detail__th-num">SL</th>
                  <th className="th-seller-order-detail__th-num">Đơn giá</th>
                  <th className="th-seller-order-detail__th-num">Giá vốn</th>
                  <th className="th-seller-order-detail__th-num">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((line) => (
                  <tr key={line.lineNo}>
                    <td className="th-seller-order-detail__td-num">{line.lineNo}</td>
                    <td>
                      <span
                        className={
                          line.kind === 'custom'
                            ? 'th-seller-order-detail__kind th-seller-order-detail__kind--custom'
                            : 'th-seller-order-detail__kind'
                        }
                      >
                        {line.kind === 'custom' ? 'Custom' : 'Catalog'}
                      </span>
                    </td>
                    <td>
                      <code className="th-seller-order-detail__sku">{line.sku}</code>
                    </td>
                    <td>
                      {line.productName}
                      {line.lineNote ? (
                        <span className="th-seller-order-detail__line-note">{line.lineNote}</span>
                      ) : null}
                    </td>
                    <td className="th-seller-order-detail__td-num">{line.qty}</td>
                    <td className="th-seller-order-detail__td-num">{formatVND(line.unitPriceVnd)}</td>
                    <td className="th-seller-order-detail__td-num">
                      {line.unitCostAtTimeVnd != null ? formatVND(line.unitCostAtTimeVnd) : '—'}
                    </td>
                    <td className="th-seller-order-detail__td-num">{formatVND(line.lineTotalVnd)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="th-seller-order-detail__table-foot">
                  <td colSpan={7} className="th-seller-order-detail__table-foot-label">
                    Cộng các dòng
                  </td>
                  <td className="th-seller-order-detail__td-num th-seller-order-detail__table-foot-sum">
                    {formatVND(itemsSumVnd)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="th-seller-order-detail__card" aria-labelledby="th-sod-note">
          <h2 id="th-sod-note" className="th-seller-order-detail__card-title">
            <span className="material-symbols-outlined" aria-hidden>
              sticky_note_2
            </span>
            Ghi chú
          </h2>
          <div className="th-seller-order-detail__note-box">
            <p className="th-seller-order-detail__note">{detail.internalNote}</p>
          </div>
        </section>

      </div>
        </div>
      )}

      {paymentDialogOpen ? (
        <dialog open className="th-dlg" onClick={() => setPaymentDialogOpen(false)}>
          <section
            className="th-dlg__panel th-admin-users th-seller-order-detail__paydlg"
            role="dialog"
            aria-modal="true"
            aria-label="Thanh toán đơn hàng"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="th-dlg__head">
              <div className="th-dlg__head-icon">
                <span className="material-symbols-outlined" aria-hidden>
                  payments
                </span>
              </div>
              <h3 className="th-dlg__title">Thanh toán đơn {detail.orderCode}</h3>
              <button
                type="button"
                className="th-dlg__close"
                onClick={() => setPaymentDialogOpen(false)}
                aria-label="Đóng"
              >
                <span className="material-symbols-outlined" aria-hidden>
                  close
                </span>
              </button>
            </header>

            <div className="th-dlg__body">
              <div className="th-seller-order-detail__paytabs" role="tablist" aria-label="Tab thanh toán">
                <button
                  type="button"
                  role="tab"
                  aria-selected={paymentTab === 'history'}
                  className={
                    paymentTab === 'history'
                      ? 'th-seller-order-detail__paytab th-seller-order-detail__paytab--active'
                      : 'th-seller-order-detail__paytab'
                  }
                  onClick={() => setPaymentTab('history')}
                >
                  Lịch sử
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={paymentTab === 'new'}
                  className={
                    paymentTab === 'new'
                      ? 'th-seller-order-detail__paytab th-seller-order-detail__paytab--active'
                      : 'th-seller-order-detail__paytab'
                  }
                  onClick={() => setPaymentTab('new')}
                >
                  Thanh toán mới
                </button>
              </div>

              {paymentTab === 'history' ? (
                <div className="th-seller-order-detail__payhist">
                  {paymentHistoryError ? (
                    <p className="th-admin-users__api-error" role="alert">
                      {paymentHistoryError}
                    </p>
                  ) : null}
                  {paymentHistoryLoading ? (
                    <p className="th-seller-order-detail__muted">Đang tải lịch sử thanh toán…</p>
                  ) : (
                    <div className="th-seller-order-detail__payhist-wrap">
                      <table className="th-seller-order-detail__payhist-table">
                        <thead>
                          <tr>
                            <th>Mã phiếu</th>
                            <th>Số tiền</th>
                            <th>Phương thức</th>
                            <th>Trạng thái</th>
                            <th>Ghi chú</th>
                            <th>Ảnh</th>
                            <th>Tạo lúc</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paymentHistoryRows.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="th-seller-order-detail__payhist-empty">
                                Chưa có thanh toán nào cho đơn này.
                              </td>
                            </tr>
                          ) : (
                            paymentHistoryRows.map((p) => (
                              <tr key={p.id}>
                                <td>
                                  <code>{p.id}</code>
                                </td>
                                <td className="th-seller-order-detail__payhist-num">{formatVND(p.amount)}</td>
                                <td>{p.paymentMethod}</td>
                                <td>{p.status}</td>
                                <td>{p.note || '—'}</td>
                                <td>
                                  {p.proofImage ? (
                                    <a href={p.proofImage} target="_blank" rel="noreferrer">
                                      Xem ảnh
                                    </a>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td>{new Date(p.createdAt).toLocaleString('vi-VN')}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="th-seller-order-detail__paynew">
                  {newPayError ? (
                    <p className="th-admin-users__api-error" role="alert">
                      {newPayError}
                    </p>
                  ) : null}
                  <div className="th-seller-order-detail__paynew-grid">
                    <label className="th-seller-order-detail__paynew-field">
                      <span>Số tiền</span>
                      <input
                        type="number"
                        min={1}
                        step={1000}
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(e.target.value)}
                        placeholder="1000000"
                      />
                    </label>
                    <label className="th-seller-order-detail__paynew-field">
                      <span>Phương thức thanh toán</span>
                      <select
                        value={newPayMethod}
                        onChange={(e) => {
                          const v = e.target.value
                          setNewPayMethod(v)
                          if (v === 'Tiền mặt') {
                            setNewPayImageUrl('')
                            setNewPayImageFile(null)
                          }
                        }}
                      >
                        <option value="">— Chọn —</option>
                        <option value="Tiền mặt">Tiền mặt</option>
                        <option value="Chuyển khoản">Chuyển khoản</option>
                      </select>
                    </label>
                    {newPayMethod === 'Chuyển khoản' ? (
                      <>
                        <label className="th-seller-order-detail__paynew-field th-seller-order-detail__paynew-field--full">
                          <span>Link ảnh chứng từ (tuỳ chọn)</span>
                          <input
                            type="url"
                            value={newPayImageUrl}
                            onChange={(e) => setNewPayImageUrl(e.target.value)}
                            placeholder="https://..."
                          />
                        </label>
                        <label className="th-seller-order-detail__paynew-field th-seller-order-detail__paynew-field--full">
                          <span>Upload ảnh chứng từ (ưu tiên hơn link)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setNewPayImageFile(e.target.files?.[0] ?? null)}
                          />
                        </label>
                      </>
                    ) : null}
                    <label className="th-seller-order-detail__paynew-field th-seller-order-detail__paynew-field--full">
                      <span>Ghi chú</span>
                      <textarea
                        rows={3}
                        value={newPayNote}
                        onChange={(e) => setNewPayNote(e.target.value)}
                        placeholder="Ví dụ: Thanh toán cọc..."
                      />
                    </label>
                  </div>
                  <div className="th-seller-order-detail__paynew-actions">
                    <button
                      type="button"
                      className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                      disabled={newPaySubmitting}
                      onClick={() => void handleCreatePayment()}
                    >
                      {newPaySubmitting ? 'Đang tạo…' : 'Tạo thanh toán'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </dialog>
      ) : null}
    </div>
  )
}

/**
 * Chi tiết đơn NVBH — tiến độ, khách, dòng hàng, tiền, xưởng & timeline (use case SEL-O04).
 */
export function SellerOrderDetailPage() {
  const { orderCode: orderCodeParam } = useParams<{ orderCode: string }>()
  const orderCode = orderCodeParam ? decodeURIComponent(orderCodeParam) : ''
  return <SellerOrderDetailInner variant="order" orderCode={orderCode} />
}
