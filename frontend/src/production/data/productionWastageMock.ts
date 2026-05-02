/**
 * Yêu cầu xuất kho bổ sung do waste — sau khi đã xuất vật tư theo BOM cho lệnh SX.
 * Luồng: phát sinh hư hỏng / hao phí → ghi nhận → duyệt → xuất bổ sung (INVENTORY_ISSUE_SUPPLEMENT) — mock.
 */
import { PRODUCTION_INTERNAL_TASK_ROWS } from './productionTasksInternalMock'
import { PRODUCTION_TASKS_BY_ORDER_ROWS } from './productionTasksByOrderMock'

export type ProductionWastageTaskKind = 'by_order' | 'internal'

export type ProductionWastageRequestStatus =
  | 'pending_approval'
  | 'approved'
  | 'issued'
  | 'rejected'

export type ProductionWastageReasonCategory =
  | 'cut_nesting'
  | 'handling'
  | 'machine'
  | 'supplier_defect'
  | 'other'

export type ProductionWastageRequestRow = {
  id: string
  requestCode: string
  taskKind: ProductionWastageTaskKind
  taskId: string
  taskCode: string
  taskLabel: string
  /** Tham chiếu dòng BOM / phiếu xuất gốc (mock) */
  bomLineRef: string
  materialSku: string
  materialName: string
  uom: string
  /** SL đã xuất theo BOM tại thời điểm phát sinh waste */
  qtyIssuedBom: number
  /** SL hỏng / không dùng được */
  qtyDamaged: number
  /** SL đề nghị xuất bổ sung */
  qtyRequestSupplement: number
  reasonCategory: ProductionWastageReasonCategory
  reasonDetail: string
  status: ProductionWastageRequestStatus
  requestedAt: string
  requesterName: string
  workcenter: string
  estimatedLossVnd: number
}

function pickOrderTask(i: number) {
  const r = PRODUCTION_TASKS_BY_ORDER_ROWS[i % PRODUCTION_TASKS_BY_ORDER_ROWS.length]!
  return {
    taskKind: 'by_order' as const,
    taskId: r.id,
    taskCode: r.taskCode,
    taskLabel: `${r.orderCode} · ${r.agencyShortName}`,
  }
}

function pickInternalTask(i: number) {
  const r = PRODUCTION_INTERNAL_TASK_ROWS[i % PRODUCTION_INTERNAL_TASK_ROWS.length]!
  return {
    taskKind: 'internal' as const,
    taskId: r.id,
    taskCode: r.taskCode,
    taskLabel: `${r.sku} · ${r.productName}`,
  }
}

