/**
 * Khách sỉ / đại lý B2B — mock cho màn admin.
 */

export type AgencyLevel = 'vip' | 'gold' | 'standard'

export type Agency = {
  id: string
  /** Mã nội bộ hiển thị */
  code: string
  legalName: string
  shortName: string
  taxCode: string
  level: AgencyLevel
  phone: string
  email: string
  city: string
  address: string
  /** NVBH phụ trách (mock tên) */
  assignedSellerName: string
  /** Từ API: UUID — dùng chuyển seller / form */
  assignedSellerId?: string
  /** Từ API: cấp BE (Bronze, VIP, A, …) */
  apiLevelRaw?: string
  totalDebtVnd: number
  creditLimitVnd: number
  isActive: boolean
  note: string
  createdAt: string
}

export const AGENCY_LEVEL_OPTIONS: { value: AgencyLevel; label: string }[] = [
  { value: 'vip', label: 'VIP' },
  { value: 'gold', label: 'Gold' },
  { value: 'standard', label: 'Tiêu chuẩn' },
]

export const FILTER_AGENCY_LEVEL_OPTIONS: { id: string; label: string }[] = [
  { id: '', label: 'Tất cả cấp' },
  ...AGENCY_LEVEL_OPTIONS.map((o) => ({ id: o.value, label: o.label })),
]

export function levelLabel(level: AgencyLevel): string {
  return AGENCY_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? level
}

export function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + '₫'
}

/** Dư nợ vượt ngưỡng cảnh báo so với hạn mức */
export function isDebtRisk(a: Pick<Agency, 'totalDebtVnd' | 'creditLimitVnd'>): boolean {
  if (a.creditLimitVnd <= 0) return a.totalDebtVnd > 0
  return a.totalDebtVnd / a.creditLimitVnd >= 0.8
}

type Seed = Omit<Agency, 'id'>

