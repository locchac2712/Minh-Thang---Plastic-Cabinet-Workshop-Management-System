export type PublicTaskTrackActivityLogDto = {
  description: string
  imageUrl: string | null
  createdAt: string
  userDisplayName: string
}

export type PublicTaskTrackDto = {
  productName: string
  quantity: number
  status: 'Waiting' | 'Doing' | 'Done'
  expectedEndDate: string | null
  completedAt: string | null
  deliveredAt: string | null
  taskDisplayCode: string | null
  agencyDisplayName: string
  orderShippingAddress: string | null
  deliveryAddress: string | null
  deliveryProofImageUrl: string | null
  deliverable: boolean
  orderStatus: string
  activityLogs: PublicTaskTrackActivityLogDto[]
}

export type TaskShareLinkDto = {
  url: string
  expiresAt: string
  revoked: boolean
}

/** Map public track DTO → OrderProductionTaskDto (single task for timeline). */
export function publicTrackToTimelineTask(d: PublicTaskTrackDto): import('./types').OrderProductionTaskDto {
  return {
    taskId: 'public',
    displayCode: d.taskDisplayCode ?? null,
    orderItemId: null,
    orderId: '',
    productId: null,
    productName: d.productName,
    quantity: d.quantity,
    assignedToId: null,
    assignedToName: null,
    status: d.status,
    startDate: null,
    expectedEndDate: d.expectedEndDate,
    completedAt: d.completedAt,
    deliveredAt: d.deliveredAt,
    deliveryAddress: d.deliveryAddress ?? null,
    deliveryProofImageUrl: d.deliveryProofImageUrl ?? null,
    deliverable: d.deliverable,
    taskCreatedAt: d.completedAt ?? d.activityLogs[0]?.createdAt ?? '',
    activityLogs: d.activityLogs.map((log) => ({
      id: `${log.createdAt}-${log.description.slice(0, 8)}`,
      taskId: 'public',
      userId: '',
      userName: log.userDisplayName,
      imageUrl: log.imageUrl,
      description: log.description,
      createdAt: log.createdAt,
    })),
  }
}
