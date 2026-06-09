import { useCallback, useEffect, useMemo, useState } from 'react'
import { App } from 'antd'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { SellerQuotationListDto, SellerQuotationStatus } from '../sellerQuotationsApi'
import { SellerPushProductionDialog } from '../components/SellerPushProductionDialog'
import { SellerSubmitOrderDialog } from '../components/SellerSubmitOrderDialog'
import { SellerMarkDoneDialog } from '../components/SellerMarkDoneDialog'
import { SellerCancelOrderDialog } from '../components/SellerCancelOrderDialog'
import { SellerDeliverBatchDialog } from '../components/SellerDeliverBatchDialog'
import { ShareTrackLinkDialog } from '../components/ShareTrackLink/ShareTrackLinkDialog'
import { SellerOrderDeliverBatchSection } from '../components/SellerOrderDeliverBatchSection/SellerOrderDeliverBatchSection'
import { SellerOrderFulfillmentPanel, SellerOrderFulfillmentStrip } from '../components/SellerOrderFulfillmentPanel/SellerOrderFulfillmentPanel'
import { OrderProductionTaskTimeline } from '../../shared/productionProgress/OrderProductionTaskTimeline'
import { formatVND } from '../../admin/partners/agencyModel'
import {
  normalizeVndInputTyping,
  parseVndInput,
} from '../../shared/money/vndInput'
import { sellerPaths } from '../config/sellerPaths'
import {
  getSellerFactoryProgress,
  getSellerOrderDetail,
  sellerOrderKindLabel,
  sellerOrderLineKindLabel,
  sellerOrderRowStatusLabel,
  type SellerOrderDetail,
} from '../data/sellerOrdersMock'
import { SELLER_LOGIN_NAME } from '../data/sellerAgenciesMock'
import { fetchSellerAgencies } from '../sellerAgenciesApi'
import {
  createSellerOrderPayment,
  createSellerTaskShareLink,
  cancelSellerOrder,
  fetchSellerOrderProductionTasks,
  fetchSellerOrderPayments,
  fetchSellerOrderById,
  fetchSellerOrderFulfillment,
  canMarkOrderDoneFromFulfillment,
  mapSellerOrderDtoToDetail,
  markSellerOrderDone,
  pushSellerOrderToProduction,
  submitSellerOrder,
  updateSellerOrder,
  type CreateSellerOrderPayload,
  type SellerApiOrderStatus,
  type SellerOrderListDto,
  type SellerOrderProductionTaskDto,
  type SellerOrderPaymentDto,
  type OrderFulfillmentSummaryDto,
} from '../sellerOrdersApi'
import {
  fetchSellerQuotationById,
  fetchSellerQuotationOrders,
  inferQuotationStatusFromOrder,
  resolveQuotationPipeline,
} from '../sellerQuotationsApi'
import { formatDateVi } from '../../shared/formatDateVi'
import {
  isQuotationExpired,
  quotationValidityContextHint,
  todayIsoDate,
  validateQuotationValidUntilInput,
} from '../sellerQuotationValidity'
import {
  derivePhaseFlags,
  quotationStatusLabel,
  quotationStatusPillClass,
  resolvePhaseHandoffBanner,
  shortOrderRef,
  showCopyToOrderAction,
  showQuotationCancelAction,
  showQuotationSubmitAction,
  type SellerOrderDetailVariant,
} from '../sellerOrderDetailPhase'
import {
  buildFromOrderDto,
  writeQuotationOrderCopyPrefill,
} from '../quotationOrderCopyPrefill'
import { isBackendDisplayCode, isBackendOrderRef } from '../sellerOrderRef'
import { fetchSellerProducts } from '../sellerProductsApi'
import {
  effectiveUnitFromListAndPercent,
  parseDiscountPercentField,
  resolveDiscountPercentForStored,
} from '../sellerQuotationLinePricing'
import {
  formatSellerPaymentRef,
  hasConfirmedSellerPayment,
  SellerPaymentProofThumb,
  sellerPaymentMethodLabel,
  sellerPaymentStatusClass,
  sellerPaymentStatusLabel,
} from '../sellerPaymentDisplay'
import {
  AgencyOrderHistoryTable,
  mapApiOrderToAgencyOrderRow,
} from '../../admin/partners/AgencyOrderHistoryTable'
import type { AgencyOrderRow } from '../../admin/partners/agencyDetailMock'
import { getAccessToken, getTokenType } from '../../auth/storage'
import '../../admin/pages/AdminUsersPage.css'
import './SellerOrderDetailPage.css'
import './SellerOrderCreatePage.css'

type DraftEditItem = CreateSellerOrderPayload['items'][number] & {
  listUnitPriceVnd?: number
  discountPercent?: number
}

type DraftEditFormState = Omit<CreateSellerOrderPayload, 'items'> & {
  items: DraftEditItem[]
}

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
      const kind = sellerOrderLineKindLabel(line.kind)
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

  const validityBlock =
    variant === 'quotation'
      ? `<p style="margin-top:8px"><strong>Hạn báo giá:</strong> ${
          detail.quotationValidUntil?.trim()
            ? escapeHtmlText(formatDateVi(detail.quotationValidUntil))
            : 'Không giới hạn'
        }</p>`
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
        <td colspan="7" style="text-align:right;font-weight:600">TỔNG</td>
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
  ${validityBlock}
