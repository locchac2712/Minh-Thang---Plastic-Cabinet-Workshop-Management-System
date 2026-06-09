export const ORDER_QUOTATION_STATUSES = ['Draft', 'Pending', 'Rejected', 'Canceled'] as const
export const ORDER_OPERATIONS_STATUSES = ['Approved', 'Producing', 'Done'] as const

export type OrderQuotationStatus = (typeof ORDER_QUOTATION_STATUSES)[number]
export type OrderOperationsStatus = (typeof ORDER_OPERATIONS_STATUSES)[number]

function norm(status: string | undefined): string {
  return (status ?? '').trim()
}

export function isOrderQuotationPhase(status: string | undefined): boolean {
  const key = norm(status)
  return ORDER_QUOTATION_STATUSES.some((s) => s.toLowerCase() === key.toLowerCase())
}

export function isOrderOperationsPhase(status: string | undefined): boolean {
  const key = norm(status)
  return ORDER_OPERATIONS_STATUSES.some((s) => s.toLowerCase() === key.toLowerCase())
}

export function canShowDirectorTaskProgress(status: string | undefined): boolean {
  const key = norm(status).toLowerCase()
  return key === 'producing' || key === 'done'
}
