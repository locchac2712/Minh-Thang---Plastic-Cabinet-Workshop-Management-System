/**
 * Danh sách đơn NVBH — gộp từ mock đơn theo từng khách sỉ (sellerAgenciesMock).
 * API sau: GET /seller/orders · GET /seller/orders/:code
 */
import type { SellerAgencyOrderMock } from './sellerAgenciesMock'
import {
  getSellerAgencyById,
  mockOrdersForAgency,
  SELLER_MY_AGENCY_ROWS,
} from './sellerAgenciesMock'

export type SellerOrderLineKind = 'catalog' | 'custom'

/** Phân loại đơn cấp đơn hàng — đơn sẵn (catalog) vs custom (thiết kế riêng). */
export type SellerOrderKind = SellerAgencyOrderMock['orderKind']

/** Nhãn UI: hàng chuẩn (catalog) / thiết kế riêng (custom). */
export const SELLER_CATALOG_KIND_LABEL = 'Hàng chuẩn'
export const SELLER_CUSTOM_KIND_LABEL = 'Thiết kế riêng'

export function sellerOrderKindLabel(kind: SellerOrderKind): string {
  return kind === 'ready_made' ? 'Đơn sẵn' : SELLER_CUSTOM_KIND_LABEL
}

export function sellerOrderLineKindLabel(kind: SellerOrderLineKind): string {
  return kind === 'catalog' ? SELLER_CATALOG_KIND_LABEL : SELLER_CUSTOM_KIND_LABEL
}

/** Nguồn dòng trên form báo giá (standard = catalog, agency_custom = custom theo đại lý). */
export function sellerQuotationLineSourceLabel(source: 'standard' | 'agency_custom'): string {
  return source === 'agency_custom' ? SELLER_CUSTOM_KIND_LABEL : SELLER_CATALOG_KIND_LABEL
}

/** Trạng thái hiển thị badge — mock (snake) + API (slug từ Draft/Pending/…) */
export type SellerOrderListRowStatus =
  | SellerAgencyOrderMock['status']
  | 'pending'
  | 'approved'
  | 'canceled'

const SELLER_ORDER_ROW_STATUS_LABEL: Record<SellerOrderListRowStatus, string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ duyệt',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  producing: 'Thợ đang ráp',
  shipping: 'Chờ giao xe',
  done: 'Hoàn tất',
  canceled: 'Đã hủy',
}

export function sellerOrderRowStatusLabel(s: SellerOrderListRowStatus): string {
  return SELLER_ORDER_ROW_STATUS_LABEL[s] ?? String(s)
}

export type SellerOrderListRow = {
  id: string
  orderCode: string
  orderedAt: string
  agencyId: string
  agencyCode: string
  agencyShortName: string
  summary: string
  lineCount: number
  totalVnd: number
  /** Tổng chiết khấu trên đơn (mock) */
  discountVnd: number
  status: SellerOrderListRowStatus
  orderKind: SellerOrderKind
  /** Báo giá gốc khi đơn tạo từ copy (API) */
  sourceOrderId?: string | null
  sourceDisplayCode?: string | null
  recordKind?: 'quotation' | 'fulfillment' | null
}

function buildSellerOrderRows(): SellerOrderListRow[] {
  const out: SellerOrderListRow[] = []
  for (const a of SELLER_MY_AGENCY_ROWS) {
    const orders = mockOrdersForAgency(a)
    orders.forEach((o, j) => {
      out.push({
        id: `${a.id}__${o.orderCode}`,
        orderCode: o.orderCode,
        orderedAt: o.orderedAt,
        agencyId: a.id,
        agencyCode: a.code,
        agencyShortName: a.shortName,
        summary: o.summary,
        lineCount: o.lineCount,
        totalVnd: o.totalVnd,
        discountVnd: j % 3 === 0 ? 500_000 : 0,
        status: o.status,
        orderKind: o.orderKind,
      })
    })
  }
  out.sort((a, b) => b.orderedAt.localeCompare(a.orderedAt) || b.orderCode.localeCompare(a.orderCode))
  return out
}

export const SELLER_ORDER_ROWS: SellerOrderListRow[] = buildSellerOrderRows()

export function findSellerOrderByCode(orderCode: string): SellerOrderListRow | undefined {
  return SELLER_ORDER_ROWS.find((r) => r.orderCode === orderCode)
}


