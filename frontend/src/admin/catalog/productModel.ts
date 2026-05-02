/**
 * Mô hình sản phẩm (danh mục thành phẩm) — dùng chung list + form tạo/sửa.
 */

export type ProductStatus = 'active' | 'draft' | 'discontinued'

export type Product = {
  id: string
  sku: string
  name: string
  categoryId: string
  /** HTML từ rich text editor hoặc text thuần (dữ liệu cũ) */
  description: string
  price: number
  material: string
  status: ProductStatus
  imageUrl: string
}

export const CATEGORY_OPTIONS = [
  { id: 'kb', label: 'Tủ Bếp' },
  { id: 'tqa', label: 'Tủ Quần Áo' },
  { id: 'btd', label: 'Bàn Trang Điểm' },
  { id: 'ttv', label: 'Tủ TV' },
  { id: 'kg', label: 'Tủ Góc' },
  { id: 'tpn', label: 'Tủ Phòng Ngủ' },
  { id: 'blv', label: 'Bàn Làm Việc' },
  { id: 'da', label: 'Tủ Đa Năng' },
  { id: 'te', label: 'Tủ Trẻ Em' },
] as const

export const FILTER_CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: '', label: 'Tất cả' },
  ...CATEGORY_OPTIONS,
]

export const MATERIAL_OPTIONS = [
  'MDF Phủ Melamine',
  'Gỗ Sồi Tự Nhiên',
  'Acrylic Bóng',
  'HDF Chống Ẩm',
  'Gỗ Óc Chó',
  'Nhựa PVC',
] as const

export const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: 'active', label: 'Đang bán' },
  { value: 'draft', label: 'Nháp' },
  { value: 'discontinued', label: 'Ngừng bán' },
]

export const PAGE_SIZE_OPTIONS = [10, 15, 20, 50] as const

export const DEFAULT_PRODUCT_IMAGE_URL =
  'https://noithathaiminh.com.vn/public/anh1/images/2012/12/tu-quan-ao-nhua-dai-loan-01.jpg'

type ProductSeed = Omit<Product, 'id' | 'imageUrl'>