</body>
</html>`
}

function isSellerBackendOrderIdParam(s: string): boolean {
  return isBackendOrderRef(s)
}

/**
 * Pipeline vận hành đơn: Chờ đẩy SX → Xưởng → Giao → Hoàn tất.
 */
const ORDER_OPERATIONS_PIPELINE: { label: string; hint: string }[] = [
  { label: 'Chờ đẩy SX', hint: 'Duyệt xong — đẩy lệnh xưởng' },
  { label: 'Xưởng ráp', hint: 'BOM — thợ thi công' },
  { label: 'Giao hàng', hint: 'Xe tải / nhận tại kho' },
  { label: 'Hoàn tất', hint: 'Nghiệm thu — công nợ' },
]


function hasContactValue(value: string): boolean {
  const t = value.trim()
  return t.length > 0 && t !== '—'
}

export function SellerOrderDetailInner({
  variant,
  orderCode,
}: {
  variant: SellerOrderDetailVariant
  orderCode: string
}) {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://be.minhthangerp.space'
  const [searchParams, setSearchParams] = useSearchParams()
  const isUuidParam = Boolean(orderCode && isSellerBackendOrderIdParam(orderCode))

  const [apiDetail, setApiDetail] = useState<SellerOrderDetail | null>(null)
  const [apiOrderDto, setApiOrderDto] = useState<SellerOrderListDto | null>(null)
  const [quotationStatus, setQuotationStatus] = useState<SellerQuotationStatus | null>(null)
  const [orderApiStatus, setOrderApiStatus] = useState<SellerApiOrderStatus | null>(null)
  /** Phải true ngay khi vào URL UUID — nếu false ở frame đầu, `!detail` sẽ redirect về list trước khi fetch chạy. */
  const [apiLoading, setApiLoading] = useState(() => isUuidParam)
  const [apiError, setApiError] = useState<string | null>(null)

  const [draftEditOpen, setDraftEditOpen] = useState(false)
  const [draftEditForm, setDraftEditForm] = useState<DraftEditFormState | null>(null)
  const [catalogListPriceByProductId, setCatalogListPriceByProductId] = useState<
    Record<string, number>
  >({})
  const [draftEditSaving, setDraftEditSaving] = useState(false)
  const [draftEditError, setDraftEditError] = useState<string | null>(null)
  const [draftAgencyOptions, setDraftAgencyOptions] = useState<
    { id: string; shortName: string; code: string }[]
  >([])
  const [submitOrderLoading, setSubmitOrderLoading] = useState(false)
  const [submitOrderOpen, setSubmitOrderOpen] = useState(false)
  const [submitOrderError, setSubmitOrderError] = useState<string | null>(null)
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
  const [newPayImageFile, setNewPayImageFile] = useState<File | null>(null)
  const [newPaySubmitting, setNewPaySubmitting] = useState(false)
  const [newPayError, setNewPayError] = useState<string | null>(null)
  const [factoryTasksLoading, setFactoryTasksLoading] = useState(false)
  const [factoryTasksError, setFactoryTasksError] = useState<string | null>(null)
  const [factoryTasks, setFactoryTasks] = useState<SellerOrderProductionTaskDto[]>([])
  const [selectedFactoryTaskId, setSelectedFactoryTaskId] = useState<string | null>(null)
  const [fulfillment, setFulfillment] = useState<OrderFulfillmentSummaryDto | null>(null)
  const [fulfillmentLoading, setFulfillmentLoading] = useState(false)
  const [fulfillmentError, setFulfillmentError] = useState<string | null>(null)
  const [fulfillmentRefreshKey, setFulfillmentRefreshKey] = useState(0)
  const [quotationChildRows, setQuotationChildRows] = useState<AgencyOrderRow[]>([])
  const [quotationChildTotal, setQuotationChildTotal] = useState(0)
  const [quotationChildLoading, setQuotationChildLoading] = useState(false)
  const [quotationChildError, setQuotationChildError] = useState<string | null>(null)
  const [deliverBatchTask, setDeliverBatchTask] = useState<SellerOrderProductionTaskDto | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [shareExpiresAt, setShareExpiresAt] = useState<string | null>(null)
  const [shareError, setShareError] = useState<string | null>(null)
  const [shareLoadingTaskId, setShareLoadingTaskId] = useState<string | null>(null)
  const [shareBatch, setShareBatch] = useState<SellerOrderProductionTaskDto | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  const mockDetail = useMemo(
    () =>
      variant === 'quotation' || !orderCode || isUuidParam
        ? undefined
        : getSellerOrderDetail(orderCode),
    [orderCode, isUuidParam, variant],
  )

  useEffect(() => {
    if (!isUuidParam || !orderCode) {
      setApiDetail(null)
      setApiOrderDto(null)
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
            setApiOrderDto(d)
            setOrderApiStatus(d.status)
            setQuotationStatus(d.quotationStatus ?? inferQuotationStatusFromOrder(d))
          }
        } else {
          const dto = await fetchSellerOrderById(orderCode)
          if (!cancelled) {
            setApiDetail(mapSellerOrderDtoToDetail(dto))
            setApiOrderDto(dto)
            setOrderApiStatus(dto.status)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setApiDetail(null)
          setApiOrderDto(null)
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

  useEffect(() => {
    if (variant !== 'quotation' || !apiDetail?.orderDetailSource || apiDetail.orderDetailSource !== 'api') {
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const map: Record<string, number> = {}
        const std = await fetchSellerProducts({ page: 0, size: 500, is_active: true, is_custom: false })
        for (const p of std.content) map[p.id] = p.price
        const agencyId = apiDetail.agencyId
        if (agencyId) {
          const custom = await fetchSellerProducts({
            page: 0,
            size: 500,
            is_active: true,
            is_custom: true,
            agency_id: agencyId,
          })
          for (const p of custom.content) map[p.id] = p.price
        }
        if (!cancelled) setCatalogListPriceByProductId(map)
      } catch {
        if (!cancelled) setCatalogListPriceByProductId({})
      }
    })()
    return () => {
      cancelled = true
    }
  }, [variant, apiDetail?.orderDetailSource, apiDetail?.agencyId, apiDetail?.orderCode])

  const detail = apiDetail ?? mockDetail

  const phaseFlags = useMemo(
    () =>
      detail
        ? derivePhaseFlags({
            variant,
            orderApiStatus,
            detailStatus: detail.status,
          })
        : null,
    [detail, orderApiStatus, variant],
  )

  const phaseHandoffBanner = useMemo(
    () => (phaseFlags ? resolvePhaseHandoffBanner(phaseFlags) : null),
    [phaseFlags],
  )

  const showOrderOperations = phaseFlags?.showOrderOperations ?? variant === 'order'
  const showQuotationActions = phaseFlags?.showQuotationActions ?? false
  const showPhaseHandoffBanner = phaseFlags?.showPhaseHandoffBanner ?? false
  const showQuotationPaymentSummary = phaseFlags?.showQuotationPaymentSummary ?? true
  const showOrderQuotationLink = phaseFlags?.showOrderQuotationLink ?? false
  const hideLineCostColumn = variant === 'quotation'
  const showLineDeliveryColumns =
    showOrderOperations &&
    (detail?.status === 'producing' || detail?.status === 'done') &&
    detail?.orderDetailSource === 'api'

  const showCopyToOrder = showCopyToOrderAction(
    variant,
    orderApiStatus,
    detail?.quotationValidUntil,
  )

  const handleCopyToOrder = useCallback(() => {
    if (!apiOrderDto) return
    const payload = buildFromOrderDto(apiOrderDto)
    if (!payload) {
      message.error('Không thể tạo đơn từ báo giá này')
      return
    }
    writeQuotationOrderCopyPrefill(payload)
    navigate(sellerPaths.orderNew, { state: { quotationOrderCopyPrefill: payload } })
  }, [apiOrderDto, message, navigate])

  const factoryProgress = useMemo(
    () => (detail ? getSellerFactoryProgress(detail.orderCode, detail.status) : null),
    [detail],
  )

  const factoryTasksOrdered = useMemo(
    () =>
      [...factoryTasks].sort(
        (a, b) =>
          new Date(b.taskCreatedAt || b.expectedEndDate || '').getTime() -
          new Date(a.taskCreatedAt || a.expectedEndDate || '').getTime(),
      ),
    [factoryTasks],
  )

  useEffect(() => {
    if (factoryTasksOrdered.length === 0) {
      setSelectedFactoryTaskId(null)
      return
    }
    setSelectedFactoryTaskId((prev) =>
      prev && factoryTasksOrdered.some((t) => t.taskId === prev)
        ? prev
        : factoryTasksOrdered[0]!.taskId,
    )
  }, [factoryTasksOrdered])

  const canMarkOrderDone = useMemo(
    () => canMarkOrderDoneFromFulfillment(fulfillment),
    [fulfillment],
  )

  const markDoneAllowed = canMarkOrderDone || Boolean(fulfillmentError)

  const hasDeliveryProgress = useMemo(() => {
    if (factoryTasks.some((t) => t.deliveredAt)) return true
    if (fulfillment?.lines?.some((l) => l.deliveredQuantity > 0)) return true
    return false
  }, [factoryTasks, fulfillment])

  const loadFactoryTasks = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setFactoryTasksLoading(true)
    setFactoryTasksError(null)
    try {
      const tasks = await fetchSellerOrderProductionTasks(orderCode)
      setFactoryTasks(tasks)
    } catch (e) {
      setFactoryTasks([])
      setFactoryTasksError(e instanceof Error ? e.message : 'Không tải được tiến độ xưởng')
    } finally {
      setFactoryTasksLoading(false)
    }
  }, [isUuidParam, orderCode])

  const loadFulfillment = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setFulfillmentLoading(true)
    setFulfillmentError(null)
    try {
      const data = await fetchSellerOrderFulfillment(orderCode)
      setFulfillment(data)
    } catch (e) {
      setFulfillment(null)
      setFulfillmentError(e instanceof Error ? e.message : 'Không tải được tiến độ giao hàng')
    } finally {
      setFulfillmentLoading(false)
    }
  }, [isUuidParam, orderCode])

  const refreshFactoryData = useCallback(() => {
    setFulfillmentRefreshKey((k) => k + 1)
    void loadFactoryTasks()
    void loadFulfillment()
  }, [loadFactoryTasks, loadFulfillment])

  const handleShareTask = useCallback(
    async (taskId: string) => {
      if (!isUuidParam || !orderCode) return
      const task = factoryTasksOrdered.find((t) => t.taskId === taskId) ?? null
      setShareBatch(task)
      setShareDialogOpen(true)
      setShareUrl(null)
      setShareExpiresAt(null)
      setShareError(null)
      setShareLoadingTaskId(taskId)
      try {
        const link = await createSellerTaskShareLink(orderCode, taskId)
        setShareUrl(link.url)
        setShareExpiresAt(link.expiresAt)
      } catch (e) {
        setShareError(e instanceof Error ? e.message : 'Không tạo được link chia sẻ')
      } finally {
        setShareLoadingTaskId(null)
      }
    },
    [factoryTasksOrdered, isUuidParam, orderCode],
  )

  const itemsSumVnd = useMemo(
    () => detail?.items.reduce((s, x) => s + x.lineTotalVnd, 0) ?? 0,
    [detail],
  )

  const quotationPricingByLine = useMemo(() => {
    if (variant !== 'quotation' || !detail?.items.length) return null
    return detail.items.map((line, idx) => {
      const productId = detail.apiOrderLinesForEdit?.[idx]?.productId
      const stored = line.unitPriceVnd
      const list = productId ? catalogListPriceByProductId[productId] : undefined
      if (list == null || list <= 0) {
        return {
          listUnitPriceVnd: null as number | null,
          discountPercent: null as number | null,
          effectiveUnitVnd: stored,
          driftVnd: 0,
        }
      }
      const { discountPercent, driftVnd } = resolveDiscountPercentForStored(list, stored)
      return {
        listUnitPriceVnd: list,
        discountPercent,
        effectiveUnitVnd: stored,
        driftVnd,
      }
    })
  }, [variant, detail, catalogListPriceByProductId])

  const lineTableFootColSpan = useMemo(() => {
    let cols = 6 + (hideLineCostColumn ? 0 : 1)
    if (variant === 'quotation') cols += 2
    if (showLineDeliveryColumns) cols += 2
    return cols
  }, [hideLineCostColumn, variant, showLineDeliveryColumns])

  const isProducing = detail?.status === 'producing'
  const showFactoryUi = showOrderOperations && isProducing
  const showQuotationApiTabs =
    variant === 'quotation' && detail?.orderDetailSource === 'api' && isUuidParam

  const detailTab = useMemo(() => {
    const tab = searchParams.get('tab')
    if (showFactoryUi && tab === 'factory') return 'factory' as const
    if (showQuotationApiTabs && tab === 'orders') return 'orders' as const
    return 'detail' as const
  }, [searchParams, showFactoryUi, showQuotationApiTabs])

  /** Bước hiện tại trên pipeline vận hành (0–3). */
  const orderOperationsStepIndex = useMemo(() => {
    if (!detail) return -1
    if (detail.status === 'done') return 3
    if (detail.status === 'approved') return 0
    if (detail.status === 'shipping') return 2
    if (detail.status === 'producing') {
      if (canMarkOrderDone) return 3
      if (hasDeliveryProgress) return 2
      return 1
    }
    return -1
  }, [canMarkOrderDone, detail, hasDeliveryProgress])

  /** Stepper inline trên header đơn hàng (thay pipeline box lớn). */
  const orderOperationsInlineSteps = useMemo(() => {
    if (variant !== 'order' || !detail) return null
    if (detail.status === 'canceled') {
      return [{ label: 'Đã hủy', state: 'skipped' as const }]
    }
    if (orderOperationsStepIndex < 0) return null
    return ORDER_OPERATIONS_PIPELINE.map((p, i) => ({
      label: p.label,
      state:
        orderOperationsStepIndex > i || detail.status === 'done'
          ? ('done' as const)
          : i === orderOperationsStepIndex
            ? ('current' as const)
            : ('upcoming' as const),
    }))
  }, [detail, orderOperationsStepIndex, variant])

  useEffect(() => {
    if (!showFactoryUi && searchParams.get('tab') === 'factory') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, showFactoryUi])

  useEffect(() => {
    if (!showQuotationApiTabs && searchParams.get('tab') === 'orders') {
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, showQuotationApiTabs])

  useEffect(() => {
    if (variant !== 'quotation' || detailTab !== 'orders' || !orderCode) return
    let cancelled = false
    void (async () => {
      setQuotationChildLoading(true)
      setQuotationChildError(null)
      try {
        const data = await fetchSellerQuotationOrders(orderCode, { page: 0, size: 50 })
        if (cancelled) return
        setQuotationChildRows(data.content.map(mapApiOrderToAgencyOrderRow))
        setQuotationChildTotal(data.totalElements)
      } catch (err) {
        if (cancelled) return
        setQuotationChildError(err instanceof Error ? err.message : 'Không tải được danh sách đơn')
        setQuotationChildRows([])
        setQuotationChildTotal(0)
      } finally {
        if (!cancelled) setQuotationChildLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [variant, detailTab, orderCode])

  useEffect(() => {
    if (variant !== 'quotation' || !isUuidParam || !orderCode || detail?.orderDetailSource !== 'api') return
    let cancelled = false
    void fetchSellerQuotationOrders(orderCode, { page: 0, size: 1 })
      .then((data) => {
        if (!cancelled) setQuotationChildTotal(data.totalElements)
      })
      .catch(() => {
        /* badge optional */
      })
    return () => {
      cancelled = true
    }
  }, [variant, isUuidParam, orderCode, detail?.orderDetailSource])

  useEffect(() => {
    if (!showFactoryUi || !isUuidParam || !orderCode) return
    void loadFulfillment()
  }, [showFactoryUi, isUuidParam, orderCode, loadFulfillment, fulfillmentRefreshKey])

  useEffect(() => {
    if (!showFactoryUi || detailTab !== 'factory' || !isUuidParam || !orderCode) return
    void loadFactoryTasks()
  }, [detailTab, showFactoryUi, isUuidParam, orderCode, loadFactoryTasks, fulfillmentRefreshKey])

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
      setApiOrderDto(dto)
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
      setSearchParams({ tab: 'factory' }, { replace: true })
      message.success('Đã đẩy đơn xuống sản xuất — xưởng sẽ tạo lô theo kế hoạch')
    } catch (e) {
      setPushProductionError(
        e instanceof Error ? e.message : 'Không đẩy đơn xuống kho sản xuất được',
      )
    } finally {
      setPushProductionLoading(false)
    }
  }, [isUuidParam, mergeDtoIntoState, orderCode, setSearchParams, message])

  const handleMarkDoneConfirm = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setMarkDoneLoading(true)
    setMarkDoneError(null)
    try {
      const dto = await markSellerOrderDone(orderCode)
      mergeDtoIntoState(dto)
      setMarkDoneOpen(false)
      message.success('Đã chốt đơn hàng')
    } catch (e) {
      setMarkDoneError(
        e instanceof Error ? e.message : 'Không thể hoàn thành đơn hàng',
      )
    } finally {
      setMarkDoneLoading(false)
    }
  }, [isUuidParam, mergeDtoIntoState, orderCode, message])

  const handleCancelConfirm = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setCancelLoading(true)
    setCancelError(null)
    try {
      const dto = await cancelSellerOrder(orderCode)
      mergeDtoIntoState(dto)
      setCancelOpen(false)
      message.success(variant === 'quotation' ? 'Đã hủy báo giá' : 'Đã hủy đơn hàng')
    } catch (e) {
      setCancelError(e instanceof Error ? e.message : variant === 'quotation' ? 'Không hủy được báo giá' : 'Không hủy được đơn hàng')
    } finally {
      setCancelLoading(false)
    }
  }, [isUuidParam, mergeDtoIntoState, orderCode, message, variant])

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

  useEffect(() => {
    if (!isUuidParam || !orderCode || detail?.status !== 'approved') return
    void loadPaymentHistory()
  }, [detail?.status, isUuidParam, loadPaymentHistory, orderCode])

  const hasConfirmedPayment = useMemo(
    () => hasConfirmedSellerPayment(paymentHistoryRows),
    [paymentHistoryRows],
  )

  const showPushProductionAction =
    showOrderOperations &&
    detail?.status === 'approved' &&
    detail.orderDetailSource === 'api' &&
    isUuidParam &&
    hasConfirmedPayment

  const showPushProductionPaymentGate =
    showOrderOperations &&
    detail?.status === 'approved' &&
    detail.orderDetailSource === 'api' &&
    isUuidParam &&
    !paymentHistoryLoading &&
    !hasConfirmedPayment

  const handleCreatePayment = useCallback(async () => {
    if (!isUuidParam || !orderCode || !detail) return
    if (detail.status === 'canceled') {
      setNewPayError('Không thể tạo thanh toán cho đơn đã hủy.')
      return
    }
    const amount = parseVndInput(newPayAmount)
    if (amount === null || amount <= 0) {
      setNewPayError('Số tiền thanh toán phải lớn hơn 0.')
      return
    }
    if (amount > detail.balanceDueVnd) {
      setNewPayError(
        `Số tiền không được vượt còn phải thu của đơn (${formatVND(detail.balanceDueVnd)}).`,
      )
      return
    }
    const paymentMethod = newPayMethod.trim()
    if (!paymentMethod) {
      setNewPayError('Vui lòng chọn phương thức thanh toán.')
      return
    }
    const isTransfer = paymentMethod === 'Chuyển khoản'
    if (isTransfer && !newPayImageFile) {
      setNewPayError('Vui lòng upload ảnh chứng từ chuyển khoản.')
      return
    }
    setNewPaySubmitting(true)
    setNewPayError(null)
    try {
      let finalProofImage: string | null = null
      if (isTransfer && newPayImageFile) {
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
      quotationValidUntil: detail.quotationValidUntil,
      note: detail.internalNote !== '—' && detail.internalNote?.trim() ? detail.internalNote : null,
      items: detail.apiOrderLinesForEdit.map((li) => {
        if (variant === 'quotation') {
          const list =
            catalogListPriceByProductId[li.productId] ?? Math.max(0, li.unitPrice)
          const { discountPercent } = resolveDiscountPercentForStored(list, li.unitPrice)
          return {
            productId: li.productId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            listUnitPriceVnd: list,
            discountPercent,
          }
        }
        return {
          productId: li.productId,
          quantity: li.quantity,
          unitPrice: li.unitPrice,
        }
      }),
    })
    setDraftEditError(null)
    setDraftEditOpen(true)
  }, [catalogListPriceByProductId, detail, variant])

  const patchDraftLine = useCallback(
    (index: number, patch: Partial<DraftEditItem>) => {
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
      if (variant === 'quotation') {
        const validityError = validateQuotationValidUntilInput(draftEditForm.quotationValidUntil)
        if (validityError) {
          setDraftEditError(validityError)
          return
        }
      }
      const bad = draftEditForm.items.some((it) => {
        if (it.quantity <= 0) return true
        if (variant === 'quotation') {
          return (it.listUnitPriceVnd ?? 0) < 0
        }
        return it.unitPrice < 0
      })
      if (bad) {
        setDraftEditError('Số lượng và giá dòng phải hợp lệ.')
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
          quotationValidUntil: draftEditForm.quotationValidUntil,
          note: draftEditForm.note,
          items: draftEditForm.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice:
              variant === 'quotation' && it.listUnitPriceVnd != null
                ? effectiveUnitFromListAndPercent(
                    it.listUnitPriceVnd,
                    it.discountPercent ?? 0,
                  )
                : it.unitPrice,
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
    [closeDraftEdit, draftEditForm, isUuidParam, mergeDtoIntoState, orderCode, variant],
  )

  const handleSubmitOrderConfirm = useCallback(async () => {
    if (!isUuidParam || !orderCode) return
    setSubmitOrderLoading(true)
    setSubmitOrderError(null)
    try {
      const dto = await submitSellerOrder(orderCode)
      mergeDtoIntoState(dto)
      closeDraftEdit()
      setSubmitOrderOpen(false)
      message.success('Đã gửi đơn lên duyệt')
    } catch (err) {
      setSubmitOrderError(err instanceof Error ? err.message : 'Không gửi được đơn duyệt')
    } finally {
      setSubmitOrderLoading(false)
    }
  }, [closeDraftEdit, isUuidParam, mergeDtoIntoState, message, orderCode])

  const listPath = variant === 'quotation' ? sellerPaths.quotations : sellerPaths.orders

  if (!orderCode) {
    return <Navigate to={listPath} replace />
  }

  if (isBackendDisplayCode(orderCode)) {
    if (variant === 'quotation' && orderCode.startsWith('DH-')) {
      return <Navigate to={sellerPaths.order(orderCode)} replace />
    }
    if (variant === 'order' && orderCode.startsWith('BG-')) {
      return <Navigate to={sellerPaths.quotation(orderCode)} replace />
    }
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

  const orderRefShort = shortOrderRef(detail.orderCode)
  const printLabel = variant === 'quotation' ? 'In báo giá' : 'In phiếu đơn'
  const showPrintAction =
    variant !== 'quotation' || !isQuotationExpired(detail.quotationValidUntil)

  const quotationPipeline =
    variant === 'quotation' && quotationStatus != null && orderApiStatus != null
      ? resolveQuotationPipeline(quotationStatus, orderApiStatus)
      : null

  const draftQuotationValidUntilError =
    variant === 'quotation' && draftEditOpen && draftEditForm
      ? validateQuotationValidUntilInput(draftEditForm.quotationValidUntil)
      : null

  const submitOrderContextHint = (() => {
    const base = `${detail.agencyShortName} · ${formatVND(detail.grandTotalVnd)}`
    if (variant !== 'quotation') return base
    const validityHint = quotationValidityContextHint(detail.quotationValidUntil)
    return validityHint ? `${base} — ${validityHint}` : base
  })()

  const formatFactoryLogTime = (iso: string) => {
    const t = Date.parse(iso)
    if (Number.isNaN(t)) return iso || '—'
    return new Date(t).toLocaleString('vi-VN')
  }

  const paymentNewAllowed = variant === 'order' && detail.status !== 'canceled'
  const effectivePaymentTab = paymentNewAllowed ? paymentTab : 'history'

  return (
    <div className="th-seller-order-detail">
      <SellerSubmitOrderDialog
        open={submitOrderOpen}
        orderCode={detail.orderCode}
        contextHint={submitOrderContextHint}
        skipDebtCheckHint={variant === 'quotation'}
        isSubmitting={submitOrderLoading}
        submitError={submitOrderError}
        onClose={() => {
          if (submitOrderLoading) return
          setSubmitOrderOpen(false)
          setSubmitOrderError(null)
        }}
        onConfirm={() => void handleSubmitOrderConfirm()}
      />
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
      <SellerMarkDoneDialog
        open={markDoneOpen}
        orderCode={detail.orderCode}
        isSubmitting={markDoneLoading}
        submitError={markDoneError}
        canConfirm={markDoneAllowed}
        fulfillment={fulfillment}
        fulfillmentError={fulfillmentError}
        onClose={() => {
          if (markDoneLoading) return
          setMarkDoneOpen(false)
          setMarkDoneError(null)
        }}
        onConfirm={() => void handleMarkDoneConfirm()}
      />
      {deliverBatchTask ? (
        <SellerDeliverBatchDialog
          open
          orderId={orderCode}
          taskId={deliverBatchTask.taskId}
          taskDisplayCode={deliverBatchTask.displayCode}
          productName={deliverBatchTask.productName || 'Sản phẩm'}
          quantity={deliverBatchTask.quantity}
          defaultDeliveryAddress={detail.agencyAddress}
          onClose={() => setDeliverBatchTask(null)}
          onDelivered={() => {
            message.success('Đã giao lô sản xuất')
            refreshFactoryData()
          }}
        />
      ) : null}
      <ShareTrackLinkDialog
        open={shareDialogOpen}
        url={shareUrl}
        expiresAt={shareExpiresAt}
        loading={shareLoadingTaskId != null && !shareUrl && !shareError}
        error={shareError}
        subtitle={shareBatch?.productName}
        onClose={() => {
          setShareDialogOpen(false)
          setShareUrl(null)
          setShareExpiresAt(null)
          setShareError(null)
          setShareBatch(null)
        }}
      />
      <SellerCancelOrderDialog
        open={cancelOpen}
        variant={variant}
        orderCode={detail.orderCode}
        status={detail.status}
        isSubmitting={cancelLoading}
        submitError={cancelError}
        onClose={() => {
          if (cancelLoading) return
          setCancelOpen(false)
          setCancelError(null)
        }}
        onConfirm={() => void handleCancelConfirm()}
      />
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
                {detail.agencyShortName}
              </span>
            </li>
          </ol>
        </nav>

        {variant === 'quotation' ? (
          <header className="th-seller-order-detail__header th-seller-order-detail__header--qt">
            <div className="th-seller-order-detail__qt-top">
              <div className="th-seller-order-detail__qt-id">
                <h1 className="th-seller-order-detail__qt-title">{detail.agencyShortName}</h1>
                <code className="th-seller-order-detail__order-code" title={detail.orderCode}>{orderRefShort}</code>
                <span className={`th-seller-order-detail__pill th-seller-order-detail__pill--kind th-seller-order-detail__pill--kind-${detail.orderKind}`}>
                  {sellerOrderKindLabel(detail.orderKind)}
                </span>
                {quotationStatus ? (
                  <span className={quotationStatusPillClass(quotationStatus)}>
                    {quotationStatusLabel(quotationStatus)}
                  </span>
                ) : null}
              </div>
              {quotationPipeline ? (
                <ol className="th-seller-order-detail__qt-stepper" aria-label="Tiến độ báo giá">
                  {quotationPipeline.steps.map((step, i) => (
                    <li
                      key={`qs-${i}`}
                      className={`th-seller-order-detail__qs${
                        step.state === 'done' ? ' th-seller-order-detail__qs--done'
                          : step.state === 'current' ? ' th-seller-order-detail__qs--current'
                            : step.state === 'skipped' ? ' th-seller-order-detail__qs--skipped'
                              : ''
                      }`}
                    >
                      <span className="th-seller-order-detail__qs-dot" aria-hidden>
                        {step.state === 'done' ? (
                          <span className="material-symbols-outlined">check</span>
                        ) : step.state === 'skipped' ? '—' : (i + 1)}
                      </span>
                      <span className="th-seller-order-detail__qs-label">{step.label}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
            <div className="th-seller-order-detail__qt-meta">
              <span>Lập {formatDateVi(detail.orderedAt)}</span>
            </div>
            <div className="th-seller-order-detail__qt-contact" aria-label="Liên hệ khách sỉ">
              {hasContactValue(detail.agencyPhone) ? (
                <a href={`tel:${detail.agencyPhone.replace(/\s/g, '')}`}>
                  <span className="material-symbols-outlined" aria-hidden>call</span>
                  {detail.agencyPhone}
                </a>
              ) : null}
              {hasContactValue(detail.agencyEmail) ? (
                <a href={`mailto:${detail.agencyEmail}`}>
                  <span className="material-symbols-outlined" aria-hidden>mail</span>
                  {detail.agencyEmail}
                </a>
              ) : null}
              <span className="th-seller-order-detail__qt-contact-addr">
                <span className="material-symbols-outlined" aria-hidden>location_on</span>
                {detail.agencyAddress}
              </span>
              <Link to={sellerPaths.agency(detail.agencyId)} className="th-seller-order-detail__qt-contact-link">
                Hồ sơ khách
                <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
              </Link>
            </div>
            <div className="th-seller-order-detail__header-actions th-seller-order-detail__header-actions--qt">
              {showCopyToOrder && detail.orderDetailSource === 'api' && isUuidParam ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--primary" onClick={handleCopyToOrder}>
                  <span className="material-symbols-outlined" aria-hidden>post_add</span>
                  Tạo đơn từ báo giá
                </button>
              ) : null}
              {showQuotationSubmitAction(variant, orderApiStatus) && detail.orderDetailSource === 'api' && isUuidParam ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--primary" onClick={() => { setSubmitOrderError(null); setSubmitOrderOpen(true) }} disabled={submitOrderLoading || draftEditSaving}>
                  {submitOrderLoading ? 'Đang gửi…' : 'Gửi đơn duyệt'}
                </button>
              ) : null}
              {showQuotationCancelAction(variant, detail.status) && detail.orderDetailSource === 'api' && isUuidParam ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost" style={{ color: '#b91c1c', borderColor: '#fecaca' }} onClick={() => { setCancelError(null); setCancelOpen(true) }} disabled={cancelLoading}>
                  <span className="material-symbols-outlined" aria-hidden>cancel</span>
                  Hủy báo giá
                </button>
              ) : null}
              {showQuotationActions && quotationStatus === 'Rejected' ? (
                <Link to={sellerPaths.quotationNew} className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost">
                  <span className="material-symbols-outlined" aria-hidden>add</span>
                  Tạo báo giá mới
                </Link>
              ) : null}
              {showPrintAction ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost" onClick={() => handlePrintQuotation()}>
                  <span className="material-symbols-outlined" aria-hidden>print</span>
                  {printLabel}
                </button>
              ) : null}
              <Link to={listPath} className="th-seller-order-detail__btn th-seller-order-detail__btn--muted">
                Quay lại
              </Link>
            </div>
          </header>
        ) : (
          <header className="th-seller-order-detail__header th-seller-order-detail__header--qt">
            <div className="th-seller-order-detail__qt-top">
              <div className="th-seller-order-detail__qt-id">
                <h1 className="th-seller-order-detail__qt-title">{detail.agencyShortName}</h1>
                <code className="th-seller-order-detail__order-code" title={detail.orderCode}>{orderRefShort}</code>
                <span className={`th-seller-order-detail__pill th-seller-order-detail__pill--kind th-seller-order-detail__pill--kind-${detail.orderKind}`}>
                  {sellerOrderKindLabel(detail.orderKind)}
                </span>
                <span className={`th-seller-order-detail__pill th-seller-order-detail__pill--${detail.status}`}>
                  {sellerOrderRowStatusLabel(detail.status)}
                </span>
                {detail.discountVnd > 0 ? (
                  <span className="th-seller-order-detail__pill th-seller-order-detail__pill--discount">
                    CK {formatVND(detail.discountVnd)}
                  </span>
                ) : null}
              </div>
              {orderOperationsInlineSteps ? (
                <ol className="th-seller-order-detail__qt-stepper" aria-label="Tiến độ đơn hàng">
                  {orderOperationsInlineSteps.map((step, i) => (
                    <li
                      key={`os-${i}`}
                      className={`th-seller-order-detail__qs${
                        step.state === 'done' ? ' th-seller-order-detail__qs--done'
                          : step.state === 'current' ? ' th-seller-order-detail__qs--current'
                            : step.state === 'skipped' ? ' th-seller-order-detail__qs--skipped'
                              : ''
                      }`}
                    >
                      <span className="th-seller-order-detail__qs-dot" aria-hidden>
                        {step.state === 'done' ? (
                          <span className="material-symbols-outlined">check</span>
                        ) : step.state === 'skipped' ? (
                          <span className="material-symbols-outlined">close</span>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="th-seller-order-detail__qs-label">{step.label}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
            <div className="th-seller-order-detail__qt-meta">
              <span>Lập {formatDateVi(detail.orderedAt)}</span>
              <span>{detail.lineCount} dòng · {formatVND(detail.grandTotalVnd)}</span>
              <span>{detail.createdByName ? `Tạo bởi ${detail.createdByName}` : `NVBH ${SELLER_LOGIN_NAME}`}</span>
              {(detail.sourceDisplayCode || detail.sourceOrderId)?.trim() ? (
                <span>
                  <Link to={sellerPaths.quotation(detail.sourceDisplayCode?.trim() || detail.sourceOrderId!)}>
                    Từ báo giá {detail.sourceDisplayCode?.trim() || shortOrderRef(detail.sourceOrderId!)}
                  </Link>
                </span>
              ) : null}
            </div>
            <div className="th-seller-order-detail__qt-contact" aria-label="Liên hệ khách sỉ">
              {hasContactValue(detail.agencyPhone) ? (
                <a href={`tel:${detail.agencyPhone.replace(/\s/g, '')}`}>
                  <span className="material-symbols-outlined" aria-hidden>call</span>
                  {detail.agencyPhone}
                </a>
              ) : null}
              {hasContactValue(detail.agencyEmail) ? (
                <a href={`mailto:${detail.agencyEmail}`}>
                  <span className="material-symbols-outlined" aria-hidden>mail</span>
                  {detail.agencyEmail}
                </a>
              ) : null}
              <span className="th-seller-order-detail__qt-contact-addr">
                <span className="material-symbols-outlined" aria-hidden>location_on</span>
                {detail.agencyAddress}
              </span>
              <Link to={sellerPaths.agency(detail.agencyId)} className="th-seller-order-detail__qt-contact-link">
                Hồ sơ khách
                <span className="material-symbols-outlined" aria-hidden>arrow_forward</span>
              </Link>
            </div>
            {showFactoryUi && detailTab === 'detail' && isUuidParam ? (
              <SellerOrderFulfillmentStrip summary={fulfillment} loading={fulfillmentLoading} />
            ) : null}
            {detail.orderKind === 'custom' && detail.requirementDescription ? (
              <div className="th-seller-order-detail__requirement-callout" aria-labelledby="th-sod-requirement-title">
                <span className="material-symbols-outlined th-seller-order-detail__requirement-callout-icon" aria-hidden>engineering</span>
                <div className="th-seller-order-detail__requirement-callout-body">
                  <p id="th-sod-requirement-title" className="th-seller-order-detail__requirement-callout-kicker">Mô tả yêu cầu (thiết kế riêng)</p>
                  <p className="th-seller-order-detail__requirement-callout-text">{detail.requirementDescription}</p>
                </div>
              </div>
            ) : null}
            <div className="th-seller-order-detail__header-actions th-seller-order-detail__header-actions--qt">
              {showOrderOperations && detail.status !== 'draft' && detail.status !== 'pending' && detail.status !== 'pending_approval' && detail.orderDetailSource === 'api' && isUuidParam ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost" onClick={() => { setPaymentDialogOpen(true); setPaymentTab('history'); setPaymentHistoryError(null) }}>
                  <span className="material-symbols-outlined" aria-hidden>payments</span>
                  Thanh toán
                </button>
              ) : null}
              {showOrderOperations && detail.status !== 'done' && detail.status !== 'canceled' && detail.orderDetailSource === 'api' && isUuidParam ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost" style={{ color: '#b91c1c', borderColor: '#fecaca' }} onClick={() => { setCancelError(null); setCancelOpen(true) }} disabled={cancelLoading}>
                  <span className="material-symbols-outlined" aria-hidden>cancel</span>
                  Hủy đơn
                </button>
              ) : null}
              {showPushProductionAction ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--primary" onClick={() => { setPushProductionError(null); setPushProductionOpen(true) }} disabled={pushProductionLoading}>
                  <span className="material-symbols-outlined" aria-hidden>precision_manufacturing</span>
                  Đẩy xuống SX
                </button>
              ) : null}
              {showOrderOperations && detail.status === 'producing' && detail.orderDetailSource === 'api' && isUuidParam ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--primary" onClick={() => { setMarkDoneError(null); setMarkDoneOpen(true) }} disabled={markDoneLoading || fulfillmentLoading || !markDoneAllowed} title={fulfillmentLoading ? 'Đang kiểm tra tiến độ giao hàng…' : !markDoneAllowed && !fulfillmentError ? 'Cần lập đủ lô, hoàn tất SX và giao đủ trước khi chốt đơn' : undefined}>
                  {fulfillmentLoading ? 'Đang kiểm tra…' : (<><span className="material-symbols-outlined" aria-hidden>task_alt</span> Hoàn thành đơn</>)}
                </button>
              ) : null}
              {showOrderQuotationLink ? (
                <Link to={sellerPaths.quotation(detail.sourceDisplayCode?.trim() || detail.sourceOrderId || detail.orderCode)} className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost">
                  <span className="material-symbols-outlined" aria-hidden>request_quote</span>
                  Báo giá gốc
                </Link>
              ) : null}
              {showPrintAction ? (
                <button type="button" className="th-seller-order-detail__btn th-seller-order-detail__btn--ghost" onClick={() => handlePrintQuotation()}>
                  <span className="material-symbols-outlined" aria-hidden>print</span>
                  {printLabel}
                </button>
              ) : null}
              <Link to={listPath} className="th-seller-order-detail__btn th-seller-order-detail__btn--muted">
                Quay lại
              </Link>
            </div>
          </header>
        )}
      </div>

      {showPushProductionPaymentGate ? (
        <section
          className="th-seller-order-detail__phase-banner th-seller-order-detail__phase-banner--push-pay"
          role="status"
          aria-label="Điều kiện đẩy sản xuất"
        >
          <div className="th-seller-order-detail__phase-banner-inner">
            <p className="th-seller-order-detail__phase-banner-text">
              <span className="material-symbols-outlined" aria-hidden>
                payments
              </span>
              Cần ít nhất một giao dịch thanh toán <strong>Đã duyệt</strong> trước khi đẩy sản xuất.
            </p>
          </div>
        </section>
      ) : null}

      {showPhaseHandoffBanner && phaseHandoffBanner ? (
        <section
          className={
            phaseHandoffBanner.tone === 'operations'
              ? 'th-seller-order-detail__phase-banner th-seller-order-detail__phase-banner--operations'
              : 'th-seller-order-detail__phase-banner'
          }
          aria-label="Chuyển giai đoạn đơn hàng"
        >
          <div className="th-seller-order-detail__phase-banner-inner">
            <p className="th-seller-order-detail__phase-banner-text">
              <span className="material-symbols-outlined" aria-hidden>
                {phaseHandoffBanner.tone === 'operations' ? 'local_shipping' : 'verified'}
              </span>
              {phaseHandoffBanner.message}
            </p>
          </div>
        </section>
      ) : null}

      {showQuotationActions &&
      detail.orderDetailSource === 'api' &&
      detail.status === 'draft' &&
      detail.apiOrderLinesForEdit?.length ? (
        <section
          className="th-seller-order-detail__draft-banner"
          aria-label={variant === 'quotation' ? 'Sửa báo giá nháp' : 'Sửa đơn nháp'}
        >
          {!draftEditOpen ? (
            <div className="th-seller-order-detail__draft-banner-inner">
              <p className="th-seller-order-detail__draft-banner-text">
                <span className="material-symbols-outlined" aria-hidden>
                  edit_note
                </span>
                {variant === 'quotation'
                  ? 'Báo giá nháp — cập nhật nội dung trước khi gửi duyệt.'
                  : 'Đơn nháp — có thể cập nhật nội dung trước khi chốt gửi duyệt.'}
              </p>
              <button
                type="button"
                className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                onClick={openDraftEdit}
              >
                {variant === 'quotation' ? 'Sửa báo giá' : 'Sửa đơn'}
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
                {variant !== 'quotation' ? (
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
                ) : null}
                {variant === 'quotation' ? (
                  <label className="th-seller-order-detail__field th-seller-order-detail__field--validity">
                    <span>Hạn báo giá</span>
                    <input
                      type="date"
                      min={todayIsoDate()}
                      value={draftEditForm.quotationValidUntil ?? ''}
                      onChange={(e) =>
                        setDraftEditForm((f) =>
                          f
                            ? {
                                ...f,
                                quotationValidUntil: e.target.value.trim() || null,
                              }
                            : f,
                        )
                      }
                      aria-invalid={draftQuotationValidUntilError ? true : undefined}
                      aria-describedby={
                        draftQuotationValidUntilError ? 'th-sod-draft-valid-until-error' : undefined
                      }
                    />
                    {draftQuotationValidUntilError ? (
                      <span
                        id="th-sod-draft-valid-until-error"
                        className="th-seller-order-detail__field-error"
                        role="alert"
                      >
                        {draftQuotationValidUntilError}
                      </span>
                    ) : (
                      <span className="th-seller-order-detail__field-hint">
                        Tùy chọn — để trống nếu không giới hạn hạn hiệu lực.
                      </span>
                    )}
                  </label>
                ) : null}
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
                        {variant === 'quotation' ? (
                          <>
                            <th className="th-seller-order-detail__th-num">Đơn giá niêm yết</th>
                            <th className="th-seller-order-detail__th-num">CK %</th>
                            <th className="th-seller-order-detail__th-num">Đơn giá sau CK</th>
                          </>
                        ) : (
                          <th className="th-seller-order-detail__th-num">Đơn giá</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {draftEditForm.items.map((line, idx) => {
                        const listVnd = line.listUnitPriceVnd ?? line.unitPrice
                        const effective =
                          variant === 'quotation'
                            ? effectiveUnitFromListAndPercent(listVnd, line.discountPercent ?? 0)
                            : line.unitPrice
                        return (
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
                            {variant === 'quotation' ? (
                              <>
                                <td className="th-seller-order-detail__td-num">
                                  <span
                                    className="th-seller-order-create__money-readonly"
                                    title="Giá niêm yết catalog — chỉnh qua CK %"
                                  >
                                    {formatVND(listVnd)}
                                  </span>
                                </td>
                                <td className="th-seller-order-detail__td-num">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    step={0.01}
                                    className="th-seller-order-create__input th-seller-order-create__input--num th-seller-order-create__input--pct th-seller-order-detail__inline-input th-seller-order-detail__inline-input--num"
                                    value={
                                      (line.discountPercent ?? 0) === 0
                                        ? ''
                                        : line.discountPercent
                                    }
                                    onChange={(e) =>
                                      patchDraftLine(idx, {
                                        discountPercent: parseDiscountPercentField(e.target.value),
                                      })
                                    }
                                    placeholder="0"
                                    aria-label={`Chiết khấu % dòng ${idx + 1}`}
                                  />
                                </td>
                                <td className="th-seller-order-detail__td-num">
                                  <span className="th-seller-order-create__money-readonly">
                                    {formatVND(effective)}
                                  </span>
                                </td>
                              </>
                            ) : (
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
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="th-seller-order-detail__draft-actions">
                <button
                  type="submit"
                  className="th-seller-order-detail__btn th-seller-order-detail__btn--primary"
                  disabled={draftEditSaving || submitOrderLoading || Boolean(draftQuotationValidUntilError)}
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

      {showQuotationApiTabs ? (
        <div className="th-seller-order-detail__page-tabs" role="tablist" aria-label="Nội dung báo giá">
          <button
            type="button"
            role="tab"
            id="th-sod-tab-qt-detail"
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
            Chi tiết báo giá
          </button>
          <button
            type="button"
            role="tab"
            id="th-sod-tab-qt-orders"
            aria-selected={detailTab === 'orders'}
            aria-controls="th-sod-panel-qt-orders"
            className={
              detailTab === 'orders'
                ? 'th-seller-order-detail__page-tab th-seller-order-detail__page-tab--active'
                : 'th-seller-order-detail__page-tab'
            }
            onClick={() => setSearchParams({ tab: 'orders' }, { replace: true })}
          >
            <span className="material-symbols-outlined" aria-hidden>
              receipt_long
            </span>
            Đơn đã tạo
            {quotationChildTotal > 0 ? (
              <span className="th-seller-order-detail__page-tab-badge">{quotationChildTotal}</span>
            ) : null}
          </button>
        </div>
      ) : null}

      {showFactoryUi ? (
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
          className="th-seller-order-detail__tab-panel th-seller-order-detail__tab-panel--factory"
        >
          <section className="th-seller-order-detail__card th-seller-order-detail__card--wide">
            <h2 className="th-seller-order-detail__card-title">
              <span className="material-symbols-outlined" aria-hidden>
                manufacturing
              </span>
              Tiến độ xưởng
            </h2>
            <div className="th-seller-order-detail__factory-body">
            {isUuidParam ? (
              <>
                <SellerOrderFulfillmentPanel
                  summary={fulfillment}
                  loading={fulfillmentLoading}
                  error={fulfillmentError}
                  onRetry={() => void loadFulfillment()}
                />
                <SellerOrderDeliverBatchSection
                  tasks={factoryTasksOrdered}
                  loading={factoryTasksLoading}
                  selectedTaskId={selectedFactoryTaskId}
                  formatDateTime={formatFactoryLogTime}
                  onDeliver={setDeliverBatchTask}
                  onShareTask={handleShareTask}
                  shareLoadingTaskId={shareLoadingTaskId}
                  onSelectTask={(taskId) => {
                    setSelectedFactoryTaskId(taskId)
                    document.getElementById('th-sod-factory-logs')?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'nearest',
                    })
                  }}
                />
                {factoryTasksLoading ? (
                  <p className="th-seller-order-detail__muted">Đang tải nhật ký xưởng…</p>
                ) : factoryTasksError ? (
                  <p className="th-admin-users__api-error" role="alert">
                    {factoryTasksError}
                  </p>
                ) : factoryTasksOrdered.length === 0 ? (
                  <p className="th-seller-order-detail__muted">
                    Đơn đã vào sản xuất. Xưởng cần tạo lô SX trước khi có tiến độ.
                  </p>
                ) : (
                  <OrderProductionTaskTimeline
                    tasks={factoryTasksOrdered}
                    selectedTaskId={selectedFactoryTaskId}
                    onSelectTask={(taskId) => {
                      setSelectedFactoryTaskId(taskId)
                      document.getElementById('th-opp-timeline-logs')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                      })
                    }}
                    readOnly={false}
                    deliverHintAnchor="#th-sod-deliver-section"
                    formatDateTime={formatFactoryLogTime}
                    onShareTask={handleShareTask}
                    shareLoadingTaskId={shareLoadingTaskId}
                  />
                )}
              </>
            ) : factoryProgress ? (
              <p className="th-seller-order-detail__muted">
                Đơn mẫu chưa có nhật ký tiến độ xưởng; đang hiển thị luồng minh hoạ.
              </p>
            ) : (
              <p className="th-seller-order-detail__muted">Không có dữ liệu tiến độ xưởng.</p>
            )}
            </div>
          </section>
        </div>
      ) : detailTab === 'orders' ? (
        <div
          id="th-sod-panel-qt-orders"
          role="tabpanel"
          aria-labelledby="th-sod-tab-qt-orders"
          className="th-seller-order-detail__tab-panel th-seller-order-detail__tab-panel--qt-orders"
        >
          <section className="th-seller-order-detail__card th-seller-order-detail__card--wide">
            <h2 className="th-seller-order-detail__card-title">
              <span className="material-symbols-outlined" aria-hidden>
                receipt_long
              </span>
              Đơn hàng đã tạo từ báo giá
            </h2>
            <AgencyOrderHistoryTable
              rows={quotationChildRows}
              loading={quotationChildLoading}
              error={quotationChildError}
              orderLink={(ref) => sellerPaths.order(ref)}
            />
          </section>
        </div>
      ) : (
        <div
          id="th-sod-panel-detail"
          role="tabpanel"
          aria-labelledby={
            showFactoryUi ? 'th-sod-tab-detail' : showQuotationApiTabs ? 'th-sod-tab-qt-detail' : undefined
          }
          aria-label={
            !showFactoryUi && !showQuotationApiTabs
              ? variant === 'quotation'
                ? 'Chi tiết báo giá'
                : 'Chi tiết đơn hàng'
              : undefined
          }
          className="th-seller-order-detail__tab-panel"
        >
      <div className="th-seller-order-detail__grid th-seller-order-detail__grid--qt">
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
              {detail.shippingFeeVnd > 0 ? (
                <li>
                  <span>Phí giao / lắp (ước)</span>
                  <strong>{formatVND(detail.shippingFeeVnd)}</strong>
                </li>
              ) : null}
              {detail.serviceFeeVnd > 0 ? (
                <li>
                  <span>Phí dịch vụ khác</span>
                  <strong>{formatVND(detail.serviceFeeVnd)}</strong>
                </li>
              ) : null}
            </ul>
            <p className="th-seller-order-detail__money-section-label">Thanh toán</p>
            <ul className="th-seller-order-detail__money-rows th-seller-order-detail__money-rows--tight">
              <li className="th-seller-order-detail__money-rows--total">
                <span>Tổng thanh toán</span>
                <strong>{formatVND(detail.grandTotalVnd)}</strong>
              </li>
              {showQuotationPaymentSummary ? (
                <>
                  <li>
                    <span>{detail.orderDetailSource === 'api' ? 'Đã thanh toán' : 'Đã cọc'}</span>
                    <strong className="th-seller-order-detail__money-deposit">
                      {formatVND(detail.depositVnd)}
                    </strong>
                  </li>
                  <li className="th-seller-order-detail__money-rows--due">
                    <span>Còn phải thu</span>
                    <strong>{formatVND(detail.balanceDueVnd)}</strong>
                  </li>
                </>
              ) : null}
            </ul>
          </div>
        </section>

        <section
          className="th-seller-order-detail__card th-seller-order-detail__card--lines-qt"
          aria-labelledby="th-sod-lines"
        >
          <h2 id="th-sod-lines" className="th-seller-order-detail__card-title">
            <span className="material-symbols-outlined" aria-hidden>
              inventory_2
            </span>
            {variant === 'quotation' ? 'Sản phẩm báo giá' : 'Sản phẩm đơn hàng'}
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
                  {variant === 'quotation' ? (
                    <>
                      <th className="th-seller-order-detail__th-num">Đơn giá niêm yết</th>
                      <th className="th-seller-order-detail__th-num">CK %</th>
                      <th className="th-seller-order-detail__th-num">Đơn giá sau CK</th>
                    </>
                  ) : (
                    <th className="th-seller-order-detail__th-num">Đơn giá</th>
                  )}
                  {hideLineCostColumn ? null : (
                    <th className="th-seller-order-detail__th-num">Giá vốn</th>
                  )}
                  <th className="th-seller-order-detail__th-num">Thành tiền</th>
                  {showLineDeliveryColumns ? (
                    <>
                      <th className="th-seller-order-detail__th-num">Đã giao</th>
                      <th className="th-seller-order-detail__th-num">Còn giao</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {detail.items.map((line, lineIdx) => {
                  const qtPricing = quotationPricingByLine?.[lineIdx]
                  return (
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
                        {sellerOrderLineKindLabel(line.kind)}
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
                    {variant === 'quotation' ? (
                      <>
                        <td className="th-seller-order-detail__td-num">
                          {qtPricing?.listUnitPriceVnd != null
                            ? formatVND(qtPricing.listUnitPriceVnd)
                            : '—'}
                        </td>
                        <td className="th-seller-order-detail__td-num">
                          {qtPricing?.discountPercent != null ? (
                            <>
                              {qtPricing.discountPercent}%
                              {qtPricing.driftVnd > 0 ? (
                                <span
                                  className="th-seller-order-detail__pricing-drift"
                                  title="Đơn giá đã lưu không khớp làm tròn từ giá niêm yết hiện tại — có thể do đổi giá catalog hoặc dòng cũ"
                                >
                                  <span className="material-symbols-outlined" aria-hidden>
                                    warning
                                  </span>
                                </span>
                              ) : null}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="th-seller-order-detail__td-num">
                          {formatVND(qtPricing?.effectiveUnitVnd ?? line.unitPriceVnd)}
                        </td>
                      </>
                    ) : (
                      <td className="th-seller-order-detail__td-num">{formatVND(line.unitPriceVnd)}</td>
                    )}
                    {hideLineCostColumn ? null : (
                      <td className="th-seller-order-detail__td-num">
                        {line.unitCostAtTimeVnd != null ? formatVND(line.unitCostAtTimeVnd) : '—'}
                      </td>
                    )}
                    <td className="th-seller-order-detail__td-num">{formatVND(line.lineTotalVnd)}</td>
                    {showLineDeliveryColumns ? (
                      <>
                        <td className="th-seller-order-detail__td-num">{line.deliveredQty ?? 0}</td>
                        <td className="th-seller-order-detail__td-num">
                          {line.remainingToDeliver ?? line.qty}
                        </td>
                      </>
                    ) : null}
                  </tr>
                )})}
              </tbody>
              <tfoot>
                <tr className="th-seller-order-detail__table-foot">
                  <td
                    colSpan={lineTableFootColSpan}
                    className="th-seller-order-detail__table-foot-label"
                  >
                    TỔNG
                  </td>
                  <td className="th-seller-order-detail__td-num th-seller-order-detail__table-foot-sum">
                    {formatVND(itemsSumVnd)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="th-seller-order-detail__card th-seller-order-detail__card--wide" aria-labelledby="th-sod-note">
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
              {paymentNewAllowed ? (
                <div className="th-seller-order-detail__paytabs" role="tablist" aria-label="Tab thanh toán">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={effectivePaymentTab === 'history'}
                    className={
                      effectivePaymentTab === 'history'
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
                    aria-selected={effectivePaymentTab === 'new'}
                    className={
                      effectivePaymentTab === 'new'
                        ? 'th-seller-order-detail__paytab th-seller-order-detail__paytab--active'
                        : 'th-seller-order-detail__paytab'
                    }
                    onClick={() => setPaymentTab('new')}
                  >
                    Thanh toán mới
                  </button>
                </div>
              ) : (
                <p className="th-seller-order-detail__payhist-only-hint">
                  Đơn đã hủy — chỉ xem lịch sử thanh toán.
                </p>
              )}

              {effectivePaymentTab === 'history' ? (
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
                                  <code title={p.id}>{formatSellerPaymentRef(p.id)}</code>
                                </td>
                                <td className="th-seller-order-detail__payhist-num">{formatVND(p.amount)}</td>
                                <td>{sellerPaymentMethodLabel(p.paymentMethod)}</td>
                                <td>
                                  <span className={sellerPaymentStatusClass(p.status)}>
                                    {sellerPaymentStatusLabel(p.status)}
                                  </span>
                                </td>
                                <td>{p.note || '—'}</td>
                                <td>
                                  {p.proofImage ? (
                                    <SellerPaymentProofThumb url={p.proofImage} />
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
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={newPayAmount}
                        onChange={(e) => setNewPayAmount(normalizeVndInputTyping(e.target.value))}
                        placeholder="1.000.000"
                        aria-describedby="seller-order-pay-remaining"
                      />
                      <span id="seller-order-pay-remaining" className="th-seller-order-detail__paynew-hint">
                        Còn phải thu: {formatVND(detail.balanceDueVnd)}
                      </span>
                    </label>
                    <label className="th-seller-order-detail__paynew-field">
                      <span>Phương thức thanh toán</span>
                      <select
                        value={newPayMethod}
                        onChange={(e) => {
                          const v = e.target.value
                          setNewPayMethod(v)
                          if (v === 'Tiền mặt') {
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
                      <label className="th-seller-order-detail__paynew-field th-seller-order-detail__paynew-field--full">
                        <span>Ảnh chứng từ chuyển khoản</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setNewPayImageFile(e.target.files?.[0] ?? null)}
                        />
                        {newPayImageFile ? (
                          <span className="th-seller-order-detail__paynew-hint">{newPayImageFile.name}</span>
                        ) : null}
                      </label>
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
