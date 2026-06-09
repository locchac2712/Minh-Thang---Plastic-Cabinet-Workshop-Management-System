import type { OrderFulfillmentSummaryDto } from '../../../shared/productionProgress/types'
import { OrderFulfillmentPanel } from '../../../shared/productionProgress/OrderFulfillmentPanel'

export type SellerOrderFulfillmentPanelProps = {
  summary: OrderFulfillmentSummaryDto | null
  loading: boolean
  error: string | null
  onRetry?: () => void
}

export function SellerOrderFulfillmentPanel(props: SellerOrderFulfillmentPanelProps) {
  return <OrderFulfillmentPanel {...props} />
}

export function SellerOrderFulfillmentStrip({
  summary,
  loading,
}: {
  summary: OrderFulfillmentSummaryDto | null
  loading: boolean
}) {
  if (loading) {
    return (
      <p className="th-seller-order-detail__fulfillment-strip" role="status">
        Đang kiểm tra tiến độ lập lô / giao hàng…
      </p>
    )
  }
  if (!summary?.lines?.length) return null
  const pendingBatch = summary.lines.filter((l) => l.remainingToBatch > 0).length
  const pendingDeliver = summary.lines.filter((l) => l.remainingToDeliver > 0).length
  if (pendingBatch === 0 && pendingDeliver === 0) {
    return (
      <p
        className="th-seller-order-detail__fulfillment-strip th-seller-order-detail__fulfillment-strip--ok"
        role="status"
      >
        Đã lập đủ lô và giao đủ số lượng — có thể chốt đơn.
      </p>
    )
  }
  return null
}