export type SellerOrderLineItem = {
  lineNo: number
  sku: string
  productName: string
  kind: SellerOrderLineKind
  qty: number
  unitPriceVnd: number
  /** Giá vốn đơn vị tại thời điểm lập đơn (API: unitCostAtTime) */
  unitCostAtTimeVnd?: number
  lineTotalVnd: number
  lineNote?: string
  /** API — tiến độ giao MTO */
  deliveredQty?: number
  remainingToDeliver?: number
}

export type SellerOrderTimelineEvent = {
  at: string
  title: string
  detail?: string
}

/** Chi tiết đơn — mock mở rộng từ dòng danh sách + khách */
export type SellerOrderDetail = SellerOrderListRow & {
  agencyLegalName: string
  agencyEmail: string
  agencyPhone: string
  agencyCity: string
  agencyAddress: string
  /** Trước giảm giá */
  subtotalBeforeDiscountVnd: number
  shippingFeeVnd: number
  /** Mock phí khác (đóng gói, cắt CNC…) */
  serviceFeeVnd: number
  /** Tổng thanh toán (sau giảm + phí ship + phí dịch vụ) */
  grandTotalVnd: number
  depositVnd: number
  balanceDueVnd: number
  expectedDeliveryDate: string | null
  quotationValidUntil: string | null
  /** Đơn/báo giá gốc khi tạo từ copy UI */
  sourceOrderId?: string | null
  sourceDisplayCode?: string | null
  factoryWindow: string | null
  deliveryMethod: string
  internalNote: string
  /** Đơn custom: mô tả yêu cầu khách / kỹ thuật do NVBH nhập khi lập đơn */
  requirementDescription: string | null
  items: SellerOrderLineItem[]
  timeline: SellerOrderTimelineEvent[]
  /** Chi tiết lấy từ GET /api/seller/orders/:id */
  orderDetailSource?: 'mock' | 'api'
  /** Khi orderDetailSource === api — người tạo đơn trên hệ thống */
  createdByName?: string
  /** API — loại đơn để PUT (Standard / Custom) */
  apiOrderType?: 'Standard' | 'Custom'
  /** API — dòng hàng gốc để gửi PUT cập nhật */
  apiOrderLinesForEdit?: {
    productId: string
    quantity: number
    unitPrice: number
  }[]
}

