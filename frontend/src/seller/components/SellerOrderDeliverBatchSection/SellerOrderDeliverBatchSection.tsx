import type { SellerOrderProductionTaskDto } from '../../sellerOrdersApi'
import { orderProductionTaskRef } from '../../../shared/productionProgress/types'
import { ShareTrackLinkButton } from '../ShareTrackLink/ShareTrackLinkDialog'
import './SellerOrderDeliverBatchSection.css'

export type SellerOrderDeliverBatchSectionProps = {
  tasks: SellerOrderProductionTaskDto[]
  loading: boolean
  selectedTaskId: string | null
  formatDateTime: (iso: string) => string
  onSelectTask: (taskId: string) => void
  onDeliver: (task: SellerOrderProductionTaskDto) => void
  onShareTask?: (taskId: string) => void
  shareLoadingTaskId?: string | null
}

function taskRef(task: SellerOrderProductionTaskDto): string {
  return orderProductionTaskRef({ taskId: task.taskId, displayCode: task.displayCode })
}

export function SellerOrderDeliverBatchSection({
  tasks,
  loading,
  selectedTaskId,
  formatDateTime,
  onSelectTask,
  onDeliver,
  onShareTask,
  shareLoadingTaskId,
}: SellerOrderDeliverBatchSectionProps) {
  const pendingDeliver = tasks.filter((t) => t.deliverable)
  const delivered = tasks.filter((t) => Boolean(t.deliveredAt))
  const inProduction = tasks.filter((t) => t.status !== 'Done')

  if (loading) {
    return (
      <section className="th-sod-deliver" aria-labelledby="th-sod-deliver-title">
        <p className="th-sod-deliver__loading">Đang tải danh sách lô…</p>
      </section>
    )
  }

  if (tasks.length === 0) return null

  return (
    <section className="th-sod-deliver" id="th-sod-deliver-section" aria-labelledby="th-sod-deliver-title">
      <header className="th-sod-deliver__head">
        <div className="th-sod-deliver__head-main">
          <h3 id="th-sod-deliver-title" className="th-sod-deliver__title">
            <span className="material-symbols-outlined" aria-hidden>
              local_shipping
            </span>
            Giao lô sản xuất
          </h3>
          <p className="th-sod-deliver__lead">
            Mỗi lô giao một điểm riêng — nhập địa chỉ và tải ảnh bằng chứng khi xác nhận. Cập nhật tồn và
            công nợ đại lý sau khi giao đủ.
          </p>
        </div>
        <ul className="th-sod-deliver__stats" aria-label="Tóm tắt giao lô">
          <li className="th-sod-deliver__stat th-sod-deliver__stat--pending">
            <span className="th-sod-deliver__stat-value">{pendingDeliver.length}</span>
            <span className="th-sod-deliver__stat-label">Chờ giao</span>
          </li>
          <li className="th-sod-deliver__stat th-sod-deliver__stat--done">
            <span className="th-sod-deliver__stat-value">{delivered.length}</span>
            <span className="th-sod-deliver__stat-label">Đã giao</span>
          </li>
          <li className="th-sod-deliver__stat">
            <span className="th-sod-deliver__stat-value">{inProduction.length}</span>
            <span className="th-sod-deliver__stat-label">Đang SX</span>
          </li>
        </ul>
      </header>

      {pendingDeliver.length === 0 && delivered.length === 0 ? (
        <div className="th-sod-deliver__empty">
          <span className="material-symbols-outlined th-sod-deliver__empty-icon" aria-hidden>
            inventory_2
          </span>
          <p>
            {inProduction.length > 0
              ? `${inProduction.length} lô đang sản xuất — chưa có lô nào sẵn sàng giao.`
              : 'Chưa có lô hoàn tất. Xưởng cần hoàn thành lệnh trước khi giao.'}
          </p>
        </div>
      ) : (
        <ul className="th-sod-deliver__list" role="list">
          {[...pendingDeliver, ...delivered].map((task) => {
            const isPending = task.deliverable
            const isSelected = task.taskId === selectedTaskId
            return (
              <li key={task.taskId} role="listitem">
                <article
                  className={`th-sod-deliver__card${
                    isPending ? ' th-sod-deliver__card--pending' : ' th-sod-deliver__card--delivered'
                  }${isSelected ? ' th-sod-deliver__card--selected' : ''}`}
                >
                  <div className="th-sod-deliver__card-main">
                    <div className="th-sod-deliver__card-top">
                      <h4 className="th-sod-deliver__product">
                        {task.productName || 'Sản phẩm'}
                      </h4>
                      <span
                        className={
                          isPending
                            ? 'th-sod-deliver__badge th-sod-deliver__badge--pending'
                            : 'th-sod-deliver__badge th-sod-deliver__badge--done'
                        }
                      >
                        {isPending ? 'Chờ giao' : 'Đã giao'}
                      </span>
                    </div>
                    <dl className="th-sod-deliver__meta">
                      <div>
                        <dt>Số lượng</dt>
                        <dd>{task.quantity}</dd>
                      </div>
                      <div>
                        <dt>Mã lệnh</dt>
                        <dd>
                          <code title={taskRef(task)}>{taskRef(task)}</code>
                        </dd>
                      </div>
                      <div>
                        <dt>Thợ</dt>
                        <dd>{task.assignedToName?.trim() || '—'}</dd>
                      </div>
                      <div>
                        <dt>{isPending ? 'Hoàn tất SX' : 'Giao lúc'}</dt>
                        <dd>
                          {isPending
                            ? task.completedAt
                              ? formatDateTime(task.completedAt)
                              : '—'
                            : task.deliveredAt
                              ? formatDateTime(task.deliveredAt)
                              : '—'}
                        </dd>
                      </div>
                      {!isPending && task.deliveryAddress?.trim() ? (
                        <div className="th-sod-deliver__meta-wide">
                          <dt>Điểm giao</dt>
                          <dd>{task.deliveryAddress.trim()}</dd>
                        </div>
                      ) : null}
                    </dl>
                    {!isPending && task.deliveryProofImageUrl?.trim() ? (
                      <a
                        className="th-sod-deliver__proof-link"
                        href={task.deliveryProofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={task.deliveryProofImageUrl}
                          alt="Ảnh bằng chứng giao lô"
                          loading="lazy"
                        />
                        <span>Xem ảnh bằng chứng</span>
                      </a>
                    ) : null}
                  </div>
                  <div className="th-sod-deliver__card-actions">
                    {isPending ? (
                      <button
                        type="button"
                        className="th-sod-deliver__btn th-sod-deliver__btn--primary"
                        onClick={() => onDeliver(task)}
                      >
                        <span className="material-symbols-outlined" aria-hidden>
                          local_shipping
                        </span>
                        Giao lô
                      </button>
                    ) : (
                      <span className="th-sod-deliver__done-note">
                        <span className="material-symbols-outlined" aria-hidden>
                          check_circle
                        </span>
                        Đã xuất kho
                      </span>
                    )}
                    <button
                      type="button"
                      className="th-sod-deliver__btn th-sod-deliver__btn--ghost"
                      aria-pressed={isSelected}
                      onClick={() => onSelectTask(task.taskId)}
                    >
                      Xem nhật ký
                    </button>
                    {onShareTask ? (
                      <ShareTrackLinkButton
                        className="th-sod-deliver__btn th-sod-deliver__btn--ghost"
                        onShare={() => onShareTask(task.taskId)}
                        loading={shareLoadingTaskId === task.taskId}
                      />
                    ) : null}
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
