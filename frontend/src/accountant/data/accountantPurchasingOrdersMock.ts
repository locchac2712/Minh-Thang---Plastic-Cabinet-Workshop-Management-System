/**
 * Đơn mua hàng (PO) — góc kế toán / mua hàng (mock).
 * API sau: GET /accountant/purchasing/orders, GET .../:id/lines
 */

export type AccountantPoStatus =
  | 'draft'
  | 'awaiting_supplier'
  | 'confirmed'
  | 'partial'
  | 'completed'
  | 'cancelled'

export type AccountantPoLine = {
  lineNo: number
  sku: string
  name: string
  qty: number
  uom: string
  unitPriceVnd: number
  lineTotalVnd: number
}

export type AccountantPurchaseOrderRow = {
  id: string
  poNumber: string
  supplierCode: string
  supplierName: string
  orderDate: string
  expectedDeliveryDate: string
  lineCount: number
  totalVnd: number
  /** Tỷ lệ nhận hàng ước (0–100) */
  receivedPct: number
  status: AccountantPoStatus
  createdBy: string
  note?: string
  lines: AccountantPoLine[]
}

export function poStatusLabel(s: AccountantPoStatus): string {
  const m: Record<AccountantPoStatus, string> = {
    draft: 'Nháp',
    awaiting_supplier: 'Đã gửi — chờ NCC',
    confirmed: 'NCC xác nhận',
    partial: 'Nhận một phần',
    completed: 'Đã nhận đủ',
    cancelled: 'Đã hủy',
  }
  return m[s]
}

const ROWS: AccountantPurchaseOrderRow[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-01842',
    supplierCode: 'NCC-VL-01',
    supplierName: 'TNHH Ván An Phát',
    orderDate: '2026-04-10',
    expectedDeliveryDate: '2026-04-17',
    lineCount: 3,
    totalVnd: 110_600_000,
    receivedPct: 0,
    status: 'awaiting_supplier',
    createdBy: 'Nguyễn Mua Hàng',
    note: 'Ưu tiên giao sáng — phục vụ lệnh SX tuần 16.',
    lines: [
      {
        lineNo: 1,
        sku: 'VL-MDF-18',
        name: 'MDF melamine trắng 18mm',
        qty: 120,
        uom: 'tấm',
        unitPriceVnd: 420_000,
        lineTotalVnd: 50_400_000,
      },
      {
        lineNo: 2,
        sku: 'VL-HDF-16',
        name: 'HDF chống ẩm 16mm',
        qty: 80,
        uom: 'tấm',
        unitPriceVnd: 385_000,
        lineTotalVnd: 30_800_000,
      },
      {
        lineNo: 3,
        sku: 'PVC-2-SOI',
        name: 'Cuộn PVC 2mm vân sồi',
        qty: 14,
        uom: 'cuộn',
        unitPriceVnd: 2_100_000,
        lineTotalVnd: 29_400_000,
      },
    ],
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-01831',
    supplierCode: 'NCC-PK-02',
    supplierName: 'Blum Việt Nam (Đại lý)',
    orderDate: '2026-04-08',
    expectedDeliveryDate: '2026-04-22',
    lineCount: 2,
    totalVnd: 52_800_000,
    receivedPct: 40,
    status: 'partial',
    createdBy: 'Trần Thu Mua',
    lines: [
      {
        lineNo: 1,
        sku: 'PK-BLUM-TAND',
        name: 'Ray tủ Blum Tandem',
        qty: 40,
        uom: 'bộ',
        unitPriceVnd: 920_000,
        lineTotalVnd: 36_800_000,
      },
      {
        lineNo: 2,
        sku: 'BAN-LE-BLUM',
        name: 'Bản lề Blum clip top',
        qty: 200,
        uom: 'cái',
        unitPriceVnd: 80_000,
        lineTotalVnd: 16_000_000,
      },
    ],
  },
  {
    id: 'po-3',
    poNumber: 'PO-2026-01805',
    supplierCode: 'NCC-HC-03',
    supplierName: 'Hóa chất Tín Phát',
    orderDate: '2026-04-05',
    expectedDeliveryDate: '2026-04-12',
    lineCount: 1,
    totalVnd: 5_625_000,
    receivedPct: 100,
    status: 'completed',
    createdBy: 'Nguyễn Mua Hàng',
    lines: [
      {
        lineNo: 1,
        sku: 'AC-KEO-PU',
        name: 'Keo dán cạnh PU',
        qty: 45,
        uom: 'kg',
        unitPriceVnd: 125_000,
        lineTotalVnd: 5_625_000,
      },
    ],
  },
  {
    id: 'po-4',
    poNumber: 'PO-2026-01788',
    supplierCode: 'NCC-KL-04',
    supplierName: 'Kính Hải Long',
    orderDate: '2026-04-02',
    expectedDeliveryDate: '2026-04-20',
    lineCount: 2,
    totalVnd: 74_000_000,
    receivedPct: 0,
    status: 'confirmed',
    createdBy: 'Lê Thảo Chi',
    lines: [
      {
        lineNo: 1,
        sku: 'AC-ACR-W',
        name: 'Acrylic trắng 8mm',
        qty: 28,
        uom: 'tấm',
        unitPriceVnd: 1_850_000,
        lineTotalVnd: 51_800_000,
      },
      {
        lineNo: 2,
        sku: 'K-CR-05',
        name: 'Kính cường lực 5mm cắt theo list',
        qty: 42,
        uom: 'm²',
        unitPriceVnd: 528_571,
        lineTotalVnd: 22_200_000,
      },
    ],
  },
  {
    id: 'po-5',
    poNumber: 'PO-2026-01765',
    supplierCode: 'NCC-VL-01',
    supplierName: 'TNHH Ván An Phát',
    orderDate: '2026-04-01',
    expectedDeliveryDate: '2026-04-08',
    lineCount: 1,
    totalVnd: 25_200_000,
    receivedPct: 0,
    status: 'draft',
    createdBy: 'Trần Thu Mua',
    note: 'Chờ duyệt giá cuối từ Giám đốc.',
    lines: [
      {
        lineNo: 1,
        sku: 'VL-MDF-18',
        name: 'MDF melamine trắng 18mm',
        qty: 60,
        uom: 'tấm',
        unitPriceVnd: 420_000,
        lineTotalVnd: 25_200_000,
      },
    ],
  },
  {
    id: 'po-6',
    poNumber: 'PO-2026-01740',
    supplierCode: 'NCC-PK-05',
    supplierName: 'Thép Thống Nhất',
    orderDate: '2026-03-28',
    expectedDeliveryDate: '2026-04-05',
    lineCount: 1,
    totalVnd: 8_400_000,
    receivedPct: 0,
    status: 'cancelled',
    createdBy: 'Nguyễn Mua Hàng',
    note: 'NCC không đủ hàng — chuyển sang PO khác.',
    lines: [
      {
        lineNo: 1,
        sku: 'VIT-INOX-40',
        name: 'Vít bắn tủ inox 4.0×16 (hộp)',
        qty: 200,
        uom: 'hộp',
        unitPriceVnd: 42_000,
        lineTotalVnd: 8_400_000,
      },
    ],
  },
]

export const ACCOUNTANT_PURCHASE_ORDERS: AccountantPurchaseOrderRow[] = ROWS
