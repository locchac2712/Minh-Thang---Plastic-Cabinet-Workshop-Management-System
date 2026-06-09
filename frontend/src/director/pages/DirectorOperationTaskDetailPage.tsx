import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductionTaskDetailFromApi } from '../../production/components/ProductionTaskDetailFromApi'
import type {
  ProductionTaskBomLineDto,
  ProductionTaskDetailDto,
  ProductionTaskOrderLineDto,
} from '../../production/productionTasksApi'
import { fetchDirectorOperationTaskDetail } from '../directorOperationsApi'
import { directorPaths } from '../config/directorPaths'
import { productionOrderRef } from '../../production/utils/productionOrderRef'
import { productionTaskRef } from '../../production/utils/productionTaskRef'
import '../../admin/pages/AdminUsersPage.css'

function toDetailDto(raw: Awaited<ReturnType<typeof fetchDirectorOperationTaskDetail>>): ProductionTaskDetailDto {
  const orderItems = (raw.orderItems ?? []) as ProductionTaskOrderLineDto[]
  const bomItems = (raw.bomItems ?? []) as ProductionTaskBomLineDto[]
  return {
    ...raw,
    orderItems,
    bomItems,
  }
}

/** Chi tiết lệnh SX + BOM — read-only cho Giám đốc. */
export function DirectorOperationTaskDetailPage() {
  const { taskId = '' } = useParams<{ taskId: string }>()
  const [task, setTask] = useState<ProductionTaskDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchDirectorOperationTaskDetail(taskId)
      .then((data) => {
        if (!cancelled) setTask(toDetailDto(data))
      })
      .catch((e) => {
        if (!cancelled) {
          setTask(null)
          setError(e instanceof Error ? e.message : 'Không tải được chi tiết lệnh')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [taskId])

  if (loading) {
    return (
      <div className="th-director-ops-detail" style={{ padding: '1.5rem' }}>
        <p>Đang tải chi tiết lệnh…</p>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="th-director-ops-detail" style={{ padding: '1.5rem' }}>
        <Link to={directorPaths.operations.tasks} className="th-director-ops-detail__back">
          ← Lệnh đang chạy
        </Link>
        <p className="th-admin-users__api-error" role="alert">
          {error ?? 'Không tìm thấy lệnh'}
        </p>
      </div>
    )
  }

  const variant = task.orderId ? 'by-order' : 'internal'
  const orderRef = productionOrderRef(task.orderId ?? '', task.orderDisplayCode)

  return (
    <div style={{ padding: '0 0 2rem' }}>
      {task.orderId ? (
        <nav
          aria-label="Breadcrumb"
          style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem 1.5rem 0' }}
        >
          <ol style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', listStyle: 'none', margin: 0, padding: 0, fontSize: '0.875rem' }}>
            <li>
              <Link to={directorPaths.operations.orders}>Pipeline</Link>
            </li>
            <li aria-hidden>›</li>
            <li>
              <Link to={directorPaths.operations.order(orderRef)}>Đơn {orderRef}</Link>
            </li>
            <li aria-hidden>›</li>
            <li aria-current="page">
              <code>{productionTaskRef(task)}</code>
            </li>
          </ol>
        </nav>
      ) : null}
      <ProductionTaskDetailFromApi task={task} variant={variant} audience="director" />
    </div>
  )
}
