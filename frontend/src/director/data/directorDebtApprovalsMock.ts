/**
 * Hàng chờ GD — nới hạn mức khi AGENCIES.total_debt chạm AGENCIES.max_debt_limit (DIR-A03).
 * Luồng: workflows.md — Luồng 4 Giải cứu đại lý.
 * API: PATCH /api/director/approvals/agencies/{id}/override-debt — body { maxDebtLimit } — guidelineUI/director/approvals.md
 */
import type { AgencyLevel } from '../../admin/partners/agencyModel'

export type DirectorDebtApprovalRow = {
  id: string
  agencyId: string
  agencyCode: string
  shortName: string
  legalName: string
  level: AgencyLevel
  sellerName: string
  submittedAt: string
  totalDebtVnd: number
  /** Hạn mức đang áp dụng trên hệ thống */
  currentCreditLimitVnd: number
  /** Hạn mức NVBH / khách đề xuất */
  requestedCreditLimitVnd: number
  reasonSummary: string
  /** Không cho lập đơn mới do vượt HM hoặc flag rủi ro */
  isOrderingBlocked: boolean
  priority: 'normal' | 'high'
  slaDueAt: string
}

const ROWS: DirectorDebtApprovalRow[] = [
  {
    id: 'debt-apr-1',
    agencyId: 'agency-6',
    agencyCode: 'KS-2024-088',
    shortName: 'Furni HP',
    legalName: 'TNHH Furni Hải Phòng',
    level: 'vip',
    sellerName: 'Trần Thị B',
    submittedAt: '2025-04-10',
    totalDebtVnd: 310_000_000,
    currentCreditLimitVnd: 300_000_000,
    requestedCreditLimitVnd: 450_000_000,
    reasonSummary: 'Vượt hạn mức — khóa lập đơn; KH VIP ký cam kết thu nợ 200M trong 30 ngày.',
    isOrderingBlocked: true,
    priority: 'high',
    slaDueAt: '2025-04-11',
  },
  {
    id: 'debt-apr-2',
    agencyId: 'agency-seller-extra-3',
    agencyCode: 'KS-2025-120',
    shortName: 'WoodPro',
    legalName: 'CTCP Làng Nghề WoodPro',
    level: 'vip',
    sellerName: 'Nguyễn Văn A',
    submittedAt: '2025-04-09',
    totalDebtVnd: 228_000_000,
    currentCreditLimitVnd: 240_000_000,
    requestedCreditLimitVnd: 320_000_000,
    reasonSummary: 'Đơn khung Q2 — cần nới HM để nhận container tủ; sắp họp nới hạn mức (ghi chú NVBH).',
    isOrderingBlocked: false,
    priority: 'high',
    slaDueAt: '2025-04-12',
  },
  {
    id: 'debt-apr-3',
    agencyId: 'agency-1',
    agencyCode: 'KS-2025-001',
    shortName: 'Hoàng Gia',
    legalName: 'Công ty TNHH Nội Thất Hoàng Gia',
    level: 'vip',
    sellerName: 'Nguyễn Văn A',
    submittedAt: '2025-04-08',
    totalDebtVnd: 185_000_000,
    currentCreditLimitVnd: 250_000_000,
    requestedCreditLimitVnd: 320_000_000,
    reasonSummary: 'Hợp đồng khung 2025 — đề xuất HM mới để giữ đơn showroom.',
    isOrderingBlocked: false,
    priority: 'normal',
    slaDueAt: '2025-04-14',
  },
  {
    id: 'debt-apr-4',
    agencyId: 'agency-3',
    agencyCode: 'KS-2025-003',
    shortName: 'Decor Miền Tây',
    legalName: 'TNHH Decor Miền Tây',
    level: 'standard',
    sellerName: 'Lê Văn C',
    submittedAt: '2025-04-07',
    totalDebtVnd: 96_000_000,
    currentCreditLimitVnd: 100_000_000,
    requestedCreditLimitVnd: 140_000_000,
    reasonSummary: 'Đang ≥80% HM — hệ thống cảnh báo đỏ; xin nới nhỏ để chốt đơn tủ bếp.',
    isOrderingBlocked: true,
    priority: 'normal',
    slaDueAt: '2025-04-13',
  },
  {
    id: 'debt-apr-5',
    agencyId: 'agency-8',
    agencyCode: 'KS-2025-007',
    shortName: 'HomeStyle',
    legalName: 'CTCP Đầu tư HomeStyle',
    level: 'vip',
    sellerName: 'Trần Thị B',
    submittedAt: '2025-04-06',
    totalDebtVnd: 198_000_000,
    currentCreditLimitVnd: 400_000_000,
    requestedCreditLimitVnd: 520_000_000,
    reasonSummary: 'Mở rộng kênh phía Bắc — đề xuất HM 520M theo HĐ khung đã ký.',
    isOrderingBlocked: false,
    priority: 'normal',
    slaDueAt: '2025-04-15',
  },
]

export const DIRECTOR_DEBT_APPROVAL_ROWS: DirectorDebtApprovalRow[] = ROWS

export function debtUseRatio(row: Pick<DirectorDebtApprovalRow, 'totalDebtVnd' | 'currentCreditLimitVnd'>): number {
  if (row.currentCreditLimitVnd <= 0) return row.totalDebtVnd > 0 ? 1 : 0
  return row.totalDebtVnd / row.currentCreditLimitVnd
}
