import { isDebtRisk, type Agency } from '../admin/partners/agencyModel'
import { effectiveAgencyDebtVnd } from '../admin/partners/agencyModel'

export type AgencyCreditContext = 'quotation' | 'fulfillment'

export type AgencyCreditSnapshot = {
  ratio: number
  risk: boolean
  overLimit: boolean
  projDebt: number
  projRatio: number
  projOver: boolean
  projRisk: boolean
  showProj: boolean
  tone: 'ok' | 'risk' | 'bad'
  hintCurrent: string
  hintProj: string | null
}

type AgencyCreditInput = Pick<Agency, 'totalDebtVnd' | 'creditLimitVnd' | 'computedDebtVnd'>

export function computeAgencyCreditSnapshot(
  agency: AgencyCreditInput,
  orderTotalVnd: number,
  context: AgencyCreditContext,
): AgencyCreditSnapshot {
  const debt = effectiveAgencyDebtVnd(agency)
  const limit = agency.creditLimitVnd
  const ratio = limit <= 0 ? (debt > 0 ? 1 : 0) : Math.min(1, debt / limit)
  const risk = isDebtRisk(agency)
  const overLimit = limit > 0 && debt > limit
  const projDebt = debt + orderTotalVnd
  const projRatio = limit <= 0 ? (projDebt > 0 ? 1 : 0) : Math.min(1, projDebt / limit)
  const projOver = limit > 0 && projDebt > limit
  const projRisk = limit <= 0 ? projDebt > 0 : projRatio >= 0.8
  const showProj = orderTotalVnd > 0
  const tone: 'ok' | 'risk' | 'bad' =
    overLimit || projOver ? 'bad' : risk || projRisk ? 'risk' : 'ok'

  const isQuotation = context === 'quotation'
  const hintCurrent = overLimit
    ? isQuotation
      ? 'Đã vượt hạn mức — tham khảo trước khi tạo đơn thực tế.'
      : 'Đã vượt hạn mức — cần thu nợ hoặc điều chỉnh hạn mức trước khi lưu đơn.'
    : risk
      ? isQuotation
        ? 'Dư nợ gần hoặc tại trần (≥80% HM) — nhắc khách tất toán / cọc khi tạo đơn thực tế.'
        : 'Dư nợ gần hoặc tại trần (≥80% HM) — hệ thống có thể chặn khi lưu đơn.'
      : limit <= 0 && debt <= 0
        ? 'Chưa cấp hạn mức trên hệ thống — kiểm tra hồ sơ đại lý.'
        : isQuotation
          ? 'Còn room hạn mức; tham khảo trước khi tạo đơn thực tế.'
          : 'Còn room hạn mức; hệ thống kiểm tra khi lưu đơn.'

  const amountLabel = isQuotation ? 'báo giá' : 'đơn này'
  const hintProj =
    projOver && !overLimit
      ? isQuotation
        ? `Tổng nợ ước sau ${amountLabel} có thể vượt hạn mức — sẽ bị chặn khi tạo đơn thực tế.`
        : `Tổng nợ ước sau ${amountLabel} có thể vượt hạn mức — hệ thống chặn khi lưu.`
      : projRisk && !risk && !overLimit
        ? isQuotation
          ? `Tổng nợ ước sau ${amountLabel} có thể chạm ngưỡng cảnh báo (≥80%).`
          : `Tổng nợ ước sau ${amountLabel} có thể chạm ngưỡng cảnh báo (≥80%) khi lưu.`
        : null

  return {
    ratio,
    risk,
    overLimit,
    projDebt,
    projRatio,
    projOver,
    projRisk,
    showProj,
    tone,
    hintCurrent,
    hintProj,
  }
}