const ROWS: ProductionWastageRequestRow[] = [
  (() => {
    const t = pickOrderTask(0)
    return {
      id: 'pws-1',
      requestCode: 'WS-REQ-2026-014',
      ...t,
      bomLineRef: 'BOM-OUT-77821 · dòng 3',
      materialSku: 'VL-MDF-18',
      materialName: 'MDF phủ melamine trắng 18mm',
      uom: 'tấm',
      qtyIssuedBom: 12,
      qtyDamaged: 2,
      qtyRequestSupplement: 2,
      reasonCategory: 'cut_nesting' as const,
      reasonDetail: 'Nesting sai khổ sau khi khách đổi đột xuất shop drawing — tấm đã cắt không ghép lại được.',
      status: 'pending_approval' as const,
      requestedAt: '2026-04-11T09:15:00',
      requesterName: 'Phạm Văn Thọ',
      workcenter: 'Chuyền ráp 2',
      estimatedLossVnd: 2_800_000,
    }
  })(),
  (() => {
    const t = pickOrderTask(2)
    return {
      id: 'pws-2',
      requestCode: 'WS-REQ-2026-013',
      ...t,
      bomLineRef: 'BOM-OUT-77402 · dòng 7',
      materialSku: 'PK-BLUM-TAND',
      materialName: 'Ray tủ Blum Tandem',
      uom: 'bộ',
      qtyIssuedBom: 8,
      qtyDamaged: 1,
      qtyRequestSupplement: 1,
      reasonCategory: 'handling' as const,
      reasonDetail: 'Rơi khi lắp — ray cong răng, không thể hiệu chỉnh.',
      status: 'approved' as const,
      requestedAt: '2026-04-10T14:40:00',
      requesterName: 'Nguyễn Hữu Tài',
      workcenter: 'Chuyền ráp 1',
      estimatedLossVnd: 1_150_000,
    }
  })(),
  (() => {
    const t = pickInternalTask(0)
    return {
      id: 'pws-3',
      requestCode: 'WS-REQ-2026-012',
      ...t,
      bomLineRef: 'BOM-OUT-MTS-2201 · dòng 1',
      materialSku: 'VL-MDF-18',
      materialName: 'MDF phủ melamine trắng 18mm',
      uom: 'tấm',
      qtyIssuedBom: 6,
      qtyDamaged: 1,
      qtyRequestSupplement: 1,
      reasonCategory: 'machine' as const,
      reasonDetail: 'Máy ép cạnh lệch nhiệt — ván nứt khi dán PVC.',
      status: 'issued' as const,
      requestedAt: '2026-04-09T08:05:00',
      requesterName: 'Lê Thị Mai',
      workcenter: 'Dán cạnh 1',
      estimatedLossVnd: 1_400_000,
    }
  })(),
  (() => {
    const t = pickOrderTask(4)
    return {
      id: 'pws-4',
      requestCode: 'WS-REQ-2026-011',
      ...t,
      bomLineRef: 'BOM-OUT-77190 · dòng 2',
      materialSku: 'AC-ACR-W',
      materialName: 'Acrylic trắng 8mm (mặt cánh)',
      uom: 'tấm',
      qtyIssuedBom: 4,
      qtyDamaged: 1,
      qtyRequestSupplement: 1,
      reasonCategory: 'supplier_defect' as const,
      reasonDetail: 'Vết xước sâu phát hiện trước ráp — NCC xác nhận lỗi từ đầu.',
      status: 'issued' as const,
      requestedAt: '2026-04-08T16:22:00',
      requesterName: 'Hoàng Minh Tuấn',
      workcenter: 'CNC A',
      estimatedLossVnd: 2_200_000,
    }
  })(),
  (() => {
    const t = pickInternalTask(2)
    return {
      id: 'pws-5',
      requestCode: 'WS-REQ-2026-010',
      ...t,
      bomLineRef: 'BOM-OUT-MTS-2198 · dòng 4',
      materialSku: 'AC-KEO-PU',
      materialName: 'Keo dán cạnh PU',
      uom: 'kg',
      qtyIssuedBom: 3,
      qtyDamaged: 1,
      qtyRequestSupplement: 1,
      reasonCategory: 'other' as const,
      reasonDetail: 'Keo đông sớm trong thùng — mẻ không đạt độ sệt.',
      status: 'rejected' as const,
      requestedAt: '2026-04-07T11:00:00',
      requesterName: 'Lê Thị Mai',
      workcenter: 'Dán cạnh 1',
      estimatedLossVnd: 180_000,
    }
  })(),
]

export const PRODUCTION_WASTAGE_REQUEST_ROWS: ProductionWastageRequestRow[] = ROWS

export function wastageStatusLabel(s: ProductionWastageRequestStatus): string {
  const m: Record<ProductionWastageRequestStatus, string> = {
    pending_approval: 'Chờ duyệt kho',
    approved: 'Đã duyệt — chờ xuất',
    issued: 'Đã xuất bổ sung',
    rejected: 'Từ chối',
  }
  return m[s]
}

export function wastageReasonLabel(c: ProductionWastageReasonCategory): string {
  const m: Record<ProductionWastageReasonCategory, string> = {
    cut_nesting: 'Cắt / nesting',
    handling: 'Va đập / cầm nắm',
    machine: 'Máy / thiết bị',
    supplier_defect: 'Lỗi NCC / vật tư',
    other: 'Khác',
  }
  return m[c]
}
