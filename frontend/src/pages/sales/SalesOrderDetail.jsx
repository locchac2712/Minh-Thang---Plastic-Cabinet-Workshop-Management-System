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
    const [payments,     setPayments]     = useState([]); // Lưu lịch sử giao dịch thực tế
    const [loading,      setLoading]      = useState(true);
    const [error,        setError]        = useState(null);
    const [showPayModal, setShowPayModal] = useState(false);

    // Polling state
    const [polling,      setPolling]      = useState(false);
    const [pollMsg,      setPollMsg]      = useState("");
    const pollRef  = useRef(null);
    const startRef = useRef(null);

    // 1. Hàm load lịch sử thanh toán từ API
    const loadPaymentHistory = () => {
        return salesOrderService.getPaymentHistory(orderId)
            .then(setPayments)
            .catch(err => console.error("Lỗi load lịch sử thanh toán:", err));
    };

    // 2. Hàm load đơn hàng (Duy nhất 1 hàm)
    const loadOrder = () => {
        return salesOrderService.getById(orderId)
            .then(data => {
                setOrder(data);
                loadPaymentHistory(); // Load lịch sử ngay sau khi có order
            })
            .catch(() => setError("Không thể tải chi tiết đơn hàng"));
    };

    useEffect(() => {
        loadOrder().finally(() => setLoading(false));
        return () => stopPolling();
    }, [orderId]);

    // Tính toán số tiền dựa trên lịch sử payments thực tế
    const total = Number(order?.totalAmount || 0);
    // Kiểm tra kỹ nếu payments là null hoặc undefined thì mặc định là mảng rỗng []
    const paymentList = Array.isArray(payments) ? payments : [];

