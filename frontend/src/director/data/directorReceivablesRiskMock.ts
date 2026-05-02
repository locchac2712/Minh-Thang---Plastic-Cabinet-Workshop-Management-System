/**
 * Giám sát công nợ & tuổi nợ (DIR-F03). Nguồn gốc: AGENCIES.total_debt; phân tích aging mở rộng từ
 * INVOICES / PAYMENTS (hạn thanh toán, cấn trừ) — xem database_dictionary (PAYMENTS, INVOICES).
 * Báo cáo gốc: GET /api/director/reports/debts — documents/api/director.md
 */

export type ReceivableAgingBand = 'current' | 'd1_30' | 'd31_60' | 'd61_90' | 'd90plus'

export type DirectorReceivableRiskRow = {
  id: string
  rank: number
  agencyId: string
  agencyCode: string
  shortName: string
  legalName: string
  city: string
  sellerName: string
  /** Snapshot phải thu — khớp khái niệm AGENCIES.total_debt (công nợ KH nợ xưởng) */
  totalReceivableVnd: number
  /** Phần quá hạn theo hạn TT trên chứng từ (mock tổng hợp) */
  overdueVnd: number
  /** Phân bổ theo bucket (mock) — tổng các bucket = totalReceivableVnd */
  aging: Record<ReceivableAgingBand, number>
  maxDaysPastDue: number
  oldestOpenDocAt: string
  riskLevel: 'critical' | 'high' | 'watch'
  note: string
}

function bandLabel(b: ReceivableAgingBand): string {
  const m: Record<ReceivableAgingBand, string> = {
    current: 'Chưa đến hạn',
    d1_30: '1–30 ngày',
    d31_60: '31–60 ngày',
    d61_90: '61–90 ngày',
    d90plus: '>90 ngày',
  }
  return m[b]
}

/** Bucket quá hạn chủ yếu (dư lớn nhất trong các band quá hạn). */
export function dominantOverdueBand(row: DirectorReceivableRiskRow): ReceivableAgingBand {
  const order: ReceivableAgingBand[] = ['d90plus', 'd61_90', 'd31_60', 'd1_30', 'current']
  let best: ReceivableAgingBand = 'current'
  let bestAmt = -1
  for (const k of order) {
    const v = row.aging[k]
    if (k !== 'current' && v > bestAmt) {
      bestAmt = v
      best = k
    }
  }
  if (bestAmt <= 0) return 'current'
  return best
}

export function dominantBandLabel(row: DirectorReceivableRiskRow): string {
  return bandLabel(dominantOverdueBand(row))
}

