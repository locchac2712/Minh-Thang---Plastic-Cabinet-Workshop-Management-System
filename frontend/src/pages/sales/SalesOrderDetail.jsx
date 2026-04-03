import { useState, useEffect, useRef } from "react";
import "./SalesPages.css";
import salesOrderService, { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "../../services/salesOrderService.js";
import { PaymentModal } from "./PaymentModal.jsx";

const fmt     = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleString("vi-VN") : "—";

const POLL_INTERVAL = 4000;
const POLL_TIMEOUT  = 15 * 60 * 1000;

const PRIORITY_OPTIONS = [
    { value: "LOW",    label: "Thấp",       color: "#64748b", bg: "#f1f5f9", icon: "🕒" },
    { value: "MEDIUM", label: "Trung bình", color: "#d97706", bg: "#fef3c7", icon: "⚡" },
    { value: "HIGH",   label: "Cao",        color: "#dc2626", bg: "#fef2f2", icon: "🔥" },
];

const InfoRow = ({ label, value }) => (
    <div className="sod-info-row">
        <span className="sod-info-label">{label}</span>
        <span className="sod-info-value">{value ?? "—"}</span>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   POPUP CẬP NHẬT LỆNH SẢN XUẤT (UPDATE PRIORITY)
───────────────────────────────────────────────────────────── */
const ProductionOrderPopup = ({ order, onClose, onSend }) => {
    // Ánh xạ từ Integer Backend sang String UI
    const getInitialPriority = (level) => {
        if (level === 1) return "HIGH";
        if (level === 2) return "MEDIUM";
        return "LOW";
    };

    const [priority, setPriority] = useState(getInitialPriority(order.priorityLevel));
    const [sending, setSending]   = useState(false);
    const [sent, setSent]         = useState(false);
    const [dueDate, setDueDate]   = useState("");

    const selectedPriority = PRIORITY_OPTIONS.find(p => p.value === priority);

    // Bên trong ProductionOrderPopup của SalesOrderDetail.jsx

    const handleUpdate = async () => {
        // Kiểm tra nếu chưa chọn ngày
        if (!dueDate) {
            alert("Vui lòng chọn ngày giao hàng dự kiến!");
            return;
        }

        setSending(true);
        try {
            const priorityMap = { "HIGH": 1, "MEDIUM": 2, "LOW": 3 };
            const level = priorityMap[priority];

            // TRUYỀN CẢ ĐỐI TƯỢNG VÀO ĐÂY:
            await salesOrderService.updatePriority(order.id, {
                level: level,
                dueDate: dueDate // dueDate lấy từ state của <input type="date">
            });

            setSent(true);
            setTimeout(() => {
                onSend?.();
                onClose();
            }, 1000);
        } catch (err) {
            setSending(false);
            const serverError = err.response?.data?.message || "Lỗi hệ thống";
            alert("Lỗi: " + serverError);
        }
    };

    return (
        <>
            <div
                onClick={!sending ? onClose : undefined}
                style={{
                    position: "fixed", inset: 0, zIndex: 1000,
                    background: "rgba(15,23,42,0.55)",
                    backdropFilter: "blur(3px)",
                }}
            />
            <div style={{
                position: "fixed", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                zIndex: 1001, width: "min(600px, 95vw)",
                background: "#fff", borderRadius: 18,
                boxShadow: "0 24px 80px rgba(15,23,42,.22)",
                overflow: "hidden",
            }}>
                <div style={{
                    background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                    padding: "18px 24px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 24 }}>🔄</span>
                        <div>
                            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Cập nhật Lệnh Sản Xuất</div>
                            <div style={{ color: "#ddd6fe", fontSize: 12, marginTop: 2 }}>Mã đơn: {order.orderNumber}</div>
                        </div>
                    </div>
                    <button onClick={onClose} disabled={sending} style={{
                        background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8,
                        color: "#fff", width: 32, height: 32, cursor: "pointer", fontSize: 20
                    }}>×</button>
                </div>

                <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                    <PopSection title="👤 Khách hàng">
                        <PopField label="Tên khách"  value={order.customer?.name} />
                    </PopSection>

                    <PopSection title="🎯 Mức độ ưu tiên">
                        <div style={{ display: "flex", gap: 10 }}>
                            {PRIORITY_OPTIONS.map(opt => (
                                <button key={opt.value} onClick={() => setPriority(opt.value)} style={{
                                    flex: 1, padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                                    border: priority === opt.value ? `2px solid ${opt.color}` : "2px solid #e2e8f0",
                                    background: priority === opt.value ? opt.bg : "#fff",
                                    color: opt.color, fontWeight: 700, fontSize: 13,
                                    transition: "all .15s",
                                }}>
                                    <div style={{ fontSize: 18, marginBottom: 4 }}>{opt.icon}</div>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </PopSection>

                    <PopSection title="📅 Hạn hoàn thành (Dự kiến)">
                        <input
                            type="date"
                            value={dueDate}
                            onChange={e => setDueDate(e.target.value)}
                            style={{
                                width: "100%", padding: "10px 12px", borderRadius: 8,
                                border: "1.5px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box"
                            }}
                        />
                    </PopSection>

                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                        <button onClick={onClose} disabled={sending} style={{
                            flex: 1, padding: "12px 0", borderRadius: 10,
                            border: "1.5px solid #e2e8f0", background: "#fff",
                            color: "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer",
                        }}>Đóng</button>
                        <button onClick={handleUpdate} disabled={sending || sent} style={{
                            flex: 2, padding: "12px 0", borderRadius: 10, border: "none",
                            background: sent ? "#16a34a" : "linear-gradient(135deg,#7c3aed,#5b21b6)",
                            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            transition: "all .2s",
                        }}>
                            {sent ? "✓ Đã cập nhật" : sending ? "⏳ Đang lưu..." : `Lưu `}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

const PopSection = ({ title, children }) => (
    <div style={{ background: "#fafafa", borderRadius: 10, padding: "14px 16px", border: "1px solid #f1f5f9" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#374151", marginBottom: 10 }}>{title}</div>
        {children}
    </div>
);

const PopField = ({ label, value }) => (
    <div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>{value || "—"}</div>
    </div>
);

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export const SalesOrderDetail = ({ orderId, onBack, isSalesStaff }) => {
    const [order,         setOrder]         = useState(null);
    const [payments,      setPayments]      = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState(null);
    const [showPayModal,  setShowPayModal]  = useState(false);
    const [showProdPopup, setShowProdPopup] = useState(false);

    const [polling, setPolling] = useState(false);
    const [pollMsg, setPollMsg] = useState("");
    const pollRef          = useRef(null);
    const startRef         = useRef(null);
    const prevPayStatusRef = useRef(null);

    const loadPaymentHistory = () =>
        salesOrderService.getPaymentHistory(orderId)
            .then(data => setPayments(Array.isArray(data) ? data : []))
            .catch(() => setPayments([]));

    const loadOrder = () =>
        salesOrderService.getById(orderId)
            .then(data => { setOrder(data); loadPaymentHistory(); })
            .catch(() => setError("Không thể tải chi tiết đơn hàng"));

    const stopPolling = () => {
        if (pollRef.current) clearInterval(pollRef.current);
        setPolling(false);
    };

    useEffect(() => {
        loadOrder().finally(() => setLoading(false));
        return () => stopPolling();
    }, [orderId]);

    const total       = Number(order?.totalAmount || 0);
    const paymentList = Array.isArray(payments) ? payments : [];
    const totalPaid   = paymentList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const remaining   = Math.max(0, total - totalPaid);

    let currentPayStatus = order?.paymentStatus;
    if (totalPaid >= total && total > 0) currentPayStatus = "PAID";
    else if (totalPaid > 0)              currentPayStatus = "PARTIAL";

    const py = PAYMENT_STATUS_MAP[currentPayStatus] || { text: currentPayStatus, cls: "" };
    const isProcessing = order?.status === "PROCESSING" || order?.status === "WAITING_FOR_DEPOSIT";

    // Tự động mở popup cập nhật khi trạng thái thanh toán chuyển từ chưa trả sang đã trả/đặt cọc
    useEffect(() => {
        if (!currentPayStatus) return;
        const prev = prevPayStatusRef.current;
        if (prev !== null && prev !== currentPayStatus) {
            if ((prev === "UNPAID" && (currentPayStatus === "PARTIAL" || currentPayStatus === "PAID")) || (prev === "PARTIAL" && currentPayStatus === "PAID")) {
                setShowProdPopup(true);
            }
        }
        prevPayStatusRef.current = currentPayStatus;
    }, [currentPayStatus]);

    const startPolling = (paymentType) => {
        setPolling(true);
        setPollMsg("⏳ Đang chờ hệ thống xác nhận...");
        startRef.current = Date.now();
        const expectedStatus = paymentType === "full" ? "PAID" : "PARTIAL";

        pollRef.current = setInterval(async () => {
            if (Date.now() - startRef.current > POLL_TIMEOUT) { stopPolling(); setPollMsg(""); return; }
            try {
                const fresh = await salesOrderService.getById(orderId);
                if (fresh.paymentStatus === expectedStatus || fresh.paymentStatus === "PAID") {
                    setOrder(fresh);
                    loadPaymentHistory();
                    stopPolling();
                    setPollMsg("✅ Thanh toán thành công");
                    setTimeout(() => setPollMsg(""), 3000);
                }
            } catch { }
        }, POLL_INTERVAL);
    };

    if (loading) return <div className="sp-page"><div className="sp-state"><div className="sp-spinner"></div></div></div>;
    if (error) return <div className="sp-page"><button className="cf-back-btn" onClick={onBack}>← Quay lại</button><div className="sp-state">❌ {error}</div></div>;
    if (!order) return null;

    return (
        <div className="sod-page">
            <div className="sod-header">
                <div>
                    <h1 className="sod-title">📑 Chi tiết Đơn hàng</h1>
                    <div className="sod-header-meta">
                        <span className="so-order-id">#{order.orderNumber}</span>
                        <span className={`so-badge ${py.cls}`}>{py.text}</span>
                    </div>
                </div>
                <button className="cf-back-btn" onClick={onBack}>← Quay lại</button>
            </div>

            <div className="sod-grid">
                <div className="sod-col-main">
                    <div className="sod-card">
                        <div className="sod-card__title">ℹ️ Thông tin chung</div>
                        <div className="sod-info-grid">
                            <InfoRow label="Ngày tạo"       value={fmtDate(order.createdDate)} />
                            <InfoRow label="Khách hàng"     value={order.customer?.name} />
                            <InfoRow label="Số điện thoại"  value={order.customer?.phone} />
                            <InfoRow label="Địa chỉ"        value={order.customer?.address} />
                        </div>
                    </div>

                    <div className="sod-card">
                        <div className="sod-card__title">📦 Sản phẩm đặt hàng</div>
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

                <div className="sod-col-side">
                    {isSalesStaff && (
                        <div className="sod-card">
                            <div className="sod-card__title">💰 Thanh toán</div>
                            <div className="sod-side-row"><span className="sod-side-label">Tổng đơn</span><span className="sod-side-value">{fmt(total)}</span></div>
                            <div className="sod-side-row"><span className="sod-side-label">Đã trả</span><span className="sod-side-value" style={{color:"#16a34a"}}>{fmt(totalPaid)}</span></div>
                            <div className="sod-divider"/>
                            <div className="sod-side-row"><span className="sod-side-label" style={{fontWeight:600}}>Còn lại</span><span className="sod-side-value" style={{color:"#dc2626"}}>{fmt(remaining)}</span></div>

                            {polling && <div className="sod-poll-banner">{pollMsg} <button onClick={stopPolling}>Dừng</button></div>}

                            {isProcessing && currentPayStatus !== "PAID" && (
                                <button className="pm-trigger-btn" onClick={() => setShowPayModal(true)} disabled={polling}>
                                    💳 Thanh toán / Đặt cọc
                                </button>
                            )}

                            {(currentPayStatus === "PARTIAL" || currentPayStatus === "PAID") && (
                                <button
                                    className="pm-trigger-btn"
                                    onClick={() => setShowProdPopup(true)}
                                    style={{
                                        marginTop: 10, background: "white", color: "#7c3aed",
                                        border: "1.5px solid #7c3aed", boxShadow: "none"
                                    }}
                                >
                                    🔄 Cập nhật lệnh sản xuất
                                </button>
                            )}
                        </div>
                    )}

                    <div className="sod-card">
                        <div className="sod-card__title">🕒 Lịch sử giao dịch</div>
                        {paymentList.length === 0 ? (
                            <div style={{fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "10px 0"}}>Chưa có giao dịch</div>
                        ) : (
                            <div className="sod-payment-list">
                                {paymentList.map((p, idx) => (
                                    <div key={p.id || idx} className="sod-pay-item">
                                        <div className="sod-pay-item__header">
                                            <span className="sod-pay-amount">{fmt(p.amount)}</span>
                                            <span className="sod-pay-date">{fmtDate(p.transactionDate)}</span>
                                        </div>
                                        <div className="sod-pay-method">💳 {p.paymentMethod}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPayModal && (
                <PaymentModal
                    isOpen={showPayModal}
                    onClose={() => setShowPayModal(false)}
                    order={order}
                    onSuccess={() => {
                        setShowPayModal(false);
                        loadOrder();
                    }}
                />
            )}

            {showProdPopup && (
                <ProductionOrderPopup
                    order={order}
                    onClose={() => setShowProdPopup(false)}
                    onSend={() => loadOrder()}
                />
            )}
        </div>
    );
};