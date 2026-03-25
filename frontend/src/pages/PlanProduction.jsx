import {useState} from "react";
import "./PlanProduction.css";

const PRIORITY = {
    LOW: {text: "Thấp", cls: "wo-pri--low"},
    MEDIUM: {text: "Trung bình", cls: "wo-pri--medium"},
    HIGH: {text: "Cao", cls: "wo-pri--high"},
    URGENT: {text: "Ưu tiên", cls: "wo-pri--urgent"},
};

const STATUS = {
    CONFIRMED: {text: "Confirmed", cls: "wo-status--confirmed"},
    IN_PROGRESS: {text: "In Progress", cls: "wo-status--in-progress"},
    COMPLETED: {text: "Completed", cls: "wo-status--completed"},
    CANCELLED: {text: "Cancelled", cls: "wo-status--cancelled"},
};

const MOCK_ORDERS = [
    {
        id: 1, orderId: "WO-2026-001",
        customer: "Công ty TNHH Khách Hàng VIP",
        dueDate: "2026-03-30", priority: "URGENT", status: "CONFIRMED",
        items: [
            {product: "Bàn làm việc Gỗ Sồi", sku: "SP-BAN-001", quantity: 10},
            {product: "Ghế xoay văn phòng", sku: "SP-GHE-001", quantity: 20},
        ],
        note: "Khách yêu cầu giao trước 30/3",
        materials: [
            {name: "Gỗ Sồi Nga", unit: "Khối", required: 5},
            {name: "Đinh ốc 5 phân", unit: "Hộp", required: 20},
        ],
    },
    {
        id: 2, orderId: "WO-2026-002",
        customer: "Anh Tuấn Mua Lẻ",
        dueDate: "2026-04-10", priority: "MEDIUM", status: "CONFIRMED",
        items: [{product: "Tủ hồ sơ 3 buồng Gỗ CN", sku: "SP-TU-002", quantity: 3}],
        note: "",
        materials: [{name: "Gỗ Công Nghiệp MDF", unit: "Tấm", required: 12}],
    },
    {
        id: 3, orderId: "WO-2026-003",
        customer: "Nội thất Hoàng Gia",
        dueDate: "2026-03-26", priority: "HIGH", status: "IN_PROGRESS",
        items: [
            {product: "Kệ sách gỗ thông", sku: "SP-KE-003", quantity: 5},
            {product: "Bàn trà gỗ sồi", sku: "SP-BT-004", quantity: 2},
            {product: "Ghế đẩu gỗ", sku: "SP-GD-005", quantity: 8},
        ],
        note: "Ưu tiên hoàn thành Kệ sách trước",
        materials: [
            {name: "Gỗ Thông nhập khẩu", unit: "Khối", required: 3},
            {name: "Sơn PU", unit: "Lít", required: 10},
        ],
    },
];

const getDaysRemaining = (dueDate) =>
    Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));

const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN");

