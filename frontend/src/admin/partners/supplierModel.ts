/**
 * Nhà cung cấp — mock; shortName khớp primarySupplier vật tư để tab “Vật tư cung ứng”.
 */

export type SupplierTier = 'strategic' | 'approved' | 'watch'

export type Supplier = {
  id: string
  code: string
  legalName: string
  shortName: string
  taxCode: string
  phone: string
  email: string
  city: string
  address: string
  tier: SupplierTier
  paymentTermDays: number
  bankName: string
  bankAccountMasked: string
  /** Công nợ phải trả (AP) mock */
  totalPayableVnd: number
  leadTimeDaysAvg: number
  contractRef: string
  certifications: string
  isActive: boolean
  note: string
  createdAt: string
}

export const SUPPLIER_TIER_OPTIONS: { value: SupplierTier; label: string }[] = [
  { value: 'strategic', label: 'Chiến lược' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'watch', label: 'Theo dõi' },
]

export const FILTER_SUPPLIER_TIER_OPTIONS: { id: string; label: string }[] = [
  { id: '', label: 'Tất cả cấp' },
  ...SUPPLIER_TIER_OPTIONS.map((o) => ({ id: o.value, label: o.label })),
]

export function tierLabel(t: SupplierTier): string {
  return SUPPLIER_TIER_OPTIONS.find((o) => o.value === t)?.label ?? t
}

export function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + '₫'
}

type Seed = Omit<Supplier, 'id'>