const ROWS: DirectorReceivableRiskRow[] = [
  {
    id: 'ar-1',
    rank: 1,
    agencyId: 'agency-6',
    agencyCode: 'KS-2024-088',
    shortName: 'Furni HP',
    legalName: 'TNHH Furni Hải Phòng',
    city: 'Hải Phòng',
    sellerName: 'Trần Thị B',
    totalReceivableVnd: 310_000_000,
    overdueVnd: 285_000_000,
    aging: {
      current: 25_000_000,
      d1_30: 40_000_000,
      d31_60: 55_000_000,
      d61_90: 80_000_000,
      d90plus: 110_000_000,
    },
    maxDaysPastDue: 127,
    oldestOpenDocAt: '2024-12-05',
    riskLevel: 'critical',
    note: 'Vượt hạn mức — nhiều HĐ chờ cấn; ưu tiên thu từ đợt container Q4.',
  },
  {
    id: 'ar-2',
    rank: 2,
    agencyId: 'agency-9',
    agencyCode: 'KS-2025-007',
    shortName: 'HomeStyle',
    legalName: 'CTCP Đầu tư HomeStyle',
    city: 'Hà Nội',
    sellerName: 'Trần Thị B',
    totalReceivableVnd: 198_000_000,
    overdueVnd: 112_000_000,
    aging: {
      current: 86_000_000,
      d1_30: 38_000_000,
      d31_60: 42_000_000,
      d61_90: 22_000_000,
      d90plus: 10_000_000,
    },
    maxDaysPastDue: 74,
    oldestOpenDocAt: '2025-01-28',
    riskLevel: 'high',
    note: 'HĐ khung 2025 — đối chiếu lịch thanh toán theo milestone.',
  },
  {
    id: 'ar-3',
    rank: 3,
    agencyId: 'agency-1',
    agencyCode: 'KS-2025-001',
    shortName: 'Hoàng Gia',
    legalName: 'Công ty TNHH Nội Thất Hoàng Gia',
    city: 'TP.HCM',
    sellerName: 'Nguyễn Văn A',
    totalReceivableVnd: 185_000_000,
    overdueVnd: 48_000_000,
    aging: {
      current: 137_000_000,
      d1_30: 28_000_000,
      d31_60: 12_000_000,
      d61_90: 8_000_000,
      d90plus: 0,
    },
    maxDaysPastDue: 52,
    oldestOpenDocAt: '2025-02-18',
    riskLevel: 'watch',
    note: 'Khách VIP — theo dõi sau kỳ hạn Tết.',
  },
  {
    id: 'ar-4',
    rank: 4,
    agencyId: 'agency-3',
    agencyCode: 'KS-2025-003',
    shortName: 'Decor Miền Tây',
    legalName: 'TNHH Decor Miền Tây',
    city: 'Cần Thơ',
    sellerName: 'Lê Văn C',
    totalReceivableVnd: 96_000_000,
    overdueVnd: 62_000_000,
    aging: {
      current: 34_000_000,
      d1_30: 12_000_000,
      d31_60: 18_000_000,
      d61_90: 22_000_000,
      d90plus: 10_000_000,
    },
    maxDaysPastDue: 96,
    oldestOpenDocAt: '2024-12-20',
    riskLevel: 'high',
    note: '≥80% hạn mức — nhắc NVBH chốt lịch thu.',
  },
  {
    id: 'ar-5',
    rank: 5,
    agencyId: 'agency-seller-extra-3',
    agencyCode: 'KS-2025-120',
    shortName: 'WoodPro',
    legalName: 'CTCP Làng Nghề WoodPro',
    city: 'Đồng Nai',
    sellerName: 'Nguyễn Văn A',
    totalReceivableVnd: 228_000_000,
    overdueVnd: 35_000_000,
    aging: {
      current: 193_000_000,
      d1_30: 22_000_000,
      d31_60: 8_000_000,
      d61_90: 5_000_000,
      d90plus: 0,
    },
    maxDaysPastDue: 41,
    oldestOpenDocAt: '2025-03-01',
    riskLevel: 'watch',
    note: 'Nới HM chờ GD — theo dõi song song dòng tiền.',
  },
  {
    id: 'ar-6',
    rank: 6,
    agencyId: 'agency-7',
    agencyCode: 'KS-2024-071',
    shortName: 'Euro Kitchen',
    legalName: 'Công ty TNHH Euro Kitchen VN',
    city: 'TP.HCM',
    sellerName: 'Nguyễn Văn A',
    totalReceivableVnd: 58_000_000,
    overdueVnd: 58_000_000,
    aging: {
      current: 0,
      d1_30: 5_000_000,
      d31_60: 13_000_000,
      d61_90: 15_000_000,
      d90plus: 25_000_000,
    },
    maxDaysPastDue: 118,
    oldestOpenDocAt: '2024-11-10',
    riskLevel: 'critical',
    note: 'Tài khoản tạm khóa — toàn bộ dư nợ quá hạn, cần phối hợp KT.',
  },
  {
    id: 'ar-7',
    rank: 7,
    agencyId: 'agency-2',
    agencyCode: 'KS-2025-002',
    shortName: 'Đông Dương',
    legalName: 'Cổ phần Thương mại Đông Dương',
    city: 'Hà Nội',
    sellerName: 'Trần Thị B',
    totalReceivableVnd: 42_500_000,
    overdueVnd: 18_000_000,
    aging: {
      current: 24_500_000,
      d1_30: 10_000_000,
      d31_60: 5_500_000,
      d61_90: 2_500_000,
      d90plus: 0,
    },
    maxDaysPastDue: 58,
    oldestOpenDocAt: '2025-02-12',
    riskLevel: 'watch',
    note: 'Đối soát biên lai kỳ 03/2025.',
  },
  {
    id: 'ar-8',
    rank: 8,
    agencyId: 'agency-10',
    agencyCode: 'KS-2025-008',
    shortName: 'Minh Tuấn VT',
    legalName: 'Đại lý Minh Tuấn — Vũng Tàu',
    city: 'Bà Rịa — Vũng Tàu',
    sellerName: 'Phạm Thị D',
    totalReceivableVnd: 22_400_000,
    overdueVnd: 14_200_000,
    aging: {
      current: 8_200_000,
      d1_30: 6_000_000,
      d31_60: 4_800_000,
      d61_90: 2_400_000,
      d90plus: 1_000_000,
    },
    maxDaysPastDue: 88,
    oldestOpenDocAt: '2025-01-05',
    riskLevel: 'high',
    note: 'Khách nhỏ — cân nhắc hạn chế giao thêm trước khi thu nợ.',
  },
  {
    id: 'ar-9',
    rank: 9,
    agencyId: 'agency-4',
    agencyCode: 'KS-2025-004',
    shortName: 'Nhà Xinh BD',
    legalName: 'Công ty CP Nhà Xinh Bình Dương',
    city: 'Bình Dương',
    sellerName: 'Nguyễn Văn A',
    totalReceivableVnd: 15_000_000,
    overdueVnd: 6_200_000,
    aging: {
      current: 8_800_000,
      d1_30: 3_500_000,
      d31_60: 2_200_000,
      d61_90: 500_000,
      d90plus: 0,
    },
    maxDaysPastDue: 45,
    oldestOpenDocAt: '2025-02-25',
    riskLevel: 'watch',
    note: 'Quý mới — nhắc thanh toán đợt showroom.',
  },
  {
    id: 'ar-10',
    rank: 10,
    agencyId: 'agency-8',
    agencyCode: 'KS-2025-006',
    shortName: 'Gia Long',
    legalName: 'Showroom Gia Long Furniture',
    city: 'An Giang',
    sellerName: 'Lê Văn C',
    totalReceivableVnd: 8_200_000,
    overdueVnd: 2_100_000,
    aging: {
      current: 6_100_000,
      d1_30: 1_500_000,
      d31_60: 600_000,
      d61_90: 0,
      d90plus: 0,
    },
    maxDaysPastDue: 38,
    oldestOpenDocAt: '2025-03-04',
    riskLevel: 'watch',
    note: 'Dư nợ thấp — theo dõi định kỳ.',
  },
]

export const DIRECTOR_RECEIVABLE_RISK_ROWS: DirectorReceivableRiskRow[] = ROWS
