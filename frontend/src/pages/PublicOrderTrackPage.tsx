import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { appLogoUrl } from '../branding/appLogo'
import { formatDateVi } from '../shared/formatDateVi'
import { fetchPublicTaskTrack } from '../public/publicOrderTrackApi'
import { OrderProductionTaskTimeline } from '../shared/productionProgress/OrderProductionTaskTimeline'
import {
  publicTrackToTimelineTask,
  type PublicTaskTrackDto,
} from '../shared/productionProgress/publicTrackTypes'
import { productionTaskStatusLabel } from '../shared/productionProgress/types'
import { orderStatusLabelVi } from '../dashboards/orderStatusLabels'
import './PublicOrderTrackPage.css'

function formatDateTime(iso: string): string {
  const d = iso.trim()
  if (!d) return '—'
  const noMs = d.includes('.') ? (d.split('.')[0] ?? d) : d.length >= 19 ? d.slice(0, 19) : d
  return noMs.includes('T') ? noMs.replace('T', ' ') : noMs
}

function formatIsoDateOnly(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—'
  const datePart = iso.trim().slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? formatDateVi(datePart) : iso
}

function publicDeliveryStatusLabel(d: PublicTaskTrackDto): string {
  if (d.deliveredAt) return 'Đã giao'
  if (d.deliverable) return 'Chờ giao (xưởng đã hoàn tất)'
  if (d.status === 'Done') return 'Hoàn tất SX — chưa giao'
  return 'Đang sản xuất'
}

/** Trang guest — theo dõi tiến độ lô SX qua link public. */
export function PublicOrderTrackPage() {
  const { token = '' } = useParams<{ token: string }>()
  const [data, setData] = useState<PublicTaskTrackDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError('Liên kết không hợp lệ')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void fetchPublicTaskTrack(token)
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) {
          setData(null)
          setError(e instanceof Error ? e.message : 'Không tải được tiến độ')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const timelineTask = useMemo(
    () => (data ? publicTrackToTimelineTask(data) : null),
    [data],
  )

  const delivered = Boolean(data?.deliveredAt)
  const deliveryPoint = data?.deliveryAddress?.trim() || null
  const orderShipping = data?.orderShippingAddress?.trim() || null

  return (
    <div className="th-public-track">
      <header className="th-public-track__header">
        <img src={appLogoUrl} alt="" className="th-public-track__logo" width={40} height={40} />
        <div>
          <p className="th-public-track__kicker">Minh Thắng ERP</p>
          <h1 className="th-public-track__title">Theo dõi sản xuất &amp; giao hàng</h1>
        </div>
      </header>

      {loading ? (
        <p className="th-public-track__muted">Đang tải tiến độ…</p>
      ) : error ? (
        <div className="th-public-track__error" role="alert">
          <span className="material-symbols-outlined" aria-hidden>
            link_off
          </span>
          <p>{error}</p>
        </div>
      ) : data && timelineTask ? (
        <div className="th-public-track__card">
          <div className="th-public-track__summary">
            <h2>{data.productName}</h2>
            <p>
              <span className="th-public-track__pill">{productionTaskStatusLabel(data.status)}</span>
              {data.orderStatus ? (
                <span className="th-public-track__pill th-public-track__pill--muted">
                  {orderStatusLabelVi(data.orderStatus)}
                </span>
              ) : null}
            </p>
            <dl className="th-public-track__meta">
              {data.taskDisplayCode?.trim() ? (
                <div>
                  <dt>Mã lô</dt>
                  <dd>
                    <code>{data.taskDisplayCode}</code>
                  </dd>
                </div>
              ) : null}
              <div>
                <dt>Khách</dt>
                <dd>{data.agencyDisplayName}</dd>
              </div>
              <div>
                <dt>Số lượng</dt>
                <dd>{data.quantity}</dd>
              </div>
              {data.expectedEndDate ? (
                <div>
                  <dt>Hạn hoàn thành</dt>
                  <dd>{formatIsoDateOnly(data.expectedEndDate)}</dd>
                </div>
              ) : null}
              {data.completedAt ? (
                <div>
                  <dt>Hoàn tất SX</dt>
                  <dd>{formatDateTime(data.completedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <section className="th-public-track__delivery" aria-labelledby="th-public-delivery-h">
            <h3 id="th-public-delivery-h" className="th-public-track__section-title">
              <span className="material-symbols-outlined" aria-hidden>
                local_shipping
              </span>
              Giao lô
            </h3>
            <dl className="th-public-track__meta th-public-track__meta--delivery">
              <div>
                <dt>Trạng thái giao</dt>
                <dd>
                  <span
                    className={
                      delivered
                        ? 'th-public-track__pill th-public-track__pill--done'
                        : data.deliverable
                          ? 'th-public-track__pill th-public-track__pill--pending'
                          : 'th-public-track__pill'
                    }
                  >
                    {publicDeliveryStatusLabel(data)}
                  </span>
                </dd>
              </div>
              {delivered && data.deliveredAt ? (
                <div>
                  <dt>Giao lúc</dt>
                  <dd>{formatDateTime(data.deliveredAt)}</dd>
                </div>
              ) : null}
              {deliveryPoint ? (
                <div className="th-public-track__meta-wide">
                  <dt>Điểm giao</dt>
                  <dd className="th-public-track__address">{deliveryPoint}</dd>
                </div>
              ) : orderShipping ? (
                <div className="th-public-track__meta-wide">
                  <dt>Địa chỉ giao trên đơn</dt>
                  <dd className="th-public-track__address">{orderShipping}</dd>
                  {!delivered ? (
                    <p className="th-public-track__hint">
                      Điểm giao thực tế của lô sẽ được cập nhật khi xác nhận giao — có thể khác địa
                      chỉ trên đơn.
                    </p>
                  ) : null}
                </div>
              ) : !delivered ? (
                <div className="th-public-track__meta-wide">
                  <dt>Địa chỉ giao</dt>
                  <dd className="th-public-track__muted-inline">
                    Chưa có — sẽ hiển thị sau khi xác nhận giao lô.
                  </dd>
                </div>
              ) : null}
              {data.deliveryProofImageUrl?.trim() ? (
                <div className="th-public-track__meta-wide">
                  <dt>Ảnh bằng chứng giao</dt>
                  <dd>
                    <a
                      className="th-public-track__proof"
                      href={data.deliveryProofImageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={data.deliveryProofImageUrl}
                        alt="Ảnh bằng chứng giao lô"
                        loading="lazy"
                      />
                      <span>Mở ảnh gốc</span>
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {data.activityLogs.length > 0 ? (
            <OrderProductionTaskTimeline
              tasks={[timelineTask]}
              selectedTaskId="public"
              onSelectTask={() => {}}
              readOnly
              formatDateTime={formatDateTime}
            />
          ) : (
            <p className="th-public-track__muted">Chưa có nhật ký ca làm việc trên lô này.</p>
          )}
        </div>
      ) : null}

      <footer className="th-public-track__footer">
        Trang chỉ xem tiến độ và giao hàng — không hiển thị giá hay thông tin nội bộ khác.
      </footer>
    </div>
  )
}
