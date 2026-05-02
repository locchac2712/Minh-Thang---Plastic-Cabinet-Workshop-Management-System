/**
 * Lệnh Make-to-Stock — PRODUCTION_TASKS không gắn ORDERS (order_id null).
 * Đồng bộ nghiệp vụ DIR-P04 / Director MTS; xưởng xem và cập nhật tiến độ.
 */

export type ProductionInternalTaskStatus = 'waiting' | 'doing' | 'done'

export type ProductionInternalPurpose = 'seasonal' | 'buffer' | 'recovery' | 'other'

export type ProductionInternalTaskRow = {
  id: string
  taskCode: string
  productId: string
  sku: string
  productName: string
  qty: number
  assignedToId: string
  assignedToName: string
  workcenter: string
  expectedEndDate: string
  status: ProductionInternalTaskStatus
  createdAt: string
  purpose: ProductionInternalPurpose
  /** Ghi chú nội bộ (mock) */
  note: string
}

const ROWS: ProductionInternalTaskRow[] = [
  {
    id: 'mts-int-1',
    taskCode: 'MTS-202504-006',
    productId: '4',
    sku: 'TQA-001',
    productName: 'Tủ Quần Áo 4 Cánh Swing',
    qty: 5,
    assignedToId: 'usr-prod-1',
    assignedToName: 'Phạm Văn Thọ',
    workcenter: 'Chuyền ráp 2',
    expectedEndDate: '2026-04-18',
    status: 'doing',
    createdAt: '2026-04-08',
    purpose: 'seasonal',
    note: 'Ưu tiên màu trắng — dán nhãn kho MTS-A sau QC.',
  },
  {
    id: 'mts-int-2',
    taskCode: 'MTS-202504-005',
    productId: '9',
    sku: 'TTV-001',
    productName: 'Kệ TV Floating 1m8',
    qty: 8,
    assignedToId: 'usr-prod-4',
    assignedToName: 'Nguyễn Hữu Tài',
    workcenter: 'Chuyền ráp 1',
    expectedEndDate: '2026-04-15',
    status: 'waiting',
    createdAt: '2026-04-07',
    purpose: 'buffer',
    note: 'Dự trữ bán NVBH — không gắn đơn cụ thể.',
  },
  {
    id: 'mts-int-3',
    taskCode: 'MTS-202504-004',
    productId: '7',
    sku: 'BTD-001',
    productName: 'Bàn Trang Điểm Princess',
    qty: 3,
    assignedToId: 'usr-prod-2',
    assignedToName: 'Lê Thị Mai',
    workcenter: 'Dán cạnh 1',
    expectedEndDate: '2026-04-12',
    status: 'done',
    createdAt: '2026-04-01',
    purpose: 'recovery',
    note: 'Thu hồi vốn từ đơn hủy — hoàn tất chờ nhập kho TP.',
  },
  {
    id: 'mts-int-4',
    taskCode: 'MTS-202504-003',
    productId: '1',
    sku: 'KB-001',
    productName: 'Tủ Bếp Chữ L Classic',
    qty: 2,
    assignedToId: 'usr-prod-3',
    assignedToName: 'Hoàng Minh Tuấn',
    workcenter: 'CNC A',
    expectedEndDate: '2026-04-22',
    status: 'waiting',
    createdAt: '2026-04-09',
    purpose: 'seasonal',
    note: 'Chạy mùa lễ — bộ cánh đã về kho phụ kiện.',
  },
  {
    id: 'mts-int-5',
    taskCode: 'MTS-202504-002',
    productId: '14',
    sku: 'BLV-001',
    productName: 'Bàn Làm Việc Gaming Pro',
    qty: 6,
    assignedToId: 'usr-prod-1',
    assignedToName: 'Phạm Văn Thọ',
    workcenter: 'Chuyền ráp 2',
    expectedEndDate: '2026-04-20',
    status: 'doing',
    createdAt: '2026-04-05',
    purpose: 'other',
    note: 'Theo chỉ đạo GD — không map đơn NVBH.',
  },
]

export const PRODUCTION_INTERNAL_TASK_ROWS: ProductionInternalTaskRow[] = ROWS

export function getProductionInternalTaskById(id: string): ProductionInternalTaskRow | undefined {
  return PRODUCTION_INTERNAL_TASK_ROWS.find((r) => r.id === id)
}

export function internalStatusLabel(s: ProductionInternalTaskStatus): string {
  const m: Record<ProductionInternalTaskStatus, string> = {
    waiting: 'Chờ nhận',
    doing: 'Đang làm',
    done: 'Hoàn tất — chờ nhập kho TP',
  }
  return m[s]
}

export function internalPurposeLabel(p: ProductionInternalPurpose): string {
  const m: Record<ProductionInternalPurpose, string> = {
    seasonal: 'Mùa lễ / chiến dịch',
    buffer: 'Dự trữ bán',
    recovery: 'Thu hồi vốn',
    other: 'Khác',
  }
  return m[p]
}
