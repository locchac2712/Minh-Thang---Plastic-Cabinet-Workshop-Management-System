import { Link } from 'react-router-dom'
import {
  orderProductionTaskRef,
  productionTaskStatusLabel,
  type OrderProductionTaskDto,
} from './types'
import './OrderProductionTaskTimeline.css'

export type OrderProductionTaskTimelineProps = {
  tasks: OrderProductionTaskDto[]
  selectedTaskId: string | null
  onSelectTask: (taskId: string) => void
  readOnly?: boolean
  /** Seller: hint link to deliver section */
  deliverHintAnchor?: string
  formatDateTime?: (iso: string) => string
  taskDetailLink?: (taskId: string) => string
  /** Seller: mở dialog chia sẻ link public */
  onShareTask?: (taskId: string) => void
  shareLoadingTaskId?: string | null
}

function defaultFormatDateTime(iso: string): string {
  const d = iso.trim()
  if (!d) return '—'
  const noMs = d.includes('.') ? (d.split('.')[0] ?? d) : d.length >= 19 ? d.slice(0, 19) : d
  return noMs.includes('T') ? noMs.replace('T', ' ') : noMs
}

export function OrderProductionTaskTimeline({
  tasks,
  selectedTaskId,
  onSelectTask,
  readOnly = true,
  deliverHintAnchor,
  formatDateTime = defaultFormatDateTime,
  taskDetailLink,
  onShareTask,
  shareLoadingTaskId,
}: OrderProductionTaskTimelineProps) {
  if (tasks.length === 0) {
    return null
  }

  const selected = tasks.find((t) => t.taskId === selectedTaskId) ?? null
  const logs = selected?.activityLogs ?? []

  return (
    <>
      <h3 className="th-opp-timeline__section-title">
        <span className="material-symbols-outlined" aria-hidden>
          history
        </span>
        Nhật ký tiến độ
      </h3>
      <div className="th-opp-timeline__split" id="th-opp-timeline-logs">
        <aside className="th-opp-timeline__tasks" aria-label="Danh sách lệnh sản xuất">
          <h4 className="th-opp-timeline__split-title">
            Lệnh sản xuất
            <span className="th-opp-timeline__count">{tasks.length}</span>
          </h4>
          <ul className="th-opp-timeline__task-list" role="list">
            {tasks.map((task) => {
              const selectedRow = task.taskId === selectedTaskId
              const logCount = task.activityLogs?.length ?? 0
              return (
                <li key={task.taskId} role="listitem">
                  <button
                    type="button"
                    className={`th-opp-timeline__pick${selectedRow ? ' th-opp-timeline__pick--active' : ''}`}
                    aria-pressed={selectedRow}
                    onClick={() => onSelectTask(task.taskId)}
                  >
                    <span className="th-opp-timeline__pick-top">
                      <strong>{task.productName || 'Lệnh sản xuất'}</strong>
                      <span className="th-opp-timeline__badges">
                        <span
                          className={`th-opp-timeline__pill th-opp-timeline__pill--${task.status.toLowerCase()}`}
                        >
                          {productionTaskStatusLabel(task.status)}
                        </span>
                        {task.deliverable ? (
                          <span className="th-opp-timeline__pill th-opp-timeline__pill--pending-deliver">
                            Chờ giao
                          </span>
                        ) : null}
                        {task.deliveredAt ? (
                          <span className="th-opp-timeline__pill th-opp-timeline__pill--delivered">
                            Đã giao
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <span className="th-opp-timeline__pick-meta">
                      <span>SL {task.quantity}</span>
                      <span>{orderProductionTaskRef(task)}</span>
                      <span>{logCount} nhật ký</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </aside>
        <div className="th-opp-timeline__logs" aria-label="Nhật ký tiến độ lệnh đang chọn">
          {selected ? (
            <>
              <header className="th-opp-timeline__log-head">
                <div>
                  <h4 className="th-opp-timeline__split-title">
                    {selected.productName || 'Lệnh sản xuất'}
                  </h4>
                  <div className="th-opp-timeline__meta">
                    <code>{orderProductionTaskRef(selected)}</code>
                    <span>SL {selected.quantity}</span>
                    <span>Thợ phụ trách: {selected.assignedToName || '—'}</span>
                    <span>Hạn: {selected.expectedEndDate || '—'}</span>
                    {selected.deliveredAt ? (
                      <span>Giao lúc: {formatDateTime(selected.deliveredAt)}</span>
                    ) : null}
                  </div>
                  {taskDetailLink ? (
                    <p className="th-opp-timeline__link-row">
                      <Link
                        to={taskDetailLink(orderProductionTaskRef(selected))}
                        className="th-opp-timeline__link"
                      >
                        Xem BOM / chi tiết lệnh
                      </Link>
                    </p>
                  ) : null}
                  {!readOnly && onShareTask ? (
                    <p className="th-opp-timeline__link-row">
                      <button
                        type="button"
                        className="th-opp-timeline__share-btn"
                        onClick={() => onShareTask(selected.taskId)}
                        disabled={shareLoadingTaskId === selected.taskId}
                      >
                        <span className="material-symbols-outlined" aria-hidden>
                          share
                        </span>
                        {shareLoadingTaskId === selected.taskId ? 'Đang tạo…' : 'Chia sẻ link'}
                      </button>
                    </p>
                  ) : null}
                </div>
                {!readOnly && selected.deliverable && deliverHintAnchor ? (
                  <p className="th-opp-timeline__deliver-hint">
                    Lô sẵn sàng giao — mở mục{' '}
                    <a href={deliverHintAnchor}>Giao lô</a>, nhập địa chỉ và ảnh bằng chứng.
                  </p>
                ) : null}
                {selected.deliveredAt && selected.deliveryAddress?.trim() ? (
                  <div className="th-opp-timeline__delivery-proof">
                    <p>
                      <strong>Điểm giao:</strong> {selected.deliveryAddress.trim()}
                    </p>
                    {selected.deliveryProofImageUrl?.trim() ? (
                      <a
                        href={selected.deliveryProofImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="th-opp-timeline__image-link"
                      >
                        <img src={selected.deliveryProofImageUrl} alt="Ảnh bằng chứng giao lô" loading="lazy" />
                        <span>Ảnh bằng chứng giao lô</span>
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </header>
              {logs.length > 0 ? (
                <ol className="th-opp-timeline__log-list">
                  {logs.map((log) => (
                    <li key={log.id} className="th-opp-timeline__log-item">
                      <div className="th-opp-timeline__log-item-head">
                        <strong>{log.userName}</strong>
                        <span>{formatDateTime(log.createdAt)}</span>
                      </div>
                      <p className="th-opp-timeline__log-desc">{log.description}</p>
                      {log.imageUrl ? (
                        <a
                          className="th-opp-timeline__image-link"
                          href={log.imageUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img src={log.imageUrl} alt="Ảnh minh chứng tiến độ" loading="lazy" />
                          <span>Mở ảnh gốc</span>
                        </a>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="th-opp-muted th-opp-timeline__empty">Lệnh này chưa có nhật ký tiến độ.</p>
              )}
            </>
          ) : (
            <p className="th-opp-muted th-opp-timeline__empty">Chọn một lệnh bên trái để xem nhật ký.</p>
          )}
        </div>
      </div>
    </>
  )
}
