import "./SalesPages.css";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const PROD_STAGE_STATUS = {
    COMPLETED:   { icon: "✓", cls: "sod-stage--done"    },
    IN_PROGRESS: { icon: "⟳", cls: "sod-stage--active"  },
    NOT_STARTED: { icon: "○", cls: "sod-stage--pending"  },
    ON_HOLD:     { icon: "⏸", cls: "sod-stage--hold"    },
};

const InfoRow = ({ label, value }) => (
    <div className="sod-info-row">
        <span className="sod-info-label">{label}</span>
        <span className="sod-info-value">{value ?? "—"}</span>
    </div>
);

export const SalesOrderDetail = ({ order, onBack, isSalesStaff }) => {
    const ORDER_STATUS = {
        PENDING:   { text: "Chờ xác nhận",  cls: "so-badge--pending"   },
        CONFIRMED: { text: "Đã xác nhận",   cls: "so-badge--confirmed" },
        PRODUCING: { text: "Đang sản xuất", cls: "so-badge--producing" },
        READY:     { text: "Sẵn giao",      cls: "so-badge--ready"     },
        DELIVERED: { text: "Đã giao",       cls: "so-badge--delivered" },
        CANCELLED: { text: "Đã hủy",        cls: "so-badge--cancelled" },
    };
    const DELIVERY_STATUS = {
        PENDING:   { text: "Chờ giao",        cls: "so-badge--pending"   },
        SHIPPING:  { text: "Đang giao",       cls: "so-badge--producing" },
        DELIVERED: { text: "Đã giao",        cls: "so-badge--delivered"  },
        FAILED:    { text: "Giao thất bại",   cls: "so-badge--cancelled" },
    };
    const PAYMENT_STATUS = {
        UNPAID:   { text: "Chưa thanh toán",      cls: "so-badge--pending"   },
        PARTIAL:  { text: "Thanh toán một phần",  cls: "so-badge--producing" },
        PAID:     { text: "Đã thanh toán",        cls: "so-badge--delivered" },
        REFUNDED: { text: "Đã hoàn tiền",         cls: "so-badge--cancelled" },
    };

    const os = ORDER_STATUS[order.orderStatus]       || { text: order.orderStatus,      cls: "" };
    const ds = DELIVERY_STATUS[order.deliveryStatus] || { text: order.deliveryStatus,   cls: "" };
    const py = PAYMENT_STATUS[order.paymentStatus]   || { text: order.paymentStatus,    cls: "" };

    const totalPaid = (order.payments || []).reduce((s, p) => s + p.amount, 0);
    const remaining = (order.totalAmount || 0) - totalPaid;

    return (
        <div className="sod-page">
            {/* Header */}
            <div className="sod-header">
                <div>
                    <h1 className="sod-title">Chi tiết Đơn hàng</h1>
                    <div className="sod-header-meta">
                        <span className="sod-order-id">{order.orderId}</span>
                        <span className={`so-badge ${os.cls}`}>{os.text}</span>
                    </div>
                </div>
                <button className="cf-back-btn" onClick={onBack}>← Quay lại</button>
            </div>

            <div className="sod-grid">
                {/* ── LEFT COLUMN ── */}
                <div className="sod-col-main">

                    {/* 1. General Information */}
                    <div className="sod-card">
                        <div className="sod-card__title">📋 Thông tin chung</div>
                        <div className="sod-info-grid">
                            <InfoRow label="Mã đơn hàng"    value={order.orderId} />
                            <InfoRow label="Khách hàng"     value={order.customer?.name} />
                            <InfoRow label="Email"          value={order.customer?.email} />
                            <InfoRow label="Số điện thoại" value={order.customer?.phone} />
                            <InfoRow label="Ngày đặt"       value={fmtDate(order.orderDate)} />
                            <InfoRow label="Nhân viên"      value={order.staff?.fullname} />
                            {order.note && <InfoRow label="Ghi chú" value={order.note} />}
                        </div>
                    </div>

                    {/* 2. Order Items */}
                    <div className="sod-card">
                        <div className="sod-card__title">🛒 Sản phẩm đặt hàng</div>
                        <table className="sod-table">
                            <thead>
                            <tr>
                                <th>#</th>
                                <th>Sản phẩm</th>
                                <th>SKU</th>
                                <th>SL</th>
                                <th>Đơn giá</th>
                                <th>Thành tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(order.items || []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="sod-td--idx">{i + 1}</td>
                                    <td className="sod-td--name">{item.productName}</td>
                                    <td><span className="sod-sku">{item.productSku}</span></td>
                                    <td>{item.quantity}</td>
                                    <td>{fmt(item.unitPrice)}</td>
                                    <td className="sod-td--amount">{fmt(item.totalLineAmount)}</td>
                                </tr>
                            ))}
                            </tbody>
                            <tfoot>
                            <tr className="sod-tfoot">
                                <td colSpan={5} style={{ textAlign: "right", fontWeight: 600 }}>Tổng cộng</td>
                                <td className="sod-td--total">{fmt(order.totalAmount)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* 3. Production Progress */}
                    <div className="sod-card">
                        <div className="sod-card__title">🏭 Tiến độ sản xuất</div>
                        <div className="sod-timeline">
                            {(order.productionProgress || []).map((stage, i) => {
                                const s = PROD_STAGE_STATUS[stage.status] || { icon: "○", cls: "sod-stage--pending" };
                                return (
                                    <div key={i} className={`sod-stage ${s.cls}`}>
                                        <div className="sod-stage__icon">{s.icon}</div>
                                        <div className="sod-stage__content">
                                            <div className="sod-stage__name">{stage.stage}</div>
                                            {stage.date && <div className="sod-stage__date">{fmtDate(stage.date)}</div>}
                                        </div>
                                        {i < order.productionProgress.length - 1 && <div className="sod-stage__line" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="sod-col-side">

                    {/* 4. Delivery Information */}
                    <div className="sod-card">
                        <div className="sod-card__title">🚚 Thông tin giao hàng</div>
                        <div className="sod-side-row">
                            <span className="sod-side-label">Trạng thái</span>
                            <span className={`so-badge ${ds.cls}`}>{ds.text}</span>
                        </div>
                        <div className="sod-side-row">
                            <span className="sod-side-label">Ngày giao dự kiến</span>
                            <span className="sod-side-value">{fmtDate(order.deliveryDate)}</span>
                        </div>
                        <div className="sod-side-row sod-side-row--col">
                            <span className="sod-side-label">Địa chỉ giao hàng</span>
                            <span className="sod-side-value">{order.deliveryAddress || "—"}</span>
                        </div>
                    </div>

                    {/* 5. Payment Information — sales staff only */}
                    {isSalesStaff && (
                        <div className="sod-card">
                            <div className="sod-card__title">💳 Thông tin thanh toán</div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Trạng thái</span>
                                <span className={`so-badge ${py.cls}`}>{py.text}</span>
                            </div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Tổng đơn hàng</span>
                                <span className="sod-side-value sod-side-value--purple">{fmt(order.totalAmount)}</span>
                            </div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Đã thanh toán</span>
                                <span className="sod-side-value sod-side-value--green">{fmt(totalPaid)}</span>
                            </div>
                            <div className="sod-divider" />
                            <div className="sod-side-row">
                                <span className="sod-side-label" style={{ fontWeight: 600 }}>Còn lại</span>
                                <span className="sod-side-value sod-side-value--red">{fmt(remaining)}</span>
                            </div>

                            {/* Payment history */}
                            {order.payments?.length > 0 && (
                                <div className="sod-payment-list">
                                    <div className="sod-payment-header">Lịch sử thanh toán</div>
                                    {order.payments.map((p, i) => (
                                        <div key={i} className="sod-payment-row">
                                            <div className="sod-payment-row__left">
                                                <span className="sod-payment-date">{fmtDate(p.date)}</span>
                                                <span className="sod-payment-method">{p.method}</span>
                                                {p.note && <span className="sod-payment-note">{p.note}</span>}
                                            </div>
                                            <span className="sod-payment-amount">{fmt(p.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};