const SEED: Seed[] = [
  {
    code: 'KS-2025-001',
    legalName: 'Công ty TNHH Nội Thất Hoàng Gia',
    shortName: 'Hoàng Gia',
    taxCode: '0312345678',
    level: 'vip',
    phone: '0903 111 222',
    email: 'kd@hoanggia.vn',
    city: 'TP.HCM',
    address: '45 Nguyễn Văn Trỗi, Q.Phú Nhuận',
    assignedSellerName: 'Nguyễn Văn A',
    totalDebtVnd: 185_000_000,
    creditLimitVnd: 250_000_000,
    isActive: true,
    note: 'Ưu tiên giao hàng cuối tuần',
    createdAt: '2025-01-12',
  },
  {
    code: 'KS-2025-002',
    legalName: 'Cổ phần Thương mại Đông Dương',
    shortName: 'Đông Dương',
    taxCode: '0109876543',
    level: 'gold',
    phone: '024 3856 7890',
    email: 'mua@dongduong.vn',
    city: 'Hà Nội',
    address: '12 Trần Duy Hưng, Cầu Giấy',
    assignedSellerName: 'Trần Thị B',
    totalDebtVnd: 42_500_000,
    creditLimitVnd: 120_000_000,
    isActive: true,
    note: '',
    createdAt: '2025-02-03',
  },
  {
    code: 'KS-2025-003',
    legalName: 'TNHH Decor Miền Tây',
    shortName: 'Decor Miền Tây',
    taxCode: '1800567890',
    level: 'standard',
    phone: '0292 3777 888',
    email: 'contact@mientaydecor.vn',
    city: 'Cần Thơ',
    address: '88 Nguyễn Văn Cừ, Ninh Kiều',
    assignedSellerName: 'Lê Văn C',
    totalDebtVnd: 96_000_000,
    creditLimitVnd: 100_000_000,
    isActive: true,
    note: 'Cảnh báo hạn mức',
    createdAt: '2025-02-18',
  },
  {
    code: 'KS-2025-004',
    legalName: 'Công ty CP Nhà Xinh Bình Dương',
    shortName: 'Nhà Xinh BD',
    taxCode: '3701234567',
    level: 'gold',
    phone: '0274 2222 333',
    email: 'sales@nhaxinhbd.vn',
    city: 'Bình Dương',
    address: 'KCN VSIP II, Thuận An',
    assignedSellerName: 'Nguyễn Văn A',
    totalDebtVnd: 15_000_000,
    creditLimitVnd: 80_000_000,
    isActive: true,
    note: '',
    createdAt: '2025-03-01',
  },
  {
    code: 'KS-2025-005',
    legalName: 'Hộ kinh doanh Tùng Phát',
    shortName: 'Tùng Phát',
    taxCode: '8585858585',
    level: 'standard',
    phone: '0918 444 555',
    email: 'tungphat@gmail.com',
    city: 'Đà Nẵng',
    address: '5 Lê Duẩn, Hải Châu',
    assignedSellerName: 'Phạm Thị D',
    totalDebtVnd: 0,
    creditLimitVnd: 30_000_000,
    isActive: true,
    note: 'Mới mở hạn mức',
    createdAt: '2025-03-22',
  },
  {
    code: 'KS-2024-088',
    legalName: 'TNHH Furni Hải Phòng',
    shortName: 'Furni HP',
    taxCode: '0201122334',
    level: 'vip',
    phone: '0225 999 000',
    email: 'ceo@furnihp.vn',
    city: 'Hải Phòng',
    address: 'Lô 12 KCN Đình Vũ',
    assignedSellerName: 'Trần Thị B',
    totalDebtVnd: 310_000_000,
    creditLimitVnd: 300_000_000,
    isActive: true,
    note: 'Vượt hạn mức — chờ duyệt nới',
    createdAt: '2024-11-05',
  },
  {
    code: 'KS-2024-071',
    legalName: 'Công ty TNHH Euro Kitchen VN',
    shortName: 'Euro Kitchen',
    taxCode: '0318765432',
    level: 'gold',
    phone: '028 3512 9999',
    email: 'orders@eurokitchen.vn',
    city: 'TP.HCM',
    address: '120 Điện Biên Phủ, Q.1',
    assignedSellerName: 'Nguyễn Văn A',
    totalDebtVnd: 58_000_000,
    creditLimitVnd: 150_000_000,
    isActive: false,
    note: 'Tạm khóa theo yêu cầu kế toán',
    createdAt: '2024-09-14',
  },
  {
    code: 'KS-2025-006',
    legalName: 'Showroom Gia Long Furniture',
    shortName: 'Gia Long',
    taxCode: '6001597530',
    level: 'standard',
    phone: '0291 3888 999',
    email: 'info@gialong.vn',
    city: 'An Giang',
    address: 'TP Long Xuyên',
    assignedSellerName: 'Lê Văn C',
    totalDebtVnd: 8_200_000,
    creditLimitVnd: 40_000_000,
    isActive: true,
    note: '',
    createdAt: '2025-04-02',
  },
  {
    code: 'KS-2025-007',
    legalName: 'CTCP Đầu tư HomeStyle',
    shortName: 'HomeStyle',
    taxCode: '0102233445',
    level: 'vip',
    phone: '024 3333 4444',
    email: 'b2b@homestyle.vn',
    city: 'Hà Nội',
    address: '88 Phạm Hùng, Nam Từ Liêm',
    assignedSellerName: 'Trần Thị B',
    totalDebtVnd: 198_000_000,
    creditLimitVnd: 400_000_000,
    isActive: true,
    note: 'Ký HĐ khung 2025',
    createdAt: '2025-04-08',
  },
  {
    code: 'KS-2025-008',
    legalName: 'Đại lý Minh Tuấn — Vũng Tàu',
    shortName: 'Minh Tuấn VT',
    taxCode: '3500777888',
    level: 'standard',
    phone: '0254 3612 345',
    email: 'minhtuan.vt@gmail.com',
    city: 'Bà Rịa — Vũng Tàu',
    address: '30 Lê Hồng Phong',
    assignedSellerName: 'Phạm Thị D',
    totalDebtVnd: 22_400_000,
    creditLimitVnd: 50_000_000,
    isActive: true,
    note: '',
    createdAt: '2025-04-09',
  },
]

export const MOCK_AGENCIES: Agency[] = SEED.map((row, i) => ({
  ...row,
  id: `agency-${i + 1}`,
}))
