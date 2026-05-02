import { Link } from 'react-router-dom'
import { sellerPaths } from '../../config/sellerPaths'
import type { SellerFactoryProgress, SellerOrderFactoryGate } from '../../data/sellerOrdersMock'
import './SellerOrderFactoryPanel.css'

type Props = {
  progress: SellerFactoryProgress
}

function gateStatusLabel(g: SellerOrderFactoryGate): string {
  switch (g.status) {
    case 'done':
      return 'Hoàn thành'
    case 'active':
      return 'Đang chạy'
    case 'blocked':
      return 'Tắc nghẽn'
    default:
      return 'Chờ'
  }
}

/**
 * Tab Tiến độ xưởng — chặng SX, vật tư, nhật ký (SEL-T01/T02, nhật ký xưởng).
 */
export function SellerOrderFactoryPanel({ progress }: Props) {
  return (
    <div className="th-seller-factory-panel">
      <section className="th-seller-factory-panel__overview" aria-labelledby="th-sfp-ov">
        <div className="th-seller-factory-panel__overview-main">
          <h2 id="th-sfp-ov" className="th-seller-factory-panel__h2">
            Tiến độ sản xuất
          </h2>
          <dl className="th-seller-factory-panel__meta-dl">
            <div>
              <dt>Lệnh lô</dt>
              <dd>
                <code className="th-seller-factory-panel__lot">{progress.productionLot}</code>
              </dd>
            </div>
            <div>
              <dt>Đang tại</dt>
              <dd>{progress.currentGateLabel}</dd>
            </div>
          </dl>
        </div>
        <div className="th-seller-factory-panel__meter-wrap" aria-hidden>
          <div className="th-seller-factory-panel__meter-track">
            <div
              className="th-seller-factory-panel__meter-fill"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <span className="th-seller-factory-panel__meter-label">{progress.percentComplete}%</span>
        </div>
      </section>

      {progress.blocker ? (
        <div className="th-seller-factory-panel__alert th-seller-factory-panel__alert--warn" role="status">
          <span className="material-symbols-outlined" aria-hidden>
            warning
          </span>
          <div>
            <strong>Rủi ro / chờ phụ tùng</strong>
            <p>{progress.blocker}</p>
          </div>
        </div>
      ) : null}

      {progress.qcHold ? (
        <div className="th-seller-factory-panel__alert th-seller-factory-panel__alert--info" role="status">
          <span className="material-symbols-outlined" aria-hidden>
            rule
          </span>
          <div>
            <strong>QC</strong>
            <p>{progress.qcHold}</p>
          </div>
        </div>
      ) : null}

      <section className="th-seller-factory-panel__section" aria-labelledby="th-sfp-gates">
        <h3 id="th-sfp-gates" className="th-seller-factory-panel__h3">
          <span className="material-symbols-outlined" aria-hidden>
            account_tree
          </span>
          Các chặng chuyền
        </h3>
        <ol className="th-seller-factory-panel__gates">
          {progress.gates.map((g) => (
            <li
              key={g.id}
              className={`th-seller-factory-panel__gate th-seller-factory-panel__gate--${g.status}`}
            >
              <span className="th-seller-factory-panel__gate-badge" aria-hidden>
                {g.status === 'done' ? (
                  <span className="material-symbols-outlined">check_circle</span>
                ) : g.status === 'active' ? (
                  <span className="material-symbols-outlined th-seller-factory-panel__icon-pulse">
                    precision_manufacturing
                  </span>
                ) : g.status === 'blocked' ? (
                  <span className="material-symbols-outlined">block</span>
                ) : (
                  <span className="th-seller-factory-panel__gate-num">{g.order}</span>
                )}
              </span>
              <div className="th-seller-factory-panel__gate-body">
                <div className="th-seller-factory-panel__gate-top">
                  <span className="th-seller-factory-panel__gate-title">{g.label}</span>
                  <span className={`th-seller-factory-panel__gate-pill th-seller-factory-panel__gate-pill--${g.status}`}>
                    {gateStatusLabel(g)}
                  </span>
                </div>
                <p className="th-seller-factory-panel__gate-hint">{g.hint}</p>
                {g.workcenter ? (
                  <p className="th-seller-factory-panel__gate-wc">
                    <span className="material-symbols-outlined">factory</span>
                    {g.workcenter}
                  </p>
                ) : null}
                <p className="th-seller-factory-panel__gate-time">
                  {g.finishedAt
                    ? `Xong: ${g.finishedAt}`
                    : g.startedAt
                      ? `Bắt đầu: ${g.startedAt}`
                      : '—'}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="th-seller-factory-panel__section" aria-labelledby="th-sfp-mat">
        <h3 id="th-sfp-mat" className="th-seller-factory-panel__h3">
          <span className="material-symbols-outlined" aria-hidden>
            inventory
          </span>
          Vật tư gắn lệnh
        </h3>
        <div className="th-seller-factory-panel__table-wrap">
          <table className="th-seller-factory-panel__table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Tên</th>
                <th className="th-seller-factory-panel__th-num">SL</th>
                <th>Đơn vị</th>
                <th>Tồn / mua hàng</th>
              </tr>
            </thead>
            <tbody>
              {progress.materials.map((m) => (
                <tr key={m.sku}>
                  <td>
                    <code className="th-seller-factory-panel__sku">{m.sku}</code>
                  </td>
                  <td>{m.name}</td>
                  <td className="th-seller-factory-panel__td-num">{m.requiredQty}</td>
                  <td>{m.uom}</td>
                  <td>
                    <span
                      className={`th-seller-factory-panel__stock th-seller-factory-panel__stock--${m.stockStatus === 'đủ' ? 'ok' : m.stockStatus === 'về kho' ? 'in' : 'buy'}`}
                    >
                      {m.stockStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="th-seller-factory-panel__section" aria-labelledby="th-sfp-log">
        <h3 id="th-sfp-log" className="th-seller-factory-panel__h3">
          <span className="material-symbols-outlined" aria-hidden>
            update
          </span>
          Nhật ký gần nhất
        </h3>
        <div className="th-seller-factory-panel__log-card">
          <time className="th-seller-factory-panel__log-time" dateTime={progress.lastActivityAt}>
            {progress.lastActivityAt}
          </time>
          <p className="th-seller-factory-panel__log-text">{progress.lastActivityText}</p>
        </div>
        <Link to={sellerPaths.tracking} className="th-seller-factory-panel__link-tracking">
          <span className="material-symbols-outlined" aria-hidden>
            photo_library
          </span>
          Mở nhật ký theo dõi xưởng (ảnh thực tế)
        </Link>
      </section>
    </div>
  )
}
