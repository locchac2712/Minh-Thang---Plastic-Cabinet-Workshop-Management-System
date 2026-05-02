/**
 * Danh mục vật tư (nguyên vật liệu & phụ kiện) — mock cho màn hình Materials.
 */

import { DEFAULT_PRODUCT_IMAGE_URL } from '../catalog/productModel'

/** Ảnh mặc định khi chưa có URL (dùng chung catalog) */
export { DEFAULT_PRODUCT_IMAGE_URL as DEFAULT_MATERIAL_IMAGE_URL }

export type MaterialGroupId =
  | 'go_mdf'
  | 'phu_kien'
  | 'nhua'
  | 'kinh'
  | 'son_dan'
  | 'dong_goi'

export type MaterialStatus = 'active' | 'discontinued'

export type Material = {
  id: string
  /** Mã nội bộ / ERP */
  sku: string
  name: string
  /** Đơn vị tính */
  unit: string
  groupId: MaterialGroupId
  /** Tồn kho khả dụng (mock) */
  stockOnHand: number
  /** Ngưỡng cảnh báo */
  minStock: number
  /** Thời gian cấp hàng (ngày) */
  leadTimeDays: number
  /** Nhà cung cấp chính */
  primarySupplier: string
  /** Ảnh minh họa / catalogue */
  imageUrl: string
  note: string
  status: MaterialStatus
}

export const MATERIAL_GROUP_OPTIONS: { id: MaterialGroupId; label: string }[] = [
  { id: 'go_mdf', label: 'Gỗ & MDF' },
  { id: 'phu_kien', label: 'Phụ kiện tủ' },
  { id: 'nhua', label: 'Nhựa & PVC' },
  { id: 'kinh', label: 'Kính & gương' },
  { id: 'son_dan', label: 'Sơn & dán' },
  { id: 'dong_goi', label: 'Đóng gói' },
]

export const FILTER_MATERIAL_GROUP_OPTIONS: { id: string; label: string }[] = [
  { id: '', label: 'Tất cả nhóm' },
  ...MATERIAL_GROUP_OPTIONS,
]

export const UNIT_OPTIONS = [
  'm²',
  'm',
  'm³',
  'tấm',
  'Cái',
  'cái',
  'bộ',
  'kg',
  'lít',
  'cuộn',
] as const

export const MATERIAL_STATUS_OPTIONS: { value: MaterialStatus; label: string }[] = [
  { value: 'active', label: 'Đang dùng' },
  { value: 'discontinued', label: 'Ngưng' },
]

export function groupLabel(groupId: MaterialGroupId): string {
  return MATERIAL_GROUP_OPTIONS.find((g) => g.id === groupId)?.label ?? groupId
}

export function isLowStock(m: Pick<Material, 'stockOnHand' | 'minStock'>): boolean {
  return m.stockOnHand <= m.minStock
}

export function formatQty(n: number, unit: string): string {
  const s = Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, '')
  return `${s} ${unit}`
}