// Tính toán số tiền thực tế từ lịch sử
    const actualPaidFromHistory = paymentList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);


    // Nếu đơn hàng đánh dấu PAID mà history rỗng (do data cũ), dùng total. Ngược lại dùng tổng thực tế.
    const totalPaid = actualPaidFromHistory;

    const remaining = Math.max(0, total - totalPaid);

    // ── Polling xử lý khi khách quét mã QR PayOS ─────────────────────
    const startPolling = (paymentType) => {
        setPolling(true);
        const expectedStatus = paymentType === "full" ? "PAID" : "PARTIAL";
        setPollMsg(paymentType === "full" ? "Đang chờ khách thanh toán toàn bộ..." : "Đang chờ khách đặt cọc...");
        startRef.current = Date.now();

        pollRef.current = setInterval(async () => {
            if (Date.now() - startRef.current > POLL_TIMEOUT) {
                stopPolling();
                setPollMsg("");
                return;
            }
            try {
                const fresh = await salesOrderService.getById(orderId);
                // Nếu backend báo đã đổi trạng thái thanh toán
                if (fresh.paymentStatus === expectedStatus || fresh.paymentStatus === "PAID") {
                    setOrder(fresh);
                    loadPaymentHistory(); // Cập nhật lại danh sách lịch sử ngay lập tức
                    stopPolling();
                    setPollMsg("✓ Đã nhận thanh toán!");
                    setTimeout(() => setPollMsg(""), 4000);
                }
            } catch { /* Bỏ qua lỗi mạng tạm thời */ }
        }, POLL_INTERVAL);
    };

    const stopPolling = () => {
        clearInterval(pollRef.current);
        setPolling(false);
    };

    const handlePayConfirm = (paid, type) => {
        startPolling(type);
    };

    if (loading) return (
        <div className="sp-page"><div className="sp-state"><div className="sp-spinner"/><span>Đang tải...</span></div></div>
    );
    if (error) return (
        <div className="sp-page">
            <button className="cf-back-btn" onClick={onBack} style={{marginBottom:16}}>← Quay lại</button>
            <div className="sp-state sp-state--error">⚠️ {error}</div>
        </div>
    );
    if (!order) return null;

    const os = ORDER_STATUS_MAP[order.status]          || { text: order.status, cls: "" };
    const py = PAYMENT_STATUS_MAP[order.paymentStatus] || { text: order.paymentStatus, cls: "" };
    const isProcessing = order.status === "PROCESSING" || order.status === "WAITING_FOR_DEPOSIT";

    return (
        <div className="sod-page">
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
                    <div className="sod-card">
                        <div className="sod-card__title"> Thông tin chung</div>
                        <div className="sod-info-grid">
                            <InfoRow label="Mã đơn hàng"   value={order.orderNumber} />
                            <InfoRow label="Ngày tạo"       value={fmtDate(order.createdDate)} />
                            <InfoRow label="Khách hàng"     value={order.customer?.name} />
                            <InfoRow label="Số điện thoại"     value={order.customer?.phone} />
                            <InfoRow label="Địa chỉ"     value={order.customer?.address} />
                        </div>
                    </div>

                    <div className="sod-card">
                        <div className="sod-card__title"> Sản phẩm đặt hàng</div>
                        <table className="sod-table">
                            <thead>
                            <tr><th>#</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr>
                            </thead>
                            <tbody>
                            {(order.details || []).map((item, i) => (
                                <tr key={item.id}>
                                    <td className="sod-td--idx">{i + 1}</td>
                                    <td className="sod-td--name">{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td>{fmt(item.unitPrice)}</td>
                                    <td className="sod-td--amount">{fmt(item.totalLineAmount)}</td>
                                </tr>
                            ))}
                            </tbody>
                            <tfoot>
                            <tr className="sod-tfoot">
                                <td colSpan={4} style={{textAlign:"right",fontWeight:600}}>Tổng cộng</td>
                                <td className="sod-td--total">{fmt(order.totalAmount)}</td>
                            </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                {/* ── RIGHT ── */}
                <div className="sod-col-side">
                    {isSalesStaff && (
                        <div className="sod-card">
                            <div className="sod-card__title"> Thông tin thanh toán</div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Trạng thái</span>
                                <span className={`so-badge ${py.cls}`}>{py.text}</span>
                            </div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Tổng đơn</span>
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

                            {polling && (
                                <div className="sod-poll-banner">
                                    <span className="sod-poll-dot"/><span className="sod-poll-dot sod-poll-dot--2"/>
                                    {pollMsg}
                                    <button className="sod-poll-cancel" onClick={stopPolling}>Dừng</button>
                                </div>
                            )}

                            {!polling && pollMsg && <div className="sod-paid-banner">{pollMsg}</div>}

                            {isProcessing && order.paymentStatus !== "PAID" && (
                                <button className="pm-trigger-btn" onClick={() => setShowPayModal(true)} disabled={polling}>
                                    {order.paymentStatus === "PARTIAL" ? " Thanh toán thêm" : " Thanh toán / Đặt cọc"}
                                </button>
                            )}
                            {order.paymentStatus === "PAID" && <div className="pm-paid-tag">✓ Đã thanh toán đầy đủ</div>}
                        </div>
                    )}

                    {/* LỊCH SỬ GIAO DỊCH THAY THẾ BÁO GIÁ GỐC */}
                    <div className="sod-card">
                        <div className="sod-card__title"> Lịch sử giao dịch</div>
                        {payments.length === 0 ? (
                            <div style={{fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px 0"}}>
                                Chưa có giao dịch nào
                            </div>
                        ) : (
                            <div className="sod-payment-list">
                                {payments.map((p, idx) => (
                                    <div key={idx} className="sod-pay-item">
                                        <div className="sod-pay-item__header">
                                            <span className="sod-pay-amount">{fmt(p.amount)}</span>
                                            <span className="sod-pay-date">{fmtDate(p.paymentDate)}</span>
                                        </div>
                                        <div className="sod-pay-method">
                                            {p.paymentMethod} • <small>{p.transactionCode || 'N/A'}</small>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPayModal && (
                <PaymentModal order={order} onClose={() => setShowPayModal(false)} onConfirm={handlePayConfirm} />
            )}

            <style>{`
                .sod-payment-list { display: flex; flex-direction: column; gap: 10px; margin-top: 8px; }
                .sod-pay-item { padding: 8px; border-radius: 6px; background: #f8fafc; border-left: 3px solid #7c3aed; }
                .sod-pay-item__header { display: flex; justify-content: space-between; align-items: center; }
                .sod-pay-amount { font-weight: 700; color: #1e293b; font-size: 13px; }
                .sod-pay-date { font-size: 11px; color: #64748b; }
                .sod-pay-method { font-size: 11px; color: #7c3aed; margin-top: 2px; }
                .pm-trigger-btn {
                    margin-top:14px; width:100%; padding:10px 0; border-radius:10px; border:none;
                    background:linear-gradient(135deg,#7c3aed,#5b21b6); color:#fff; font-size:13px; font-weight:700;
                    cursor:pointer; transition:all .15s; box-shadow:0 2px 10px rgba(124,58,237,.25);
                }
                .pm-trigger-btn:disabled { opacity:.5; cursor:not-allowed; }
                .pm-paid-tag {
                    margin-top:14px; text-align:center; padding:8px 0; border-radius:8px;
                    background:#f0fdf4; color:#15803d; font-size:13px; font-weight:700; border:1.5px solid #bbf7d0;
                }
                .sod-poll-banner {
                    margin-top:12px; padding:10px 12px; border-radius:10px; background:#f5f0ff;
                    border:1.5px solid #ddd6fe; display:flex; align-items:center; gap:5px; font-size:12px; font-weight:600; color:#5b21b6;
                }
                .sod-poll-dot { width:6px; height:6px; border-radius:50%; background:#7c3aed; animation:pollPulse 1.2s ease-in-out infinite; }
                .sod-poll-dot--2 { animation-delay:.2s; }
                @keyframes pollPulse { 0%,80%,100%{opacity:.25;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
                .sod-paid-banner { margin-top:12px; padding:10px 12px; border-radius:10px; background:#f0fdf4; border:1.5px solid #bbf7d0; font-size:13px; font-weight:700; color:#15803d; text-align:center; }
            `}</style>
        </div>
    );
};