const SEED: ProductSeed[] = [
  { sku: 'KB-001', name: 'Tủ Bếp Chữ L Classic', categoryId: 'kb', description: 'Hệ tủ bếp chữ L kết hợp tủ trên dưới, cánh lùa mờ', price: 18500000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'KB-002', name: 'Tủ Bếp Đảo Luxury', categoryId: 'kb', description: 'Tủ bếp đảo trung tâm phong cách châu Âu', price: 32000000, material: 'Acrylic Bóng', status: 'active' },
  { sku: 'KB-003', name: 'Tủ Bếp Mini Studio', categoryId: 'kb', description: 'Phù hợp căn hộ nhỏ dưới 50m²', price: 9800000, material: 'HDF Chống Ẩm', status: 'active' },
  { sku: 'TQA-001', name: 'Tủ Quần Áo 4 Cánh Swing', categoryId: 'tqa', description: 'Tủ 4 cánh mở, gương toàn thân, ngăn kéo bên trong', price: 14200000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'TQA-002', name: 'Tủ Âm Tường Walk-in', categoryId: 'tqa', description: 'Hệ tủ âm tường toàn phòng walk-in closet', price: 45000000, material: 'Gỗ Sồi Tự Nhiên', status: 'active' },
  { sku: 'TQA-003', name: 'Tủ Cánh Lùa Compact', categoryId: 'tqa', description: 'Cánh lùa tiết kiệm diện tích', price: 8600000, material: 'HDF Chống Ẩm', status: 'draft' },
  { sku: 'BTD-001', name: 'Bàn Trang Điểm Princess', categoryId: 'btd', description: 'Bàn trang điểm đèn LED viền gương, 6 ngăn kéo', price: 6800000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'BTD-002', name: 'Bàn Trang Điểm Minimalist', categoryId: 'btd', description: 'Tone trắng/đen tối giản, gương không viền', price: 4200000, material: 'Acrylic Bóng', status: 'active' },
  { sku: 'TTV-001', name: 'Kệ TV Floating 1m8', categoryId: 'ttv', description: 'Kệ nổi 1800mm, khoang lưới thông thoáng', price: 5500000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'TTV-002', name: 'Tủ TV Phòng Khách Premium', categoryId: 'ttv', description: 'Tổ hợp kệ TV + tủ kính + thanh treo', price: 12800000, material: 'Gỗ Óc Chó', status: 'active' },
  { sku: 'TTV-003', name: 'Kệ TV Góc 90°', categoryId: 'ttv', description: 'Kệ TV bố trí góc tường tiết kiệm diện tích', price: 4100000, material: 'MDF Phủ Melamine', status: 'discontinued' },
  { sku: 'TPN-001', name: 'Tủ Đầu Giường Đôi', categoryId: 'tpn', description: 'Bộ 2 tủ đầu giường, ngăn kéo ẩn', price: 3800000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'TPN-002', name: 'Tủ Thấp Phòng Ngủ Master', categoryId: 'tpn', description: 'Hệ tủ thấp 6 cánh, ngăn kéo đôi', price: 11600000, material: 'Gỗ Sồi Tự Nhiên', status: 'active' },
  { sku: 'BLV-001', name: 'Bàn Làm Việc Gaming Pro', categoryId: 'blv', description: 'Bàn gaming rộng 1600mm, hộc tủ bánh xe', price: 7200000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'BLV-002', name: 'Bàn Làm Việc HomeOffice', categoryId: 'blv', description: 'Gọn nhẹ, phù hợp làm việc tại nhà', price: 3200000, material: 'HDF Chống Ẩm', status: 'active' },
  { sku: 'BLV-003', name: 'Bàn Đứng Điều Chỉnh Chiều Cao', categoryId: 'blv', description: 'Standing desk điện, nhớ 3 vị trí', price: 9900000, material: 'Gỗ Sồi Tự Nhiên', status: 'draft' },
  { sku: 'DA-001', name: 'Hệ Tủ Đa Năng Module 6 Ô', categoryId: 'da', description: 'Tủ module lắp ghép tự do 6 ô, tùy biến cao', price: 7800000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'DA-002', name: 'Tủ Đa Năng Phòng Đọc Sách', categoryId: 'da', description: 'Kết hợp kệ sách + tủ hồ sơ + góc đọc', price: 15500000, material: 'Gỗ Sồi Tự Nhiên', status: 'active' },
  { sku: 'TE-001', name: 'Tủ Trẻ Em Rainbow', categoryId: 'te', description: 'Màu sắc rực rỡ, bo tròn an toàn, chứa đồ chơi', price: 4600000, material: 'MDF Phủ Melamine', status: 'active' },
  { sku: 'TE-002', name: 'Hệ Tủ Phòng Bé Full-set', categoryId: 'te', description: 'Gồm tủ quần áo + kệ sách + bàn học', price: 16800000, material: 'HDF Chống Ẩm', status: 'active' },
  { sku: 'KB-004', name: 'Tủ Bếp Kính Cường Lực', categoryId: 'kb', description: 'Tủ treo cánh kính, hiển thị đồ trang trí', price: 13400000, material: 'Acrylic Bóng', status: 'draft' },
  { sku: 'KG-001', name: 'Tủ Góc Lazy Susan', categoryId: 'kg', description: 'Mâm xoay Lazy Susan tích hợp, tối ưu góc chết', price: 8200000, material: 'MDF Phủ Melamine', status: 'active' },
]

export const MOCK_PRODUCTS: Product[] = SEED.map((s, i) => ({
  id: String(i + 1),
  imageUrl: DEFAULT_PRODUCT_IMAGE_URL,
  ...s,
}))

export function categoryLabel(id: string): string {
  return CATEGORY_OPTIONS.find((c) => c.id === id)?.label ?? id
}

export function formatVND(n: number): string {
  return n.toLocaleString('vi-VN') + '₫'
}

/** Chuẩn hoá HTML → text (tìm kiếm, preview) */
export function htmlToPlainText(html: string): string {
  if (!html.trim()) return ''
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const d = document.createElement('div')
  d.innerHTML = html
  return (d.textContent || '').replace(/\s+/g, ' ').trim()
}

export function looksLikeHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s)
}
