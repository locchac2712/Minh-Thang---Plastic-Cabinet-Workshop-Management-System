/**
 * Hàng chờ phê duyệt Giám đốc — đơn lỗ biên / chiết khấu sâu / custom BOM.
 * Nghiệp vụ: DIR-A01, DIR-A02 (ORDERS.discount_amount, order_type Standard|Custom, status Pending).
 * API: GET /api/director/approvals/orders — documents/api/director.md
 */
import type { SellerOrderKind, SellerOrderLineItem } from '../../seller/data/sellerOrdersMock'

export type DirectorPricingCaseKind = 'margin_loss' | 'deep_discount' | 'custom_bom'

export type DirectorPricingApprovalRow = {
  id: string
  orderCode: string
  agencyShortName: string
  agencyCode: string
  orderKind: SellerOrderKind
  sellerName: string
  submittedAt: string
  orderValueVnd: number
  /** Biên LN gộp dự kiến % (sau giảm) */
  marginPct: number
  /** Ngưỡng tối thiểu nội bộ — dưới đây cần GD */
  floorMarginPct: number
  caseKind: DirectorPricingCaseKind
  /** Một dòng lý do hiển thị bảng */
  reasonSummary: string
  /** Đoạn rút từ mô tả yêu cầu — chỉ custom */
  requirementExcerpt: string | null
  /** Chiết khấu / giảm thêm đang xin duyệt */
  discountRequestVnd: number
  /** Hạn xử lý SLA (mock) */
  slaDueAt: string
  /** Độ ưu tiên hiển thị */
  priority: 'normal' | 'high'
  /** GET /api/director/approvals/orders — backend không trả biên LN / SLA chi tiết */
  metricsPlaceholder?: boolean
  /** Ghi chú nội bộ đơn (ORDERS.note) — dùng khi GD gửi reject / yêu cầu báo giá */
  orderNote?: string | null
  /** Dòng hàng từ API (chi tiết GD khi không có mock NVBH) */
  apiItems?: SellerOrderLineItem[]
}

/** Mã đơn khớp mockOrdersForAgency (sellerAgenciesMock) để getSellerOrderDetail hoạt động. */
const ROWS: DirectorPricingApprovalRow[] = [
  {
    id: 'apr-1',
    orderCode: 'DH-5112-202502',
    agencyShortName: 'Aurora',
    agencyCode: 'KS-2025-112',
    orderKind: 'custom',
    sellerName: 'Nguyễn Văn A',
    submittedAt: '2025-04-10',
    orderValueVnd: 94_000_000,
    marginPct: 11.2,
    floorMarginPct: 18,
    caseKind: 'custom_bom',
    reasonSummary: 'Custom BOM — acrylic + ray Blum; biên dưới ngưỡng 18%',
    requirementExcerpt:
      'Tủ kệ theo shop drawing, mặt B acrylic trắng; đo tại Q.2 — khách chốt trong tuần.',
    discountRequestVnd: 8_500_000,
    slaDueAt: '2025-04-12',
    priority: 'high',
  },
  {
    id: 'apr-2',
    orderCode: 'DH-5118-202504',
    agencyShortName: 'Kim Ngân',
    agencyCode: 'KS-2025-118',
    orderKind: 'ready_made',
    sellerName: 'Nguyễn Văn A',
    submittedAt: '2025-04-09',
    orderValueVnd: 41_500_000,
    marginPct: 14.5,
    floorMarginPct: 16,
    caseKind: 'deep_discount',
    reasonSummary: 'Chiết khấu thêm 12% để chốt đối thủ — biên 14.5%',
    requirementExcerpt: null,
    discountRequestVnd: 4_620_000,
    slaDueAt: '2025-04-11',
    priority: 'normal',
  },
  {
    id: 'apr-3',
    orderCode: 'DH-5120-202503',
    agencyShortName: 'WoodPro',
    agencyCode: 'KS-2025-120',
    orderKind: 'ready_made',
    sellerName: 'Nguyễn Văn A',
    submittedAt: '2025-04-08',
    orderValueVnd: 52_000_000,
    marginPct: 9.8,
    floorMarginPct: 15,
    caseKind: 'margin_loss',
    reasonSummary: 'Giá đơn vị module dưới floor catalog — cần GD duyệt giá đặc biệt (đơn sẵn)',
    requirementExcerpt: null,
    discountRequestVnd: 0,
    slaDueAt: '2025-04-10',
    priority: 'high',
  },
  {
    id: 'apr-4',
    orderCode: 'DH-5121-202503b',
    agencyShortName: 'Tâm Đức LA',
    agencyCode: 'KS-2025-121',
    orderKind: 'ready_made',
    sellerName: 'Nguyễn Văn A',
    submittedAt: '2025-04-07',
    orderValueVnd: 8_200_000,
    marginPct: 17.0,
    floorMarginPct: 16,
    caseKind: 'deep_discount',
    reasonSummary: 'Combo showroom — giảm 500k + freeship (vẫn hợp biên nhưng vượt quota tháng)',
    requirementExcerpt: null,
    discountRequestVnd: 500_000,
    slaDueAt: '2025-04-09',
    priority: 'normal',
  },
  {
    id: 'apr-5',
    orderCode: 'DH-5120-202502',
    agencyShortName: 'WoodPro',
    agencyCode: 'KS-2025-120',
    orderKind: 'custom',
    sellerName: 'Nguyễn Văn A',
    submittedAt: '2025-04-06',
    orderValueVnd: 94_000_000,
    marginPct: 10.5,
    floorMarginPct: 18,
    caseKind: 'custom_bom',
    reasonSummary: 'Custom tủ kệ — BOM đặc thù, duyệt gói giá trước khi chốt xưởng',
    requirementExcerpt: 'Bàn giao file shop drawing; lắp trong 10 ngày — khách ưu tiên cao.',
    discountRequestVnd: 15_000_000,
    slaDueAt: '2025-04-08',
    priority: 'high',
  },
]

export const DIRECTOR_PRICING_APPROVAL_ROWS: DirectorPricingApprovalRow[] = ROWS

export function findPricingApprovalByOrderCode(orderCode: string): DirectorPricingApprovalRow | undefined {
  return DIRECTOR_PRICING_APPROVAL_ROWS.find((r) => r.orderCode === orderCode)
}

export function caseKindLabel(k: DirectorPricingCaseKind): string {
  const m: Record<DirectorPricingCaseKind, string> = {
    margin_loss: 'Lỗ biên / dưới floor',
    deep_discount: 'Chiết khấu sâu',
    custom_bom: 'Custom / BOM đặc thù',
  }
  return m[k]
}

export function orderKindShortLabel(kind: SellerOrderKind): string {
  return kind === 'ready_made' ? 'Đơn sẵn' : 'Custom'
}
