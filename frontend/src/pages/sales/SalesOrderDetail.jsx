import { useState, useEffect } from "react";
import "./SalesPages.css";
import salesOrderService, { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "../../services/salesOrderService.js";

const fmt     = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const InfoRow = ({ label, value }) => (
    <div className="sod-info-row">
        <span className="sod-info-label">{label}</span>
        <span className="sod-info-value">{value ?? "—"}</span>
    </div>
);

export const SalesOrderDetail = ({ orderId, onBack, isSalesStaff }) => {
    const [order,   setOrder]   = useState(null);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState(null);

    useEffect(() => {
        salesOrderService.getById(orderId)
            .then(setOrder)
            .catch(() => setError("Không thể tải chi tiết đơn hàng"))
            .finally(() => setLoading(false));
    }, [orderId]);

    if (loading) return (
        <div className="sp-page">
            <div className="sp-state"><div className="sp-spinner"/><span>Đang tải...</span></div>
        </div>
    );
    if (error) return (
        <div className="sp-page">
            <button className="cf-back-btn" onClick={onBack} style={{marginBottom:16}}>← Quay lại</button>
            <div className="sp-state sp-state--error">⚠️ {error}</div>
        </div>
    );
    if (!order) return null;

    const os = ORDER_STATUS_MAP[order.status]          || { text: order.status,        cls: "" };
    const py = PAYMENT_STATUS_MAP[order.paymentStatus] || { text: order.paymentStatus, cls: "" };

    const totalPaid = 0; // TODO: khi có payment history từ API
    const remaining = Number(order.totalAmount || 0) - totalPaid;

    return (
        <div className="sod-page">
            {/* Header */}
            <div className="sod-header">
                <div>
                    <h1 className="sod-title">Chi tiết Đơn hàng</h1>
                    <div className="sod-header-meta">
                        <span className="so-order-id">{order.orderNumber}</span>
                        <span className={`so-badge ${os.cls}`}>{os.text}</span>
                    </div>
                </div>
                <button className="cf-back-btn" onClick={onBack}>← Quay lại</button>
            </div>

            <div className="sod-grid">
                {/* ── LEFT ── */}
                <div className="sod-col-main">

                    {/* 1. General Information */}
                    <div className="sod-card">
                        <div className="sod-card__title">📋 Thông tin chung</div>
                        <div className="sod-info-grid">
                            <InfoRow label="Mã đơn hàng"    value={order.orderNumber} />
                            <InfoRow label="Ngày tạo"        value={fmtDate(order.createdDate)} />
                            <InfoRow label="Khách hàng"      value={order.customer?.name} />
                            <InfoRow label="Email"           value={order.customer?.email} />
                            <InfoRow label="Số điện thoại"   value={order.customer?.phone} />
                            <InfoRow label="Địa chỉ"         value={order.customer?.address} />
                            {order.quotationNumber && (
                                <InfoRow label="Từ báo giá" value={order.quotationNumber} />
                            )}
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
                                <th>Chiết khấu</th>
                                <th>Thành tiền</th>
                            </tr>
                            </thead>
                            <tbody>
                            {(order.details || []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="sod-td--idx">{i + 1}</td>
                                    <td className="sod-td--name">{item.productName}</td>
                                    <td><span className="sod-sku">{item.productSku}</span></td>
                                    <td>{item.quantity}</td>
                                    <td>{fmt(item.unitPrice)}</td>
                                    <td>{item.discount > 0 ? fmt(item.discount) : "—"}</td>
                                    <td className="sod-td--amount">{fmt(item.totalLineAmount)}</td>
                                </tr>
                            ))}
                            </tbody>
                            <tfoot>
                            <tr className="sod-tfoot">
                                <td colSpan={6} style={{ textAlign: "right", fontWeight: 600 }}>Tổng cộng</td>
                                <td className="sod-td--total">{fmt(order.totalAmount)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* 3. Production Progress — placeholder */}
                    <div className="sod-card">
                        <div className="sod-card__title">🏭 Tiến độ sản xuất</div>
                        <div className="sod-timeline">
                            {[
                                { stage: "Chuẩn bị nguyên liệu", done: false },
                                { stage: "Gia công sản phẩm",    done: false },
                                { stage: "Kiểm tra chất lượng",  done: false },
                                { stage: "Đóng gói",             done: false },
                            ].map((s, i) => (
                                <div key={i} className={`sod-stage${s.done ? " sod-stage--done" : " sod-stage--pending"}`}>
                                    <div className="sod-stage__icon">{s.done ? "✓" : "○"}</div>
                                    <div className="sod-stage__content">
                                        <div className="sod-stage__name">{s.stage}</div>
                                    </div>
                                    {i < 3 && <div className="sod-stage__line"/>}
                                </div>
                            ))}
                        </div>
                        <p style={{fontSize:12,color:"#9ca3af",marginTop:12}}>
                            * Tiến độ sản xuất chi tiết sẽ được cập nhật khi có lệnh sản xuất.
                        </p>
                    </div>
                </div>

                {/* ── RIGHT ── */}
                <div className="sod-col-side">

                    {/* 4. Delivery Information */}
                    <div className="sod-card">
                        <div className="sod-card__title">🚚 Thông tin giao hàng</div>
                        <div className="sod-side-row">
                            <span className="sod-side-label">Trạng thái đơn</span>
                            <span className={`so-badge ${os.cls}`}>{os.text}</span>
                        </div>
                        <div className="sod-side-row sod-side-row--col" style={{marginTop:8}}>
                            <span className="sod-side-label">Địa chỉ giao hàng</span>
                            <span className="sod-side-value">{order.customer?.address || "—"}</span>
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
                            <div className="sod-divider"/>
                            <div className="sod-side-row">
                                <span className="sod-side-label" style={{fontWeight:600}}>Còn lại</span>
                                <span className="sod-side-value sod-side-value--red">{fmt(remaining)}</span>
                            </div>
                        </div>
                    )}

                    {/* Quotation link */}
                    {order.quotationNumber && (
                        <div className="sod-card">
                            <div className="sod-card__title">📄 Báo giá gốc</div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Mã báo giá</span>
                                <span className="sq-quote-id">{order.quotationNumber}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};