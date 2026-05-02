/**
 * KPI ngược — hao phí / hủy vật tư theo tổ đội (DIR-P03, workflows §5.3).
 * Nguồn: INVENTORY_LOGS (transaction_type WASTE), liên kết PRODUCTION_TASKS / assigned_to — documents/erd.md
 * Giao diện hiện dùng: GET /api/director/waste/* — director.md (mẫu này chỉ tham chiếu layout cũ).
 */

export type DirectorWastageMaterialLine = {
  sku: string
  label: string
  qty: number
  uom: string
  lossVnd: number
}

export type DirectorWastageRow = {
  id: string
  rank: number
  /** Mã nội bộ tổ / chuyền */
  crewCode: string
  crewName: string
  workcenter: string
  /** Tổ trưởng / PIC (USERS) */
  leadName: string
  wasteEventCount: number
  /** Tấm ván hủy (mock) */
  wasteSheets: number
  /** Diện tích quy đổi m² (minh họa) */
  wasteAreaM2: number
  /** Ước tính giá trị hao phí (rolling cost MATERIALS) */
  estimatedLossVnd: number
  /** So tháng trước: dương = xấu hơn */
  vsLastMonthPct: number
  lastIncidentAt: string
  topMaterial: string
  riskTier: 'critical' | 'high' | 'watch' | 'ok'
  note: string
  materialBreakdown: DirectorWastageMaterialLine[]
}

const ROWS: DirectorWastageRow[] = [
  {
    id: 'ws-1',
    rank: 1,
    crewCode: 'CR-02',
    crewName: 'Chuyền ráp 2',
    workcenter: 'Khu B — tủ bếp acrylic',
    leadName: 'Phạm Văn Thọ',
    wasteEventCount: 28,
    wasteSheets: 14,
    wasteAreaM2: 42.6,
    estimatedLossVnd: 48_600_000,
    vsLastMonthPct: 22,
    lastIncidentAt: '2025-04-10 08:22',
    topMaterial: 'MDF phủ melamine trắng 18mm',
    riskTier: 'critical',
    note: 'Nhiều lỗi cắt sai theo shop drawing khách đổi đột xuất — cần QC đo lại trước CNC.',
    materialBreakdown: [
      { sku: 'VL-MDF-18', label: 'MDF melamine 18mm trắng', qty: 9, uom: 'tấm', lossVnd: 31_500_000 },
      { sku: 'PK-BLUM-TAND', label: 'Ray Blum Tandem (hỏng lắp)', qty: 4, uom: 'bộ', lossVnd: 9_200_000 },
      { sku: 'AC-KEO-PU', label: 'Keo PU dán cạnh (lãng phí mẻ)', qty: 6, uom: 'kg', lossVnd: 7_900_000 },
    ],
  },
  {
    id: 'ws-2',
    rank: 2,
    crewCode: 'DC-01',
    crewName: 'Chuyền dán cạnh 1',
    workcenter: 'Dán PVC / ABS',
    leadName: 'Lê Thị Mai',
    wasteEventCount: 19,
    wasteSheets: 11,
    wasteAreaM2: 28.4,
    estimatedLossVnd: 31_200_000,
    vsLastMonthPct: 8,
    lastIncidentAt: '2025-04-09 16:40',
    topMaterial: 'PVC 2mm gỗ sồi',
    riskTier: 'high',
    note: 'Tăng cao đầu quý — máy cạnh trái nhiệt không ổn định, ván bị nứt khi ép.',
    materialBreakdown: [
      { sku: 'PVC-2-SOI', label: 'Cuộn PVC 2mm vân sồi', qty: 7, uom: 'cuộn', lossVnd: 18_400_000 },
      { sku: 'VL-MDF-18', label: 'MDF 18mm (chờ dán)', qty: 4, uom: 'tấm', lossVnd: 12_800_000 },
    ],
  },
  {
    id: 'ws-3',
    rank: 3,
    crewCode: 'CNC-A',
    crewName: 'Tổ CNC A',
    workcenter: 'Máy CNC-01 / 02',
    leadName: 'Hoàng Minh Tuấn',
    wasteEventCount: 14,
    wasteSheets: 8,
    wasteAreaM2: 19.2,
    estimatedLossVnd: 22_100_000,
    vsLastMonthPct: -5,
    lastIncidentAt: '2025-04-08 11:05',
    topMaterial: 'Acrylic trắng mặt B',
    riskTier: 'watch',
    note: 'Đã cải thiện sau training nesting — vẫn theo dõi file DXF từ Sale.',
    materialBreakdown: [
      { sku: 'AC-ACR-W', label: 'Acrylic trắng 8mm', qty: 5, uom: 'tấm', lossVnd: 14_200_000 },
      { sku: 'VL-MDF-18', label: 'MDF 18mm', qty: 3, uom: 'tấm', lossVnd: 7_900_000 },
    ],
  },
  {
    id: 'ws-4',
    rank: 4,
    crewCode: 'CR-01',
    crewName: 'Chuyền ráp 1',
    workcenter: 'Khu A — tủ quần áo',
    leadName: 'Nguyễn Hữu Tài',
    wasteEventCount: 11,
    wasteSheets: 6,
    wasteAreaM2: 14.1,
    estimatedLossVnd: 16_800_000,
    vsLastMonthPct: 3,
    lastIncidentAt: '2025-04-07 14:18',
    topMaterial: 'Melamine xám gỗ',
    riskTier: 'watch',
    note: 'Hỏng phụ kiện ray giả — đã thay NCC, giảm dần.',
    materialBreakdown: [
      { sku: 'PK-RAY-STD', label: 'Ray kéo tiêu chuẩn', qty: 12, uom: 'bộ', lossVnd: 9_100_000 },
      { sku: 'VL-MDF-18', label: 'MDF 18mm', qty: 2, uom: 'tấm', lossVnd: 7_700_000 },
    ],
  },
  {
    id: 'ws-5',
    rank: 5,
    crewCode: 'QC-01',
    crewName: 'Tổ QC cuối chuyền',
    workcenter: 'Kiểm mối / bóng',
    leadName: 'Trần Diệu Linh',
    wasteEventCount: 6,
    wasteSheets: 3,
    wasteAreaM2: 6.8,
    estimatedLossVnd: 8_400_000,
    vsLastMonthPct: -12,
    lastIncidentAt: '2025-04-06 09:55',
    topMaterial: 'Cạnh ABS (lỗi lắp)',
    riskTier: 'ok',
    note: 'Chủ yếu loại bỏ lỗi từ khâu trước — không tính trừ lương QC.',
    materialBreakdown: [
      { sku: 'ABS-EDGE-23', label: 'Cạnh ABS 23mm', qty: 2, uom: 'cuộn', lossVnd: 5_200_000 },
      { sku: 'AC-ACR-W', label: 'Acrylic (vá lỗi không đạt)', qty: 1, uom: 'tấm', lossVnd: 3_200_000 },
    ],
  },
]

export const DIRECTOR_WASTAGE_ROWS: DirectorWastageRow[] = ROWS

/** Kỳ báo cáo minh họa (sẽ bind query ?month= từ API). */
export const DIRECTOR_WASTAGE_PERIOD_LABEL = 'Tháng 4/2025'