const SEED: Omit<Material, 'id' | 'imageUrl'>[] = [
  {
    sku: 'VL-MDF18',
    name: 'MDF chống ẩm 18mm',
    unit: 'm²',
    groupId: 'go_mdf',
    stockOnHand: 420,
    minStock: 80,
    leadTimeDays: 5,
    primarySupplier: 'Gỗ Minh An',
    note: 'Tiêu chuẩn CARB P2',
    status: 'active',
  },
  {
    sku: 'VL-HDF12',
    name: 'HDF lõi xanh 12mm',
    unit: 'm²',
    groupId: 'go_mdf',
    stockOnHand: 55,
    minStock: 60,
    leadTimeDays: 7,
    primarySupplier: 'Gỗ Minh An',
    note: '',
    status: 'active',
  },
  {
    sku: 'VL-MEL-W',
    name: 'Melamine trắng trơn',
    unit: 'm²',
    groupId: 'son_dan',
    stockOnHand: 310,
    minStock: 100,
    leadTimeDays: 4,
    primarySupplier: 'An Phát Deco',
    note: 'Màu W980 trắng',
    status: 'active',
  },
  {
    sku: 'PK-BLUM-CLIP',
    name: 'Bản lề Blum Clip top',
    unit: 'cái',
    groupId: 'phu_kien',
    stockOnHand: 2400,
    minStock: 400,
    leadTimeDays: 21,
    primarySupplier: 'Blum VN',
    note: '110° overlay tiêu chuẩn',
    status: 'active',
  },
  {
    sku: 'PK-TANDEM',
    name: 'Ray ngăn kéo Tandem',
    unit: 'bộ',
    groupId: 'phu_kien',
    stockOnHand: 180,
    minStock: 40,
    leadTimeDays: 14,
    primarySupplier: 'Blum VN',
    note: '450mm soft-close',
    status: 'active',
  },
  {
    sku: 'PK-TAY-NAM',
    name: 'Tay nắm âm nhôm 128mm',
    unit: 'cái',
    groupId: 'phu_kien',
    stockOnHand: 890,
    minStock: 200,
    leadTimeDays: 10,
    primarySupplier: 'Häfele HCMC',
    note: '',
    status: 'active',
  },
  {
    sku: 'NH-PVC-08',
    name: 'Phủ PVC cánh 0.8mm',
    unit: 'm²',
    groupId: 'nhua',
    stockOnHand: 12,
    minStock: 30,
    leadTimeDays: 12,
    primarySupplier: 'Nhựa Đông Á',
    note: 'Cảnh báo tồn thấp',
    status: 'active',
  },
  {
    sku: 'NH-ABS-2',
    name: 'Dải ABS cạnh 2mm',
    unit: 'cuộn',
    groupId: 'nhua',
    stockOnHand: 45,
    minStock: 15,
    leadTimeDays: 8,
    primarySupplier: 'Nhựa Đông Á',
    note: '',
    status: 'active',
  },
  {
    sku: 'KN-CUONG-5',
    name: 'Kính cường lực 5mm',
    unit: 'm²',
    groupId: 'kinh',
    stockOnHand: 28,
    minStock: 20,
    leadTimeDays: 6,
    primarySupplier: 'Kính Hải Long',
    note: 'Cắt theo bản vẽ',
    status: 'active',
  },
  {
    sku: 'KN-GUONG-4',
    name: 'Gương tráng bạc 4mm',
    unit: 'm²',
    groupId: 'kinh',
    stockOnHand: 8,
    minStock: 15,
    leadTimeDays: 9,
    primarySupplier: 'Kính Hải Long',
    note: '',
    status: 'active',
  },
  {
    sku: 'SD-KEO-EVA',
    name: 'Keo dán cạnh EVA trắng',
    unit: 'kg',
    groupId: 'son_dan',
    stockOnHand: 120,
    minStock: 25,
    leadTimeDays: 3,
    primarySupplier: 'Hóa chất Tường Phát',
    note: '',
    status: 'active',
  },
  {
    sku: 'SD-PU-MAT',
    name: 'Sơn PU mờ 2 thành phần',
    unit: 'lít',
    groupId: 'son_dan',
    stockOnHand: 65,
    minStock: 20,
    leadTimeDays: 5,
    primarySupplier: 'Akzo demo',
    note: 'Màu theo Pantone',
    status: 'active',
  },
  {
    sku: 'DG-XOP-3',
    name: 'Xốp góc 3 lớp',
    unit: 'cuộn',
    groupId: 'dong_goi',
    stockOnHand: 200,
    minStock: 40,
    leadTimeDays: 2,
    primarySupplier: 'Bao bì Tín Phát',
    note: '',
    status: 'active',
  },
  {
    sku: 'DG-THUNG-5L',
    name: 'Thùng carton 5 lớp',
    unit: 'cái',
    groupId: 'dong_goi',
    stockOnHand: 400,
    minStock: 80,
    leadTimeDays: 2,
    primarySupplier: 'Bao bì Tín Phát',
    note: 'Kích thước chuẩn pallet',
    status: 'active',
  },
  {
    sku: 'VL-MDF25',
    name: 'MDF thường 25mm',
    unit: 'm²',
    groupId: 'go_mdf',
    stockOnHand: 0,
    minStock: 20,
    leadTimeDays: 6,
    primarySupplier: 'Gỗ Minh An',
    note: 'Ngưng dần — thay bằng MDF18',
    status: 'discontinued',
  },
  {
    sku: 'PK-RAY-AM-CU',
    name: 'Ray âm sắt (thế hệ cũ)',
    unit: 'bộ',
    groupId: 'phu_kien',
    stockOnHand: 15,
    minStock: 0,
    leadTimeDays: 30,
    primarySupplier: 'Kho tồn',
    note: 'Không nhập thêm',
    status: 'discontinued',
  },
]

export const MOCK_MATERIALS: Material[] = SEED.map((row, i) => ({
  ...row,
  id: `mat-${i + 1}`,
  /** Ảnh mock cố định theo seed (Picsum) — API thật có thể thay bằng URL kho */
  imageUrl: `https://picsum.photos/seed/tunhua-mat-${i + 1}/120/120`,
}))