function splitHash(code: string): number {
  let h = 0
  for (let i = 0; i < code.length; i++) {
    h = (Math.imul(31, h) + code.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function buildLineItems(row: SellerOrderListRow): SellerOrderLineItem[] {
  const subtotal = row.totalVnd + row.discountVnd
  const n = Math.min(Math.max(1, row.lineCount), 8)
  const parts = row.summary.split(/[+,&]/).map((s) => s.trim()).filter(Boolean)
  const skuPrefixes = ['TU-BEP', 'TU-QA', 'KE-TV', 'NT-CUSTOM', 'PK-BT', 'CANH-AC']

  const targets: number[] = []
  let remaining = subtotal
  for (let i = 0; i < n; i++) {
    const isLast = i === n - 1
    if (isLast) {
      targets.push(remaining)
    } else {
      const share = Math.floor(remaining / (n - i) / 50_000) * 50_000
      const t = Math.max(400_000, share)
      targets.push(t)
      remaining -= t
    }
  }

  const lines: SellerOrderLineItem[] = targets.map((lineTotalRaw, i) => {
    const name =
      parts[i % Math.max(parts.length, 1)] || (i === 0 ? row.summary : `Hạng mục ${i + 1}`)
    const kind: SellerOrderLineKind =
      row.orderKind === 'ready_made'
        ? 'catalog'
        : splitHash(row.orderCode + String(i)) % 5 === 0
          ? 'catalog'
          : 'custom'
    const qty = (splitHash(`q${i}${row.orderCode}`) % 3) + 1
    const unitPriceVnd = Math.max(1, Math.round(lineTotalRaw / qty / 1000) * 1000)
    const lineTotalVnd = unitPriceVnd * qty
    return {
      lineNo: i + 1,
      sku: `${skuPrefixes[i % skuPrefixes.length]}-${100 + i}`,
      productName: name,
      kind,
      qty,
      unitPriceVnd,
      lineTotalVnd,
      lineNote: kind === 'custom' ? 'Theo bản vẽ / đo thực tế' : undefined,
    }
  })

  const sum = lines.reduce((s, x) => s + x.lineTotalVnd, 0)
  const drift = subtotal - sum
  if (lines.length && drift !== 0) {
    const last = lines[lines.length - 1]
    last.lineTotalVnd += drift
    last.unitPriceVnd = Math.max(1, Math.round(last.lineTotalVnd / last.qty / 1000) * 1000)
  }

  return lines
}

function buildTimeline(row: SellerOrderListRow): SellerOrderTimelineEvent[] {
  const d = row.orderedAt
  const t: SellerOrderTimelineEvent[] = [
    { at: `${d} 08:30`, title: 'Khởi tạo đơn', detail: 'NVBH lập báo giá & giỏ hàng' },
  ]
  const st = row.status
  if (st !== 'draft') {
    t.push({ at: `${d} 10:15`, title: 'Xác nhận với khách', detail: 'Khách đồng ý chủng loại / khung giá' })
  }
  if (['pending_approval', 'producing', 'shipping', 'done'].includes(st)) {
    t.push({
      at: `${d} 14:00`,
      title: 'Gửi duyệt nội bộ',
      detail: 'Giảm giá / hạng mục custom chờ Giám đốc',
    })
  }
  if (['producing', 'shipping', 'done'].includes(st)) {
    t.push({
      at: `${d} 17:30`,
      title: 'Chuyển xưởng',
      detail: 'Rã BOM — phân chuyền ráp / acrylic',
    })
  }
  if (['shipping', 'done'].includes(st)) {
    t.push({ at: `${d} 09:00`, title: 'Lên lịch giao', detail: 'Điều xe tải / xác nhận giờ nhận' })
  }
  if (st === 'done') {
    t.push({ at: `${d} 11:00`, title: 'Hoàn tất', detail: 'Biên bản giao hàng — kết thúc đơn' })
  }
  return t
}

export function getSellerOrderDetail(orderCode: string): SellerOrderDetail | undefined {
  const row = findSellerOrderByCode(orderCode)
  if (!row) return undefined
  const agency = getSellerAgencyById(row.agencyId)
  if (!agency) return undefined

  const h = splitHash(orderCode)
  const shippingFeeVnd = h % 2 === 0 ? 0 : 2_500_000
  const serviceFeeVnd = h % 4 === 0 ? 350_000 : 0
  const subtotalBeforeDiscountVnd = row.totalVnd + row.discountVnd
  const grandTotalVnd = row.totalVnd + shippingFeeVnd + serviceFeeVnd
  const depositVnd = Math.min(
    Math.floor(grandTotalVnd * 0.35 / 100_000) * 100_000,
    Math.max(0, grandTotalVnd - 500_000),
  )
  const balanceDueVnd = Math.max(0, grandTotalVnd - depositVnd)

  return {
    ...row,
    agencyLegalName: agency.legalName,
    agencyEmail: agency.email,
    agencyPhone: agency.phone,
    agencyCity: agency.city,
    agencyAddress: agency.address,
    subtotalBeforeDiscountVnd,
    shippingFeeVnd,
    serviceFeeVnd,
    grandTotalVnd,
    depositVnd,
    balanceDueVnd,
    expectedDeliveryDate:
      row.status === 'done'
        ? row.orderedAt
        : row.status === 'shipping'
          ? '2025-04-11'
          : '2025-04-18',
    quotationValidUntil:
      row.status === 'draft' || row.status === 'pending' || row.status === 'pending_approval'
        ? h % 4 === 0
          ? '2025-04-01'
          : h % 4 === 1
            ? '2026-12-31'
            : null
        : null,
    factoryWindow:
      row.status === 'producing' || row.status === 'shipping'
        ? 'Chuyền ráp 2 — tuần 15/2025 (mock)'
        : null,
    deliveryMethod:
      h % 3 === 0 ? 'Xe nhà máy — giao tận kho khách' : 'Khách nhận tại kho Q.12',
    internalNote: agency.note || '—',
    requirementDescription:
      row.orderKind === 'custom'
        ? `Theo hồ sơ NVBH: ${row.summary}. Vật liệu, màu acrylic, phụ kiện ray/ bản lề theo báo giá đã chốt; đo thực tế tại công trình (mock).`
        : null,
    items: buildLineItems(row),
    timeline: buildTimeline(row),
  }
}

/** Trạng thái từng chặng trên chuyền — đồng bộ manufacturing / production_tasks (mock). */
export type SellerFactoryGateStatus = 'pending' | 'active' | 'done' | 'blocked'

export type SellerOrderFactoryGate = {
  id: string
  order: number
  label: string
  hint: string
  status: SellerFactoryGateStatus
  workcenter?: string
  startedAt?: string
  finishedAt?: string
}

export type SellerFactoryMaterialLine = {
  sku: string
  name: string
  requiredQty: number
  uom: string
  /** Tồn kho phục vụ lệnh — documents/usecase seller SEL-T01/T02 */
  stockStatus: 'đủ' | 'đặt mua' | 'về kho'
}

/** Tiến độ xưởng cho tab NVBH khi đơn đang ở Xưởng ráp */
export type SellerFactoryProgress = {
  orderCode: string
  percentComplete: number
  currentGateLabel: string
  productionLot: string
  gates: SellerOrderFactoryGate[]
  materials: SellerFactoryMaterialLine[]
  lastActivityAt: string
  lastActivityText: string
  qcHold?: string
  blocker?: string
}

export function getSellerFactoryProgress(
  orderCode: string,
  status: SellerOrderListRowStatus,
): SellerFactoryProgress | null {
  if (status !== 'producing') return null
  const h = splitHash(orderCode)
  const pct = 32 + (h % 48)

  const gates: SellerOrderFactoryGate[] = [
    {
      id: 'cut',
      order: 1,
      label: 'Cắt CNC / nesting ván',
      hint: 'Từ BOM — tối ưu khổ',
      status: 'done',
      workcenter: 'Máy CNC-02',
      finishedAt: '2025-04-08 07:15',
    },
    {
      id: 'edge',
      order: 2,
      label: 'Dán cạnh',
      hint: 'PVC / veneer theo quy cách',
      status: 'done',
      workcenter: 'Chuyền dán 1',
      finishedAt: '2025-04-09 10:40',
    },
    {
      id: 'asm',
      order: 3,
      label: 'Lắp ráp tủ',
      hint: 'Theo bản vẽ shop drawing',
      status: 'active',
      workcenter: 'Chuyền ráp 2',
      startedAt: '2025-04-09 14:00',
    },
    {
      id: 'qc',
      order: 4,
      label: 'QC & đóng gói',
      hint: 'Kiểm mối / bóng / phụ kiện',
      status: h % 7 === 0 ? 'blocked' : 'pending',
      workcenter: 'QC cuối chuyền',
    },
    {
      id: 'wh',
      order: 5,
      label: 'Nhập kho TP chờ giao',
      hint: 'Gắn pallet — chờ xe',
      status: 'pending',
    },
  ]

  const hasBlockedGate = gates.some((g) => g.status === 'blocked')
  const blocker = hasBlockedGate
    ? 'Thiếu ray Blum đợt 2 — đã đặt NCC, dự về 10/04 (mock).'
    : undefined

  const materials: SellerFactoryMaterialLine[] = [
    {
      sku: 'VL-MDF-18',
      name: 'MDF phủ melamine trắng 18mm',
      requiredQty: 12,
      uom: 'tấm',
      stockStatus: 'đủ',
    },
    {
      sku: 'PK-BLUM-TAND',
      name: 'Ray tủ Blum Tandem',
      requiredQty: 8,
      uom: 'bộ',
      stockStatus: hasBlockedGate ? 'đặt mua' : 'đủ',
    },
    {
      sku: 'AC-KEO-PU',
      name: 'Keo dán cạnh PU',
      requiredQty: 3,
      uom: 'kg',
      stockStatus: 'về kho',
    },
  ]

  return {
    orderCode,
    percentComplete: Math.min(96, pct),
    currentGateLabel: 'Lắp ráp tủ — chuyền ráp 2',
    productionLot: `LO-${orderCode.replace(/\D/g, '').slice(-6) || '000001'}-2025`,
    gates,
    materials,
    lastActivityAt: '2025-04-10 08:22',
    lastActivityText:
      'Tổ ráp 2: hoàn tất module tủ trên trục A — chụp ảnh gửi nhật ký xưởng (mock).',
    qcHold: h % 11 === 0 ? 'Chờ QC duyệt mối acrylic mặt B.' : undefined,
    blocker,
  }
}