const SEED: Seed[] = [
  {
    code: 'NCC-2025-001',
    legalName: 'Công ty TNHH Gỗ Minh An',
    shortName: 'Gỗ Minh An',
    taxCode: '0309988776',
    phone: '028 3845 6677',
    email: 'mua@gomintuan.vn',
    city: 'TP.HCM',
    address: 'KCN Tân Bình, Q.Tân Phú',
    tier: 'strategic',
    paymentTermDays: 45,
    bankName: 'Vietcombank CN Tân Bình',
    bankAccountMasked: '•••• 8891',
    totalPayableVnd: 245_000_000,
    leadTimeDaysAvg: 5,
    contractRef: 'HĐ-KK-2025-MN-01',
    certifications: 'FSC CoC (mock)',
    isActive: true,
    note: 'Ưu tiên thanh toán cuối tháng',
    createdAt: '2024-06-01',
  },
  {
    code: 'NCC-2025-002',
    legalName: 'TNHH An Phát Deco',
    shortName: 'An Phát Deco',
    taxCode: '0311223344',
    phone: '028 3912 4567',
    email: 'sales@anphatdeco.vn',
    city: 'TP.HCM',
    address: 'Quận 12',
    tier: 'approved',
    paymentTermDays: 30,
    bankName: 'Techcombank',
    bankAccountMasked: '•••• 1023',
    totalPayableVnd: 62_400_000,
    leadTimeDaysAvg: 7,
    contractRef: 'HĐ-KK-2024-AP-03',
    certifications: '—',
    isActive: true,
    note: '',
    createdAt: '2024-08-15',
  },
  {
    code: 'NCC-2024-018',
    legalName: 'Blum Việt Nam Co., Ltd.',
    shortName: 'Blum VN',
    taxCode: '0301567890',
    phone: '028 5410 9999',
    email: 'orders.vn@blum.com',
    city: 'Bình Dương',
    address: 'VSIP II',
    tier: 'strategic',
    paymentTermDays: 60,
    bankName: 'HSBC VN',
    bankAccountMasked: '•••• 5566',
    totalPayableVnd: 890_000_000,
    leadTimeDaysAvg: 21,
    contractRef: 'FRAME-2023-BLUM',
    certifications: 'ISO 9001',
    isActive: true,
    note: 'Nhập khẩu — lead time theo lô',
    createdAt: '2023-11-01',
  },
  {
    code: 'NCC-2024-022',
    legalName: 'Häfele Vietnam Trading',
    shortName: 'Häfele HCMC',
    taxCode: '0314455667',
    phone: '028 3825 7788',
    email: 'b2b@haefele.vn',
    city: 'TP.HCM',
    address: 'Q.7',
    tier: 'strategic',
    paymentTermDays: 45,
    bankName: 'SCB',
    bankAccountMasked: '•••• 3344',
    totalPayableVnd: 412_000_000,
    leadTimeDaysAvg: 14,
    contractRef: 'HĐ-HF-2025-Q1',
    certifications: '—',
    isActive: true,
    note: '',
    createdAt: '2024-01-10',
  },
  {
    code: 'NCC-2025-006',
    legalName: 'Công ty CP Nhựa Đông Á',
    shortName: 'Nhựa Đông Á',
    taxCode: '3600788990',
    phone: '0274 3555 666',
    email: 'kd@nhuadonga.vn',
    city: 'Đồng Nai',
    address: 'Long Thành',
    tier: 'approved',
    paymentTermDays: 30,
    bankName: 'BIDV',
    bankAccountMasked: '•••• 7722',
    totalPayableVnd: 128_000_000,
    leadTimeDaysAvg: 4,
    contractRef: 'DA-2025-PVC',
    certifications: 'RoHS (mock)',
    isActive: true,
    note: '',
    createdAt: '2025-02-20',
  },
  {
    code: 'NCC-2025-007',
    legalName: 'Kính Hải Long Glass',
    shortName: 'Kính Hải Long',
    taxCode: '0308877665',
    phone: '028 3722 1100',
    email: 'order@hailongglass.vn',
    city: 'TP.HCM',
    address: 'Q.Bình Tân',
    tier: 'approved',
    paymentTermDays: 21,
    bankName: 'MB Bank',
    bankAccountMasked: '•••• 1199',
    totalPayableVnd: 56_700_000,
    leadTimeDaysAvg: 10,
    contractRef: 'KL-2025-GL',
    certifications: '—',
    isActive: true,
    note: 'Cắt kính theo bản vẽ — kiểm tra độ dày',
    createdAt: '2024-09-01',
  },
  {
    code: 'NCC-2025-008',
    legalName: 'Hóa chất Tường Phát',
    shortName: 'Hóa chất Tường Phát',
    taxCode: '0305544332',
    phone: '028 3888 9900',
    email: 'tp@tuongphatchem.vn',
    city: 'TP.HCM',
    address: 'Q.12',
    tier: 'watch',
    paymentTermDays: 15,
    bankName: 'ACB',
    bankAccountMasked: '•••• 4455',
    totalPayableVnd: 18_200_000,
    leadTimeDaysAvg: 3,
    contractRef: 'TP-CHEM-24',
    certifications: '—',
    isActive: true,
    note: 'Theo dõi giao hàng đúng SDS',
    createdAt: '2025-03-01',
  },
  {
    code: 'NCC-2025-009',
    legalName: 'Akzo Nobel Paints Vietnam (demo)',
    shortName: 'Akzo demo',
    taxCode: '0300112233',
    phone: '028 3911 2200',
    email: 'vn.sales@akzonobel.com',
    city: 'TP.HCM',
    address: 'Q.Thủ Đức',
    tier: 'approved',
    paymentTermDays: 30,
    bankName: 'Citibank VN',
    bankAccountMasked: '•••• 6677',
    totalPayableVnd: 95_000_000,
    leadTimeDaysAvg: 7,
    contractRef: 'AKZO-2025-DEMO',
    certifications: '—',
    isActive: true,
    note: '',
    createdAt: '2024-11-01',
  },
  {
    code: 'NCC-2025-010',
    legalName: 'Bao bì Tín Phát',
    shortName: 'Bao bì Tín Phát',
    taxCode: '0319988776',
    phone: '0274 3999 001',
    email: 'info@tinphatpack.vn',
    city: 'Bình Dương',
    address: 'Dĩ An',
    tier: 'approved',
    paymentTermDays: 21,
    bankName: 'VietinBank',
    bankAccountMasked: '•••• 2288',
    totalPayableVnd: 12_500_000,
    leadTimeDaysAvg: 5,
    contractRef: 'BB-TP-2025',
    certifications: '—',
    isActive: true,
    note: '',
    createdAt: '2025-01-05',
  },
  {
    code: 'NCC-INT-001',
    legalName: 'Kho tồn nội bộ TUNHUA',
    shortName: 'Kho tồn',
    taxCode: '0000000000',
    phone: '—',
    email: 'kho@tunhua.internal',
    city: 'TP.HCM',
    address: 'Kho trung tâm',
    tier: 'watch',
    paymentTermDays: 0,
    bankName: '—',
    bankAccountMasked: '—',
    totalPayableVnd: 0,
    leadTimeDaysAvg: 1,
    contractRef: 'Nội bộ',
    certifications: '—',
    isActive: true,
    note: 'Điều chuyển nội bộ — không phát sinh AP',
    createdAt: '2024-01-01',
  },
]

export const MOCK_SUPPLIERS: Supplier[] = SEED.map((row, i) => ({
  ...row,
  id: `sup-${i + 1}`,
}))
