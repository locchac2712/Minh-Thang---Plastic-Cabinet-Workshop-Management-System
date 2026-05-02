import { useCallback, useId, useMemo, useState, type FormEvent } from 'react'
import { MOCK_PRODUCTS, categoryLabel, formatVND } from '../../admin/catalog/productModel'
import {
  DIRECTOR_MTS_ASSIGNEES,
  DIRECTOR_MTS_RECENT_TASKS,
  statusLabel,
  type DirectorMtsTaskRow,
} from '../data/directorMtsMock'
import './DirectorMtsPage.css'

const ACTIVE_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.status === 'active')

function statusClass(s: DirectorMtsTaskRow['status']): string {
  if (s === 'done') return 'th-director-mts__status th-director-mts__status--done'
  if (s === 'doing') return 'th-director-mts__status th-director-mts__status--doing'
  return 'th-director-mts__status th-director-mts__status--wait'
}

/**
 * Lệnh Make-to-Stock — DIR-P04: không qua giỏ Sale; sinh PRODUCTION_TASKS với order_id = null.
 */
export function DirectorMtsPage() {
  const fid = useId()
  const [productId, setProductId] = useState(ACTIVE_PRODUCTS[0]?.id ?? '')
  const [qty, setQty] = useState(1)
  const [assigneeId, setAssigneeId] = useState(DIRECTOR_MTS_ASSIGNEES[0]?.id ?? '')
  const [expectedEndDate, setExpectedEndDate] = useState('2025-04-25')
  const [note, setNote] = useState('')

  const selectedProduct = useMemo(
    () => ACTIVE_PRODUCTS.find((p) => p.id === productId),
    [productId],
  )

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!selectedProduct || !assigneeId) return
      window.alert(
        `Đã ghi nhận yêu cầu lệnh dự trữ.\nThành phẩm: ${selectedProduct.name}\nSố lượng: ${qty}\nHạn: ${expectedEndDate}`,
      )
    },
    [assigneeId, expectedEndDate, note, qty, selectedProduct],
  )

  return (
    <div className="th-director-mts">
      <header className="th-director-mts__header">
        <h1 className="th-director-mts__title">Lệnh dự trữ xưởng</h1>
      </header>

      <div className="th-director-mts__grid">
        <section className="th-director-mts__card" aria-labelledby={`${fid}-form-title`}>
          <h2 id={`${fid}-form-title`} className="th-director-mts__card-title">
            Phát lệnh mới
          </h2>
          <form className="th-director-mts__form" onSubmit={handleSubmit}>
            <div className="th-director-mts__field">
              <label className="th-director-mts__label" htmlFor={`${fid}-product`}>
                Thành phẩm
              </label>
              <select
                id={`${fid}-product`}
                className="th-director-mts__select"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                {ACTIVE_PRODUCTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
              {selectedProduct ? (
                <p className="th-director-mts__hint">
                  {categoryLabel(selectedProduct.categoryId)} · Niêm yết {formatVND(selectedProduct.price)} ·{' '}
                  {selectedProduct.material}
                </p>
              ) : null}
            </div>

            <div className="th-director-mts__field-row">
              <div className="th-director-mts__field">
                <label className="th-director-mts__label" htmlFor={`${fid}-qty`}>
                  Số lượng lô
                </label>
                <input
                  id={`${fid}-qty`}
                  className="th-director-mts__input"
                  type="number"
                  min={1}
                  max={999}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  required
                />
              </div>
              <div className="th-director-mts__field">
                <label className="th-director-mts__label" htmlFor={`${fid}-date`}>
                  Hạn hoàn thành
                </label>
                <input
                  id={`${fid}-date`}
                  className="th-director-mts__input"
                  type="date"
                  value={expectedEndDate}
                  onChange={(e) => setExpectedEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="th-director-mts__field">
              <label className="th-director-mts__label" htmlFor={`${fid}-assign`}>
                Giao cho
              </label>
              <select
                id={`${fid}-assign`}
                className="th-director-mts__select"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                required
              >
                {DIRECTOR_MTS_ASSIGNEES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.workcenter}
                  </option>
                ))}
              </select>
            </div>

            <div className="th-director-mts__field">
              <label className="th-director-mts__label" htmlFor={`${fid}-note`}>
                Ghi chú chỉ đạo (tuỳ chọn)
              </label>
              <textarea
                id={`${fid}-note`}
                className="th-director-mts__textarea"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: ưu tiên màu trắng, dán nhãn kho dự trữ…"
              />
            </div>

            <div className="th-director-mts__form-actions">
              <button type="submit" className="th-director-mts__btn th-director-mts__btn--primary">
                <span className="material-symbols-outlined" aria-hidden>
                  rocket_launch
                </span>
                Phát lệnh sản xuất
              </button>
            </div>
          </form>
        </section>

        <section className="th-director-mts__card" aria-labelledby={`${fid}-table-title`}>
          <h2 id={`${fid}-table-title`} className="th-director-mts__card-title">
            Lệnh gần đây
          </h2>
          <div className="th-director-mts__table-wrap">
            <table className="th-director-mts-table">
              <thead>
                <tr>
                  <th scope="col">Mã lệnh</th>
                  <th scope="col">Sản phẩm</th>
                  <th scope="col" className="th-director-mts-table__col-num">
                    SL
                  </th>
                  <th scope="col">PIC</th>
                  <th scope="col">Hạn</th>
                  <th scope="col">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {DIRECTOR_MTS_RECENT_TASKS.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <code className="th-director-mts__code">{r.taskCode}</code>
                    </td>
                    <td>
                      <span className="th-director-mts-table__name">{r.productName}</span>
                      <code className="th-director-mts-table__sku">{r.sku}</code>
                    </td>
                    <td className="th-director-mts-table__num">{r.qty}</td>
                    <td>{r.assignedToName}</td>
                    <td className="th-director-mts-table__muted">{r.expectedEndDate}</td>
                    <td>
                      <span className={statusClass(r.status)}>{statusLabel(r.status)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