// ── Create Modal ──────────────────────────────────────────
const CreateWOModal = ({onClose, onSave}) => {
    const [form, setForm] = useState({
        // eslint-disable-next-line react-hooks/purity
        orderId: `WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100)).padStart(3, "0")}`,
        customer: "", dueDate: "", priority: "MEDIUM", note: "",
    });
    const [items, setItems] = useState([{product: "", sku: "", quantity: 1}]);
    const setF = (f, v) => setForm(p => ({...p, [f]: v}));
    const setItem = (i, f, v) => setItems(p => p.map((r, idx) => idx === i ? {...r, [f]: v} : r));
    const addItem = () => setItems(p => [...p, {product: "", sku: "", quantity: 1}]);
    const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
    const valid = form.customer && form.dueDate && items.some(r => r.product);

    return (
        <div className="wo-overlay" onClick={onClose}>
            <div className="wo-modal" onClick={e => e.stopPropagation()}>
                <div className="wo-modal__header">
                    <div>
                        <h3 className="wo-modal__title">Tạo Work Order mới</h3>
                        <span className="wo-modal__id">{form.orderId}</span>
                    </div>
                    <button className="wo-modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="wo-modal__body">
                    <div className="wo-form-grid">
                        <div className="wo-field">
                            <label className="wo-label">Khách hàng *</label>
                            <input className="wo-input" value={form.customer}
                                   onChange={e => setF("customer", e.target.value)} placeholder="Tên khách hàng..."/>
                        </div>
                        <div className="wo-field">
                            <label className="wo-label">Ngày hoàn thành *</label>
                            <input className="wo-input" type="date" value={form.dueDate}
                                   onChange={e => setF("dueDate", e.target.value)}/>
                        </div>
                        <div className="wo-field">
                            <label className="wo-label">Độ ưu tiên</label>
                            <select className="wo-select" value={form.priority}
                                    onChange={e => setF("priority", e.target.value)}>
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                        <div className="wo-field">
                            <label className="wo-label">Ghi chú</label>
                            <input className="wo-input" value={form.note} onChange={e => setF("note", e.target.value)}
                                   placeholder="Ghi chú..."/>
                        </div>
                    </div>
                    <div className="wo-field" style={{marginTop: 8}}>
                        <div className="wo-items-header">
                            <label className="wo-label">Sản phẩm cần sản xuất</label>
                            <button className="wo-add-item" onClick={addItem}>+ Thêm</button>
                        </div>
                        <div className="wo-items-table">
                            <div className="wo-items-head">
                                <span>Tên sản phẩm</span><span>SKU</span><span>Số lượng</span><span></span>
                            </div>
                            {items.map((row, i) => (
                                <div key={i} className="wo-items-row">
                                    <input className="wo-input" value={row.product}
                                           onChange={e => setItem(i, "product", e.target.value)}
                                           placeholder="Tên sản phẩm..."/>
                                    <input className="wo-input" value={row.sku}
                                           onChange={e => setItem(i, "sku", e.target.value)} placeholder="SKU"/>
                                    <input className="wo-input wo-input--sm" type="number" min="1" value={row.quantity}
                                           onChange={e => setItem(i, "quantity", Number(e.target.value))}/>
                                    <button className="wo-remove-item" onClick={() => removeItem(i)}
                                            disabled={items.length === 1}>✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="wo-modal__footer">
                    <button className="wo-btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="wo-btn-primary" disabled={!valid}
                            onClick={() => onSave({
                                ...form,
                                items,
                                status: "CONFIRMED",
                                id: Date.now(),
                                materials: []
                            })}>
                        Tạo Work Order
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Detail ────────────────────────────────────────────────
const WorkOrderDetail = ({order, onBack}) => {
    const days = getDaysRemaining(order.dueDate);
    const p = PRIORITY[order.priority] || {text: order.priority, cls: ""};
    const s = STATUS[order.status] || {text: order.status, cls: ""};
    const totalUnits = order.items.reduce((sum, i) => sum + i.quantity, 0);

    return (
        <div className="wo-page">
            <div className="wo-detail-header">
                <div>
                    <div className="wo-breadcrumb">
                        <button className="wo-breadcrumb-btn" onClick={onBack}>← Danh sách</button>
                        <span className="wo-breadcrumb-sep">›</span>
                        <span className="wo-breadcrumb-cur">{order.orderId}</span>
                    </div>
                    <h1 className="wo-detail-title">{order.orderId}</h1>
                    <div className="wo-detail-meta">
                        <span className={`wo-priority ${p.cls}`}>{p.text}</span>
                        <span className={`wo-status-badge ${s.cls}`}>{s.text}</span>
                    </div>
                </div>
            </div>

            <div className="wo-detail-grid">
                <div className="wo-detail-main">
                    <div className="wo-detail-card">
                        <div className="wo-card-title"> Thông tin chung</div>
                        <div className="wo-info-grid">
                            <div className="wo-info-item"><span className="wo-info-label">Order ID</span><span
                                className="wo-info-val">{order.orderId}</span></div>
                            <div className="wo-info-item"><span className="wo-info-label">Khách hàng</span><span
                                className="wo-info-val">{order.customer}</span></div>
                            <div className="wo-info-item"><span className="wo-info-label">Ngày hoàn thành</span><span
                                className="wo-info-val">{fmtDate(order.dueDate)}</span></div>
                            <div className="wo-info-item">
                                <span className="wo-info-label">Số ngày còn lại</span>
                                <span className={`wo-info-val${days <= 5 ? " wo-info-val--warn" : ""}`}>
                  {days > 0 ? `${days} ngày` : days === 0 ? "Hôm nay!" : `Quá hạn ${Math.abs(days)} ngày`}
                                    {days <= 5 && days >= 0 && <span style={{marginLeft: 4}}></span>}
                </span>
                            </div>
                            <div className="wo-info-item"><span className="wo-info-label">Độ ưu tiên</span><span
                                className={`wo-priority ${p.cls}`}>{p.text}</span></div>
                            <div className="wo-info-item"><span className="wo-info-label">Trạng thái</span><span
                                className={`wo-status-badge ${s.cls}`}>{s.text}</span></div>
                            {order.note && <div className="wo-info-item wo-info-item--full"><span
                                className="wo-info-label">Ghi chú</span><span
                                className="wo-info-val">{order.note}</span></div>}
                        </div>
                    </div>

                    <div className="wo-detail-card">
                        <div className="wo-card-title"> Sản phẩm cần sản xuất</div>
                        <table className="wo-table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Sản phẩm</th>
                                <th>SKU</th>
                                <th>Số lượng</th>
                            </tr>
                            </thead>
                            <tbody>
                            {order.items.map((item, i) => (
                                <tr key={i}>
                                    <td className="wo-td--idx">{i + 1}</td>
                                    <td className="wo-td--name">{item.product}</td>
                                    <td><span className="wo-sku">{item.sku}</span></td>
                                    <td><strong>{item.quantity}</strong></td>
                                </tr>
                            ))}
                            </tbody>
                            <tfoot>
                            <tr>
                                <td colSpan={3} style={{textAlign: "right", fontWeight: 600}}>Tổng số lượng</td>
                                <td><strong style={{color: "var(--accent)"}}>{totalUnits}</strong></td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>

                    {order.materials?.length > 0 && (
                        <div className="wo-detail-card">
                            <div className="wo-card-title"> Nguyên vật liệu cần dùng</div>
                            <table className="wo-table">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Vật liệu</th>
                                    <th>Đơn vị</th>
                                    <th>Cần dùng</th>
                                </tr>
                                </thead>
                                <tbody>
                                {order.materials.map((m, i) => (
                                    <tr key={i}>
                                        <td className="wo-td--idx">{i + 1}</td>
                                        <td className="wo-td--name">{m.name}</td>
                                        <td>{m.unit}</td>
                                        <td><strong>{m.required}</strong></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="wo-detail-side">
                    <div className="wo-detail-card">
                        <div className="wo-card-title"> Tóm tắt</div>
                        <div className="wo-summary-item">
                            <span>Số loại SP</span><strong>{order.items.length} loại</strong></div>
                        <div className="wo-summary-item"><span>Tổng SL</span><strong>{totalUnits}</strong></div>
                        <div className="wo-summary-item"><span>Ngày hoàn thành</span><strong>{fmtDate(order.dueDate)}</strong>
                        </div>
                        <div className="wo-summary-item">
                            <span>Còn lại</span>
                            <strong
                                className={days <= 5 ? "wo-text--warn" : ""}>{days} ngày{days <= 5 && days >= 0 ? "" : ""}</strong>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main List ─────────────────────────────────────────────
export const PlanProduction = () => {
    const [orders, setOrders] = useState(MOCK_ORDERS);
    const [search, setSearch] = useState("");
    const [priFilter, setPriFilter] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [viewOrder, setViewOrder] = useState(null);

    if (viewOrder) {
        return (
            <WorkOrderDetail
                order={viewOrder}
                onBack={() => setViewOrder(null)}
                onUpdate={(updatedOrder) => {
                    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
                    setViewOrder(updatedOrder); // Cập nhật lại view hiện tại
                }}
            />
        );
    }

    const filtered = orders.filter(o =>
        (o.orderId.toLowerCase().includes(search.toLowerCase()) ||
            o.customer.toLowerCase().includes(search.toLowerCase())) &&
        (!priFilter || o.priority === priFilter)
    );

    return (
        <div className="wo-page">
            <div className="wo-header">
                <div>
                    <h1 className="wo-title">Execute Work Order</h1>
                    <p className="wo-sub">Quản lý và theo dõi lệnh sản xuất</p>
                </div>
                <button className="wo-btn-primary" onClick={() => setShowCreate(true)}>+ Tạo Work Order</button>
            </div>

            <div className="wo-toolbar">
                <div className="wo-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input placeholder="Tìm theo Order ID hoặc khách hàng..."
                           value={search} onChange={e => setSearch(e.target.value)}/>
                </div>
                <select className="wo-filter-select" value={priFilter} onChange={e => setPriFilter(e.target.value)}>
                    <option value="">Tất cả độ ưu tiên</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                </select>
                <span className="wo-count">{filtered.length} work orders</span>
            </div>

            <div className="wo-table-wrap">
                <table className="wo-list-table">
                    <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Khách hàng</th>
                        <th>Số lượng SP</th>
                        <th>Sô lượng</th>
                        <th>Ngày hoàn thành</th>
                        <th>Số ngày còn lại</th>
                        <th>Độ ưu tiên</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.length === 0 ? (
                        <tr>
                            <td colSpan={9} className="wo-empty">Không có dữ liệu</td>
                        </tr>
                    ) : filtered.map(o => {
                        const days = getDaysRemaining(o.dueDate);
                        const p = PRIORITY[o.priority] || {text: o.priority, cls: ""};
                        const s = STATUS[o.status] || {text: o.status, cls: ""};
                        const totalUnits = o.items.reduce((sum, i) => sum + i.quantity, 0);
                        const isWarn = days <= 5 && days >= 0;
                        const isOverdue = days < 0;
                        return (
                            <tr key={o.id} className="wo-row">
                                <td><span className="wo-order-id">{o.orderId}</span></td>
                                <td className="wo-td--customer">{o.customer}</td>
                                <td className="wo-td--center">{o.items.length} loại</td>
                                <td className="wo-td--center">{totalUnits}</td>
                                <td>{fmtDate(o.dueDate)}</td>
                                <td>
                    <span className={`wo-days${isWarn ? " wo-days--warn" : ""}${isOverdue ? " wo-days--overdue" : ""}`}>
                      {isOverdue ? `Quá hạn ${Math.abs(days)}n` : `${days} ngày`}
                        {isWarn && <span style={{marginLeft: 4}}></span>}
                    </span>
                                </td>
                                <td><span className={`wo-priority ${p.cls}`}>{p.text}</span></td>
                                <td><span className={`wo-status-badge ${s.cls}`}>{s.text}</span></td>
                                <td>
                                    <button className="wo-view-btn" onClick={() => setViewOrder(o)}>View</button>

                                </td>

                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {showCreate && <CreateWOModal onClose={() => setShowCreate(false)} onSave={o => {
                setOrders(p => [o, ...p]);
                setShowCreate(false);
            }}/>}
        </div>
    );
};