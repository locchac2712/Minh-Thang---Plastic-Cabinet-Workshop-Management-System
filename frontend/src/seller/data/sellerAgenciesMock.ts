/**
 * Khách sỉ do NVBH đăng nhập phụ trách — mock đồng bộ cấu trúc Agency (admin).
 * API sau: GET /seller/agencies hoặc filter theo JWT.
 */
import { MOCK_AGENCIES, type Agency } from '../../admin/partners/agencyModel'

/** Giả lập tên NVBH đang đăng nhập (thay bằng session / token). */
export const SELLER_LOGIN_NAME = 'Nguyễn Văn A'

export type SellerAgencyRow = Agency & {
  /** Số đơn / tủ đã lấy gần đây (mock 90 ngày) — up-sale */
  recentCabinetOrders90d: number
}

const EXTRA_ASSIGNED_TO_SELLER: Agency[] = [
  {
    id: 'agency-seller-extra-1',
    code: 'KS-2025-112',
    legalName: 'TNHH Thiết kế Aurora',
    shortName: 'Aurora',
    taxCode: '0319988776',
    level: 'gold',
    phone: '0901 222 333',
    email: 'kd@aurora.vn',
    city: 'TP.HCM',
    address: '88 Pasteur, Q.1',
    assignedSellerName: SELLER_LOGIN_NAME,
    totalDebtVnd: 67_000_000,
    creditLimitVnd: 100_000_000,
    isActive: true,
    note: 'Ưu tiên tủ bếp acrylic',
    createdAt: '2025-03-28',
  },
  {
    id: 'agency-seller-extra-2',
    code: 'KS-2025-118',
    legalName: 'Cửa hàng Nội thất Kim Ngân',
    shortName: 'Kim Ngân',
    taxCode: '5800123456',
    level: 'standard',
    phone: '0262 3777 888',
    email: 'kimngan.nt@gmail.com',
    city: 'Nha Trang',
    address: '12 Trần Phú',
    assignedSellerName: SELLER_LOGIN_NAME,
    totalDebtVnd: 12_400_000,
    creditLimitVnd: 45_000_000,
    isActive: true,
    note: '',
    createdAt: '2025-04-05',
  },
  {
    id: 'agency-seller-extra-3',
    code: 'KS-2025-120',
    legalName: 'CTCP Làng Nghề WoodPro',
    shortName: 'WoodPro',
    taxCode: '0700987654',
    level: 'vip',
    phone: '0274 5555 666',
    email: 'b2b@woodpro.vn',
    city: 'Đồng Nai',
    address: 'KCN Amata',
    assignedSellerName: SELLER_LOGIN_NAME,
    totalDebtVnd: 228_000_000,
    creditLimitVnd: 240_000_000,
    isActive: true,
    note: 'Sắp họp nới hạn mức',
    createdAt: '2025-04-08',
  },
  {
    id: 'agency-seller-extra-4',
    code: 'KS-2025-121',
    legalName: 'Đại lý Tâm Đức — Long An',
    shortName: 'Tâm Đức LA',
    taxCode: '1100556677',
    level: 'standard',
    phone: '0272 3888 999',
    email: 'tamduc.la@gmail.com',
    city: 'Long An',
    address: 'QL1A, Bến Lức',
    assignedSellerName: SELLER_LOGIN_NAME,
    totalDebtVnd: 4_800_000,
    creditLimitVnd: 35_000_000,
    isActive: true,
    note: 'Khách mới',
    createdAt: '2025-04-10',
  },
]

const BASE = [...MOCK_AGENCIES, ...EXTRA_ASSIGNED_TO_SELLER].filter(
  (a) => a.assignedSellerName === SELLER_LOGIN_NAME,
)

export const SELLER_MY_AGENCY_ROWS: SellerAgencyRow[] = BASE.map((a, i) => ({
  ...a,
  recentCabinetOrders90d: 3 + ((i * 5) % 26),
}))

export function getSellerAgencyById(id: string): SellerAgencyRow | undefined {
  return SELLER_MY_AGENCY_ROWS.find((a) => a.id === id)
}

/** Đơn hàng mock cho tab “Đơn & tủ đã lấy” — API GET /orders?seller&agencyId sau */
export type SellerAgencyOrderMock = {
  orderCode: string
  orderedAt: string
  summary: string
  lineCount: number
  totalVnd: number
  status: 'draft' | 'pending_approval' | 'producing' | 'shipping' | 'done'
  /** Đơn sẵn (thành phẩm chuẩn) hoặc custom (theo thiết kế / đo thực tế) */
  orderKind: 'ready_made' | 'custom'
}

const STATUS_LABEL: Record<SellerAgencyOrderMock['status'], string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ duyệt',
  producing: 'Thợ đang ráp',
  shipping: 'Chờ giao xe',
  done: 'Hoàn tất',
}

export function orderStatusLabel(s: SellerAgencyOrderMock['status']): string {
  return STATUS_LABEL[s]
}

export function mockOrdersForAgency(a: SellerAgencyRow): SellerAgencyOrderMock[] {
  const tail = a.code.replace(/\D/g, '').slice(-4) || '0001'
  const n = a.recentCabinetOrders90d
  return [
    {
      orderCode: `DH-${tail}-202504`,
      orderedAt: '2025-04-09',
      summary: 'Tủ bếp acrylic 3m + kệ',
      lineCount: 4,
      totalVnd: 38_500_000 + (n % 5) * 1_000_000,
      status: 'producing',
      orderKind: 'ready_made',
    },
    {
      orderCode: `DH-${tail}-202503`,
      orderedAt: '2025-03-28',
      summary: 'Tủ quần áo 4 buồng — mẫu chuẩn',
      lineCount: 2,
      totalVnd: 52_000_000,
      status: 'shipping',
      orderKind: 'ready_made',
    },
    {
      orderCode: `DH-${tail}-202503b`,
      orderedAt: '2025-03-15',
      summary: 'Bàn trang điểm + gương',
      lineCount: 1,
      totalVnd: 8_200_000,
      status: 'done',
      orderKind: 'ready_made',
    },
    {
      orderCode: `DH-${tail}-202502`,
      orderedAt: '2025-02-20',
      summary: 'Custom tủ kệ — theo bản vẽ',
      lineCount: 6,
      totalVnd: 94_000_000,
      status: a.isActive ? 'pending_approval' : 'draft',
      orderKind: 'custom',
    },
  ]
}
