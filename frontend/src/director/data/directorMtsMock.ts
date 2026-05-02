/**
 * Lệnh Make-to-Stock — DIR-P04: PRODUCTION_TASKS không gắn ORDERS (order_id null).
 * Hoàn tất → nhập kho thành phẩm PRODUCT_INVENTORY_LOGS (PRO-T04) — documents/usecase/production.md
 * API: POST /api/director/internal-tasks — body { assigned_to, product_id, expected_end_date } — documents/api/director.md
 * Số lượng lô: mở rộng nghiệp vụ (sidebar: “Làm 5 cái…”), gửi kèm trong payload thực tế.
 */

export type DirectorMtsAssignee = {
  id: string
  name: string
  workcenter: string
}

/** Tổ trưởng / PIC xưởng (USERS.role = Production) — mock */
export const DIRECTOR_MTS_ASSIGNEES: DirectorMtsAssignee[] = [
  { id: 'usr-prod-1', name: 'Phạm Văn Thọ', workcenter: 'Chuyền ráp 2' },
  { id: 'usr-prod-2', name: 'Lê Thị Mai', workcenter: 'Dán cạnh 1' },
  { id: 'usr-prod-3', name: 'Hoàng Minh Tuấn', workcenter: 'CNC A' },
  { id: 'usr-prod-4', name: 'Nguyễn Hữu Tài', workcenter: 'Chuyền ráp 1' },
]

export type DirectorMtsTaskStatus = 'waiting' | 'doing' | 'done'

export type DirectorMtsTaskRow = {
  id: string
  taskCode: string
  productId: string
  sku: string
  productName: string
  qty: number
  assignedToId: string
  assignedToName: string
  expectedEndDate: string
  status: DirectorMtsTaskStatus
  createdAt: string
}

const ROWS: DirectorMtsTaskRow[] = [
  {
    id: 'mts-1',
    taskCode: 'MTS-202504-003',
    productId: '4',
    sku: 'TQA-001',
    productName: 'Tủ Quần Áo 4 Cánh Swing',
    qty: 5,
    assignedToId: 'usr-prod-1',
    assignedToName: 'Phạm Văn Thọ',
    expectedEndDate: '2025-04-18',
    status: 'doing',
    createdAt: '2025-04-08',
  },
  {
    id: 'mts-2',
    taskCode: 'MTS-202504-002',
    productId: '9',
    sku: 'TTV-001',
    productName: 'Kệ TV Floating 1m8',
    qty: 8,
    assignedToId: 'usr-prod-4',
    assignedToName: 'Nguyễn Hữu Tài',
    expectedEndDate: '2025-04-15',
    status: 'waiting',
    createdAt: '2025-04-07',
  },
  {
    id: 'mts-3',
    taskCode: 'MTS-202504-001',
    productId: '7',
    sku: 'BTD-001',
    productName: 'Bàn Trang Điểm Princess',
    qty: 3,
    assignedToId: 'usr-prod-2',
    assignedToName: 'Lê Thị Mai',
    expectedEndDate: '2025-04-12',
    status: 'done',
    createdAt: '2025-04-01',
  },
]

export const DIRECTOR_MTS_RECENT_TASKS: DirectorMtsTaskRow[] = ROWS

export function statusLabel(s: DirectorMtsTaskStatus): string {
  const m: Record<DirectorMtsTaskStatus, string> = {
    waiting: 'Chờ nhận',
    doing: 'Đang làm',
    done: 'Hoàn tất — chờ nhập kho TP',
  }
  return m[s]
}
