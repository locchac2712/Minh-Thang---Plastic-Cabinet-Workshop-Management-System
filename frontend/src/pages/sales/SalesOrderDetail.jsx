import { useState, useEffect, useRef } from "react";
import "./SalesPages.css";
import salesOrderService, { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "../../services/salesOrderService.js";
import { PaymentModal } from "./PaymentModal.jsx";

const fmt     = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " \u0111" : "\u2014";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "\u2014";

const POLL_INTERVAL = 4000;  // kiểm tra mỗi 4 giây
const POLL_TIMEOUT  = 15 * 60 * 1000; // dừng sau 15 phút

const InfoRow = ({ label, value }) => (
    <div className="sod-info-row">
        <span className="sod-info-label">{label}</span>
        <span className="sod-info-value">{value ?? "\u2014"}</span>
    </div>
);

export const SalesOrderDetail = ({ orderId, onBack, isSalesStaff }) => {
    const [order,        setOrder]        = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);

    // Polling state
    const [polling,      setPolling]      = useState(false); // đang chờ PayOS
    const [pollMsg,      setPollMsg]      = useState("");    // thông báo đang chờ
    const pollRef  = useRef(null);
    const startRef = useRef(null);

    // Load đơn hàng
    const loadOrder = () => {
        return salesOrderService.getById(orderId)
            .then(setOrder)
            .catch(() => setError("Không thể tải chi tiết đơn hàng"));
    };

    useEffect(() => {
        loadOrder().finally(() => setLoading(false));
        return () => stopPolling();
    }, [orderId]);

    // ── Bắt đầu polling sau khi xuất PDF ─────────────────────
    const startPolling = (paymentType) => {
        setPolling(true);
        const expectedStatus = paymentType === "full" ? "PAID" : "PARTIAL";
        setPollMsg(
            paymentType === "full"
                ? "Đang chờ khách thanh toán toàn bộ..."
                : "Đang chờ khách đặt cọc..."
        );
        startRef.current = Date.now();

        pollRef.current = setInterval(async () => {
            // Timeout sau 15 phút
            if (Date.now() - startRef.current > POLL_TIMEOUT) {
                stopPolling();
                setPollMsg("");
                return;
            }
            try {
                const fresh = await salesOrderService.getById(orderId);
                if (fresh.paymentStatus === expectedStatus || fresh.paymentStatus === "PAID") {
                    setOrder(fresh);
                    stopPolling();
                    setPollMsg("✓ Đã nhận thanh toán!");
                    // Xóa thông báo sau 4 giây
                    setTimeout(() => setPollMsg(""), 4000);
                }
            } catch {
                // bỏ qua lỗi mạng tạm thời
            }
        }, POLL_INTERVAL);
    };

    const stopPolling = () => {
        clearInterval(pollRef.current);
        setPolling(false);
    };

    // ── Callback từ PaymentModal khi xuất PDF xong ────────────
    const handlePayConfirm = (paid, type) => {
        // Bắt đầu polling để detect khi khách quét QR xong
        startPolling(type);
    };

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

    const total     = Number(order.totalAmount || 0);
    const totalPaid = order.paymentStatus === "PAID"    ? total
        : order.paymentStatus === "PARTIAL"  ? total * 0.3  // ước tính
            : 0;
    const remaining = total - totalPaid;
    // Cho phep thanh toan khi PROCESSING hoac WAITING_FOR_DEPOSIT
    const isProcessing = order.status === "PROCESSING" || order.status === "WAITING_FOR_DEPOSIT";

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

                    {/* 1. General Info */}
                    <div className="sod-card">
                        <div className="sod-card__title">📋 Thông tin chung</div>
                        <div className="sod-info-grid">
                            <InfoRow label="Mã đơn hàng"   value={order.orderNumber} />
                            <InfoRow label="Ngày tạo"       value={fmtDate(order.createdDate)} />
                            <InfoRow label="Khách hàng"     value={order.customer?.name} />
                            <InfoRow label="Email"          value={order.customer?.email} />
                            <InfoRow label="Số điện thoại"  value={order.customer?.phone} />
                            <InfoRow label="Địa chỉ"        value={order.customer?.address} />
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
                                <th>#</th><th>Sản phẩm</th><th>SKU</th>
                                <th>SL</th><th>Đơn giá</th><th>Chiết khấu</th><th>Thành tiền</th>
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
                                <td colSpan={6} style={{textAlign:"right",fontWeight:600}}>Tổng cộng</td>
                                <td className="sod-td--total">{fmt(order.totalAmount)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* 3. Production Progress */}
                    <div className="sod-card">
                        <div className="sod-card__title">🏭 Tiến độ sản xuất</div>
                        <div className="sod-timeline">
                            {["Chuẩn bị nguyên liệu","Gia công sản phẩm","Kiểm tra chất lượng","Đóng gói"].map((s, i, arr) => (
                                <div key={i} className="sod-stage sod-stage--pending">
                                    <div className="sod-stage__icon">○</div>
                                    <div className="sod-stage__content">
                                        <div className="sod-stage__name">{s}</div>
                                    </div>
                                    {i < arr.length - 1 && <div className="sod-stage__line"/>}
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

                    {/* 4. Delivery */}
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

                    {/* 5. Payment — sales staff only */}
                    {isSalesStaff && (
                        <div className="sod-card">
                            <div className="sod-card__title">💳 Thông tin thanh toán</div>

                            {/* Trạng thái thanh toán — lấy thẳng từ order (cập nhật qua polling) */}
                            <div className="sod-side-row">
                                <span className="sod-side-label">Trạng thái</span>
                                <span className={`so-badge ${py.cls}`}>{py.text}</span>
                            </div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Tổng đơn hàng</span>
                                <span className="sod-side-value sod-side-value--purple">{fmt(total)}</span>
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

                            {/* Polling indicator — hiện khi đang chờ khách quét QR */}
                            {polling && (
                                <div className="sod-poll-banner">
                                    <span className="sod-poll-dot"/><span className="sod-poll-dot sod-poll-dot--2"/><span className="sod-poll-dot sod-poll-dot--3"/>
                                    {pollMsg}
                                    <button className="sod-poll-cancel" onClick={stopPolling}>Dừng</button>
                                </div>
                            )}

                            {/* Thông báo nhận tiền thành công */}
                            {!polling && pollMsg && (
                                <div className="sod-paid-banner">{pollMsg}</div>
                            )}

                            {/* Nút xuất hóa đơn */}
                            {isProcessing && order.paymentStatus !== "PAID" && (
                                <button
                                    className="pm-trigger-btn"
                                    onClick={() => setShowPayModal(true)}
                                    disabled={polling}
                                >
                                    {order.paymentStatus === "PARTIAL"
                                        ? "💳 Thanh toán thêm"
                                        : "💳 Thanh toán / Đặt cọc"}
                                </button>
                            )}

                            {order.paymentStatus === "PAID" && (
                                <div className="pm-paid-tag">✓ Đã thanh toán đầy đủ</div>
                            )}

                            <style>{`
                                .pm-trigger-btn {
                                    margin-top:14px; width:100%;
                                    padding:10px 0; border-radius:10px; border:none;
                                    background:linear-gradient(135deg,#7c3aed,#5b21b6);
                                    color:#fff; font-size:13px; font-weight:700;
                                    font-family:inherit; cursor:pointer; transition:all .15s;
                                    box-shadow:0 2px 10px rgba(124,58,237,.25);
                                }
                                .pm-trigger-btn:hover:not(:disabled) {
                                    transform:translateY(-1px);
                                    box-shadow:0 4px 16px rgba(124,58,237,.35);
                                }
                                .pm-trigger-btn:disabled { opacity:.5; cursor:not-allowed; }
                                .pm-paid-tag {
                                    margin-top:14px; text-align:center;
                                    padding:8px 0; border-radius:8px;
                                    background:#f0fdf4; color:#15803d;
                                    font-size:13px; font-weight:700;
                                    border:1.5px solid #bbf7d0;
                                }
                                .sod-poll-banner {
                                    margin-top:12px; padding:10px 12px;
                                    border-radius:10px; background:#f5f0ff;
                                    border:1.5px solid #ddd6fe;
                                    display:flex; align-items:center; gap:5px;
                                    font-size:12px; font-weight:600; color:#5b21b6;
                                }
                                .sod-poll-dot {
                                    width:6px; height:6px; border-radius:50%;
                                    background:#7c3aed; flex-shrink:0;
                                    animation:pollPulse 1.2s ease-in-out infinite;
                                }
                                .sod-poll-dot--2 { animation-delay:.2s; }
                                .sod-poll-dot--3 { animation-delay:.4s; }
                                @keyframes pollPulse {
                                    0%,80%,100%{opacity:.25;transform:scale(.8)}
                                    40%{opacity:1;transform:scale(1)}
                                }
                                .sod-poll-cancel {
                                    margin-left:auto; background:none; border:none;
                                    color:#9c8dba; font-size:11px; cursor:pointer;
                                    padding:2px 6px; border-radius:4px;
                                }
                                .sod-poll-cancel:hover { background:#ede8ff; color:#5b21b6; }
                                .sod-paid-banner {
                                    margin-top:12px; padding:10px 12px;
                                    border-radius:10px; background:#f0fdf4;
                                    border:1.5px solid #bbf7d0;
                                    font-size:13px; font-weight:700; color:#15803d;
                                    text-align:center;
                                }
                            `}</style>
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

            {showPayModal && (
                <PaymentModal
                    order={order}
                    onClose={() => setShowPayModal(false)}
                    onConfirm={handlePayConfirm}
                />
            )}
        </div>
    );
};