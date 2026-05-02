import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductionTaskDetailFromApi } from '../components/ProductionTaskDetailFromApi'
import { productionPaths } from '../config/productionPaths'
import { fetchProductionTaskDetails, type ProductionTaskDetailDto } from '../productionTasksApi'
import './ProductionTaskByOrderDetailPage.css'

/**
 * Chi tiết lệnh MTS / nội bộ — GET /api/production/tasks/:id/details
 */
export function ProductionTaskInternalDetailPage() {
  const { taskId: rawId } = useParams<{ taskId: string }>()
  const taskId = rawId ? decodeURIComponent(rawId) : ''
  const [task, setTask] = useState<ProductionTaskDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!taskId) {
      setTask(null)
      setLoading(false)
      setError('Thiếu mã lệnh')
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    setTask(null)
    void fetchProductionTaskDetails(taskId)
      .then((data) => {
        if (!cancelled) {
          setTask(data)
          setError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setTask(null)
          setError(e instanceof Error ? e.message : 'Không tải được chi tiết')
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
      <div className="th-prod-tdetail">
        <p className="th-prod-tdetail__loading">Đang tải chi tiết lệnh…</p>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="th-prod-tdetail th-prod-tdetail--empty">
        <h1 className="th-prod-tdetail__title">Không tải được lệnh</h1>
        <p className="th-prod-tdetail__lead">
          {error ?? 'Thiếu dữ liệu hoặc mã lệnh không hợp lệ.'}
        </p>
        <Link className="th-prod-tdetail__btn" to={productionPaths.tasks.internal}>
          ← Về danh sách lệnh tồn kho
        </Link>
      </div>
    )
  }

  return <ProductionTaskDetailFromApi task={task} variant="internal" />
}
