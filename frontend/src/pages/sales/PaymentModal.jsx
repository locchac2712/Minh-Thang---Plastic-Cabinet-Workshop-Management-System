import { useState, useEffect, useRef } from "react";
import paymentService from "../../services/paymentService.js";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";

const DEPOSIT_MIN_RATIO = 0.3;
const POLL_INTERVAL_MS  = 3000;        // polling mỗi 3 giây
const QR_TIMEOUT_SEC    = 10 * 60;     // QR hết hạn sau 10 phút

const STEP_SELECT = "SELECT";
const STEP_QR     = "QR";
const STEP_DONE   = "DONE";

/**
 * PaymentModal
 * Props:
 *   order     – { id, orderNumber, totalAmount, customer: { name } | customerName }
 *   onClose   – () => void
 *   onConfirm – (paid: number, type: 'full'|'deposit') => void
 */
export const PaymentModal = ({ order, onClose, onConfirm }) => {
    const total      = Number(order.totalAmount || 0);
    const minDeposit = Math.ceil(total * DEPOSIT_MIN_RATIO);

    const [paymentType,   setPaymentType]   = useState(null);
    const [depositAmount, setDepositAmount] = useState(minDeposit);
    const [step,          setStep]          = useState(STEP_SELECT);
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState(null);
    const [qrCode,        setQrCode]        = useState(null);
    const [checkoutUrl,   setCheckoutUrl]   = useState(null);
    const [paymentLinkId, setPaymentLinkId] = useState(null);
    const [timeLeft,      setTimeLeft]      = useState(QR_TIMEOUT_SEC);

    const pollRef    = useRef(null);
    const timerRef   = useRef(null);
    const pollingRef = useRef(false);

    const isDepositValid = depositAmount >= minDeposit && depositAmount < total;
    const finalAmount    = paymentType === "full" ? total : depositAmount;
    const canProceed     = paymentType === "full" || (paymentType === "deposit" && isDepositValid);

    // cleanup khi unmount
    useEffect(() => () => {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
    }, []);

    // bắt đầu polling + đếm ngược khi vào bước QR
    useEffect(() => {
        if (step !== STEP_QR || !paymentLinkId || pollingRef.current) return;
        pollingRef.current = true;

        // đếm ngược
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    clearInterval(pollRef.current);
                    pollingRef.current = false;
                    setError("QR đã hết hạn. Vui lòng tạo lại.");
                    setStep(STEP_SELECT);
                    return 0;
                }
                return t - 1;
            });
        }, 1000);

        // polling trạng thái
        pollRef.current = setInterval(async () => {
            try {
                const res = await paymentService.checkPayOSStatus(paymentLinkId);
                if (res.status === "PAID") {
                    clearInterval(pollRef.current);
                    clearInterval(timerRef.current);
                    pollingRef.current = false;
                    setStep(STEP_DONE);
                    setTimeout(() => {
                        onConfirm(finalAmount, paymentType);
                        onClose();
                    }, 2400);
                } else if (res.status === "CANCELLED" || res.status === "EXPIRED") {
                    clearInterval(pollRef.current);
                    clearInterval(timerRef.current);
                    pollingRef.current = false;
                    setError("Giao dịch đã bị huỷ hoặc hết hạn.");
                    setStep(STEP_SELECT);
                }
            } catch { /* bỏ qua lỗi mạng tạm thời */ }
        }, POLL_INTERVAL_MS);
    }, [step, paymentLinkId]);

    // tạo link PayOS
    const handleCreatePayOS = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await paymentService.createPayOSLink({
                orderId:     order.id,
                orderNumber: order.orderNumber,
                amount:      finalAmount,
                paymentType: paymentType === "full" ? "FULL" : "DEPOSIT",
                buyerName:   order.customer?.name || order.customerName || "",
            });
            setQrCode(res.qrCode);
            setCheckoutUrl(res.checkoutUrl);
            setPaymentLinkId(res.paymentLinkId);
            setTimeLeft(QR_TIMEOUT_SEC);
            pollingRef.current = false;
            setStep(STEP_QR);
        } catch (err) {
            setError(err?.response?.data?.message || "Không thể tạo link thanh toán. Thử lại!");
        } finally {
            setLoading(false);
        }
    };

    // huỷ QR
    const handleCancelQR = async () => {
        clearInterval(pollRef.current);
        clearInterval(timerRef.current);
        pollingRef.current = false;
        if (paymentLinkId) {
            try { await paymentService.cancelPayOSLink(paymentLinkId); } catch {
                // bỏ qua lỗi huỷ link (có thể do link đã được thanh toán hoặc đã hết hạn)

            }
        }
        setQrCode(null);
        setPaymentLinkId(null);
        setError(null);
        setStep(STEP_SELECT);
    };

    const fmtTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

    // backdrop click: không cho đóng khi đang ở bước QR
    const handleBackdropClick = (e) => {
        if (e.target !== e.currentTarget) return;
        if (step === STEP_QR) return;
        onClose();
    };

    return (
        <div className="pm-backdrop" onClick={handleBackdropClick}>
            <div className="pm-box">

                {/* ═══════════════ STEP: DONE ═══════════════ */}
                {step === STEP_DONE && (
                    <div className="pm-success">
                        <div className="pm-success__ring">
                            <div className="pm-success__icon">✓</div>
                        </div>
                        <p className="pm-success__title">Thanh toán thành công!</p>
                        <span className="pm-success__amount">{fmt(finalAmount)}</span>
                        <span className="pm-success__sub">
                            {paymentType === "full" ? "Đã thanh toán toàn bộ đơn hàng" : "Đã đặt cọc thành công"}
                        </span>
                    </div>
                )}

                {/* ═══════════════ STEP: QR ═══════════════ */}
                {step === STEP_QR && (
                    <>
                        <div className="pm-header">
                            <div>
                                <span className="pm-order-badge">{order.orderNumber}</span>
                                <h2 className="pm-title">Quét mã thanh toán</h2>
                            </div>
                            <div className="pm-payos-brand">
                                <span>Powered by</span>
                                <strong>PayOS</strong>
                            </div>
                        </div>

                        <div className="pm-qr-body">
                            {/* amount banner */}
                            <div className="pm-qr-amount-banner">
                                <span className="pm-qr-amount-banner__label">
                                    {paymentType === "full" ? "💳 Thanh toán toàn bộ" : "🪙 Đặt cọc"}
                                </span>
                                <span className="pm-qr-amount-banner__value">{fmt(finalAmount)}</span>
                            </div>

                            {/* QR + logo */}
                            <div className="pm-qr-frame">
                                <img src={qrCode} alt="PayOS QR" className="pm-qr-img" />
                                <div className="pm-qr-corner pm-qr-corner--tl"/>
                                <div className="pm-qr-corner pm-qr-corner--tr"/>
                                <div className="pm-qr-corner pm-qr-corner--bl"/>
                                <div className="pm-qr-corner pm-qr-corner--br"/>
                            </div>

                            {/* timer */}
                            <div className={`pm-qr-timer${timeLeft <= 60 ? " pm-qr-timer--urgent" : ""}`}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                </svg>
                                Hết hạn sau&nbsp;<strong>{fmtTime(timeLeft)}</strong>
                            </div>

                            {/* steps */}
                            <div className="pm-qr-steps">
                                {["Mở app ngân hàng", "Chọn Quét QR", "Xác nhận thanh toán"].map((s, i) => (
                                    <div key={i} className="pm-qr-step">
                                        <span className="pm-qr-step__num">{i + 1}</span>
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>

                            {checkoutUrl && (
                                <a href={checkoutUrl} target="_blank" rel="noreferrer" className="pm-qr-open-link">
                                    Không quét được? Mở trang thanh toán ↗
                                </a>
                            )}
                        </div>

                        <div className="pm-footer pm-footer--qr">
                            <button className="pm-btn pm-btn--cancel-qr" onClick={handleCancelQR}>
                                ✕ Huỷ giao dịch
                            </button>
                            <div className="pm-polling">
                                <span className="pm-polling__dot"/>
                                <span className="pm-polling__dot pm-polling__dot--2"/>
                                <span className="pm-polling__dot pm-polling__dot--3"/>
                                Đang chờ thanh toán
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════════ STEP: SELECT ═══════════════ */}
                {step === STEP_SELECT && (
                    <>
                        <div className="pm-header">
                            <div>
                                <span className="pm-order-badge">{order.orderNumber}</span>
                                <h2 className="pm-title">Xác nhận thanh toán</h2>
                            </div>
                            <button className="pm-close" onClick={onClose}>✕</button>
                        </div>

                        {error && <div className="pm-error-banner">⚠️ {error}</div>}

                        {/* Info */}
                        <div className="pm-info">
                            <div className="pm-info-row">
                                <span>Khách hàng</span>
                                <strong>{order.customer?.name || order.customerName}</strong>
                            </div>
                            <div className="pm-info-row pm-info-row--highlight">
                                <span>Giá trị đơn hàng</span>
                                <strong className="pm-total">{fmt(total)}</strong>
                            </div>
                            <div className="pm-info-row">
                                <span>Đặt cọc tối thiểu (30%)</span>
                                <strong className="pm-deposit-min">{fmt(minDeposit)}</strong>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="pm-options">
                            <p className="pm-options__label">Hình thức thanh toán</p>
                            <div className="pm-option-list">
                                <div className={`pm-option${paymentType === "full" ? " pm-option--active" : ""}`}
                                     onClick={() => setPaymentType("full")}>
                                    <span className="pm-option__icon">💳</span>
                                    <div className="pm-option__text">
                                        <strong>Thanh toán toàn bộ</strong>
                                        <span>{fmt(total)}</span>
                                    </div>
                                    <span className="pm-option__radio">{paymentType === "full" ? "●" : "○"}</span>
                                </div>
                                <div className={`pm-option${paymentType === "deposit" ? " pm-option--active" : ""}`}
                                     onClick={() => setPaymentType("deposit")}>
                                    <span className="pm-option__icon">🪙</span>
                                    <div className="pm-option__text">
                                        <strong>Đặt cọc</strong>
                                        <span>Tối thiểu {fmt(minDeposit)}</span>
                                    </div>
                                    <span className="pm-option__radio">{paymentType === "deposit" ? "●" : "○"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deposit input */}
                        {paymentType === "deposit" && (
                            <div className="pm-deposit-group">
                                <label className="pm-deposit-label">Số tiền đặt cọc</label>
                                <div className="pm-deposit-input-wrap">
                                    <input
                                        className={`pm-deposit-input${!isDepositValid ? " pm-deposit-input--error" : ""}`}
                                        value={depositAmount.toLocaleString("vi-VN")}
                                        onChange={(e) => setDepositAmount(Number(e.target.value.replace(/\D/g, "")))}
                                    />
                                    <span className="pm-deposit-unit">đ</span>
                                </div>
                                {!isDepositValid && (
                                    <p className="pm-deposit-error">
                                        Số tiền đặt cọc phải ≥ {fmt(minDeposit)} và &lt; {fmt(total)}
                                    </p>
                                )}
                                <div className="pm-bar">
                                    <div className="pm-bar__fill"
                                         style={{ width: `${Math.min((depositAmount / total) * 100, 100)}%` }}/>

                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pm-footer">
                            <button className="pm-btn pm-btn--cancel" onClick={onClose}>Hủy</button>
                            <button
                                className={`pm-btn pm-btn--payos${!canProceed || loading ? " pm-btn--disabled" : ""}`}
                                onClick={canProceed && !loading ? handleCreatePayOS : undefined}
                                disabled={!canProceed || loading}
                            >
                                {loading
                                    ? <><span className="pm-spinner"/>  Đang tạo...</>
                                    : <><span className="pm-payos-icon">⬡</span> Thanh toán qua PayOS</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .pm-backdrop {
                    position: fixed; inset: 0;
                    background: rgba(10,10,20,.58);
                    backdrop-filter: blur(6px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                    animation: pmFadeIn .16s ease;
                }
                @keyframes pmFadeIn { from{opacity:0}to{opacity:1} }

                .pm-box {
                    background: #fff; border-radius: 20px;
                    width: 600px; max-width: 96vw;
                    box-shadow: 0 32px 80px rgba(80,40,160,.22), 0 4px 16px rgba(0,0,0,.10);
                    font-family: inherit;
                    animation: pmSlide .22s cubic-bezier(.4,0,.2,1);
                    overflow: hidden;
                }
                @keyframes pmSlide { from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1} }

                /* header */
                .pm-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    padding: 28px 32px 20px;
                    background: linear-gradient(135deg,#faf8ff,#f3eeff);
                    border-bottom: 1px solid #ede9fe;
                }
                .pm-order-badge {
                    display: inline-block; background: #7c3aed; color: #fff;
                    font-size: 12px; font-weight: 700; letter-spacing:.04em;
                    border-radius: 7px; padding: 3px 12px; margin-bottom: 7px;
                }
                .pm-title { font-size: 20px; font-weight: 700; color: #1e0a3c; margin: 0; }
                .pm-payos-brand { display:flex; flex-direction:column; align-items:flex-end; }
                .pm-payos-brand span { font-size:10px; color:#9c8dba; }
                .pm-payos-brand strong { font-size:14px; color:#7c3aed; font-weight:800; }
                .pm-close {
                    background: none; border: none; cursor: pointer;
                    font-size: 17px; color: #9c8dba; padding: 5px 10px;
                    border-radius: 8px; transition: background .14s;
                }
                .pm-close:hover { background:#ede8ff; color:#5b21b6; }

                /* error */
                .pm-error-banner {
                    margin: 14px 32px 0; padding: 10px 14px; border-radius: 10px;
                    background: #fef2f2; border: 1.5px solid #fecaca;
                    color: #dc2626; font-size: 13px; font-weight: 500;
                }

                /* info */
                .pm-info { padding: 22px 32px 0; display:flex; flex-direction:column; gap:8px; }
                .pm-info-row {
                    display:flex; justify-content:space-between; align-items:center;
                    padding: 10px 14px; border-radius: 10px; font-size: 15px;
                }
                .pm-info-row span { color:#6b5b95; }
                .pm-info-row strong { color:#1e0a3c; font-weight:600; }
                .pm-info-row--highlight { background:#f5f0ff; }
                .pm-total { color:#5b21b6!important; font-size:17px!important; }
                .pm-deposit-min { color:#d97706!important; font-size:16px!important; }

                /* options */
                .pm-options { padding: 20px 32px 0; }
                .pm-options__label { font-size:13px; font-weight:600; color:#6b5b95; margin:0 0 10px; text-transform:uppercase; letter-spacing:.05em; }
                .pm-option-list { display:flex; gap:12px; }
                .pm-option {
                    flex:1; display:flex; align-items:center; gap:12px;
                    padding:14px 16px; border-radius:12px;
                    border:2px solid #e9e3f7; background:#faf8ff;
                    cursor:pointer; transition:all .14s;
                }
                .pm-option:hover { border-color:#a78bfa; }
                .pm-option--active { border-color:#7c3aed; background:#f3eeff; }
                .pm-option__icon { font-size:22px; }
                .pm-option__text { flex:1; display:flex; flex-direction:column; }
                .pm-option__text strong { font-size:14px; color:#1e0a3c; }
                .pm-option__text span { font-size:13px; color:#7c6faa; margin-top:2px; }
                .pm-option__radio { font-size:20px; color:#7c3aed; }

                /* deposit input */
                .pm-deposit-group { padding: 18px 32px 0; }
                .pm-deposit-label { font-size:13px; font-weight:600; color:#6b5b95; display:block; margin-bottom:7px; }
                .pm-deposit-input-wrap { display:flex; }
                .pm-deposit-input {
                    flex:1; padding:12px 16px;
                    border:2px solid #c4b5fd; border-right:none;
                    border-radius:10px 0 0 10px;
                    font-size:16px; font-weight:600; color:#1e0a3c;
                    font-family:inherit; outline:none; transition:border-color .14s;
                }
                .pm-deposit-input:focus { border-color:#7c3aed; }
                .pm-deposit-input--error { border-color:#f87171; }
                .pm-deposit-unit {
                    padding:12px 16px; background:#f3eeff;
                    border:2px solid #c4b5fd; border-left:none;
                    border-radius:0 10px 10px 0;
                    font-size:16px; font-weight:700; color:#7c3aed;
                }
                .pm-deposit-error { color:#dc2626; font-size:12px; margin:6px 0 0; }
                .pm-bar { margin-top:12px; height:6px; background:#ede8ff; border-radius:99px; position:relative; }
                .pm-bar__fill { height:100%; background:linear-gradient(90deg,#7c3aed,#a78bfa); border-radius:99px; transition:width .3s; }
                .pm-bar__label { position:absolute; right:0; top:-20px; font-size:12px; color:#7c3aed; font-weight:600; }

                /* footer */
                .pm-footer { display:flex; gap:10px; justify-content:space-between; align-items:center; padding:22px 32px 28px; }
                .pm-footer--qr { border-top:1px solid #f0eaff; padding-top:18px; }
                .pm-btn {
                    padding:12px 24px; border-radius:10px; border:none;
                    font-family:inherit; font-size:14px; font-weight:700;
                    cursor:pointer; transition:all .15s; display:flex; align-items:center; gap:7px;
                }
                .pm-btn--cancel { background:#fff; border:2px solid #e9e3f7; color:#6b5b95; }
                .pm-btn--cancel:hover { background:#f5f0ff; border-color:#c4b5fd; }
                .pm-btn--cancel-qr { background:#fff; border:2px solid #fecaca; color:#dc2626; font-size:13px; padding:9px 18px; }
                .pm-btn--cancel-qr:hover { background:#fef2f2; }
                .pm-btn--payos { background:linear-gradient(135deg,#7c3aed,#5b21b6); color:#fff; }
                .pm-btn--payos:hover { transform:translateY(-1px); box-shadow:0 4px 16px rgba(124,58,237,.35); }
                .pm-btn--disabled { opacity:.45; cursor:not-allowed; transform:none!important; box-shadow:none!important; }
                .pm-payos-icon { font-size:16px; }
                .pm-spinner {
                    width:14px; height:14px; border:2px solid rgba(255,255,255,.35);
                    border-top-color:#fff; border-radius:50%;
                    animation:pmSpin .7s linear infinite; display:inline-block;
                }
                @keyframes pmSpin { to{transform:rotate(360deg)} }

                /* polling indicator */
                .pm-polling { display:flex; align-items:center; gap:5px; font-size:13px; color:#7c6faa; font-weight:500; }
                .pm-polling__dot {
                    width:7px; height:7px; border-radius:50%; background:#7c3aed;
                    animation:pmPulse 1.2s ease-in-out infinite;
                }
                .pm-polling__dot--2 { animation-delay:.2s; }
                .pm-polling__dot--3 { animation-delay:.4s; }
                @keyframes pmPulse { 0%,80%,100%{opacity:.25;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }

                /* ── QR section ── */
                .pm-qr-body { padding: 20px 32px; display:flex; flex-direction:column; align-items:center; gap:14px; }

                .pm-qr-amount-banner {
                    width:100%; display:flex; justify-content:space-between; align-items:center;
                    padding:12px 18px; border-radius:12px;
                    background:linear-gradient(135deg,#f5f0ff,#ede8ff);
                    border:1.5px solid #ddd6fe;
                }
                .pm-qr-amount-banner__label { font-size:14px; color:#6b5b95; font-weight:600; }
                .pm-qr-amount-banner__value { font-size:20px; font-weight:800; color:#5b21b6; }

                .pm-qr-frame {
                    position:relative; padding:12px;
                    background:#fff; border-radius:16px;
                    box-shadow:0 4px 24px rgba(80,40,160,.12);
                }
                .pm-qr-img { display:block; width:220px; height:220px; border-radius:8px; }
                .pm-qr-corner {
                    position:absolute; width:20px; height:20px;
                    border-color:#7c3aed; border-style:solid;
                }
                .pm-qr-corner--tl { top:6px; left:6px; border-width:3px 0 0 3px; border-radius:4px 0 0 0; }
                .pm-qr-corner--tr { top:6px; right:6px; border-width:3px 3px 0 0; border-radius:0 4px 0 0; }
                .pm-qr-corner--bl { bottom:6px; left:6px; border-width:0 0 3px 3px; border-radius:0 0 0 4px; }
                .pm-qr-corner--br { bottom:6px; right:6px; border-width:0 3px 3px 0; border-radius:0 0 4px 0; }

                .pm-qr-timer {
                    display:flex; align-items:center; gap:5px;
                    font-size:13px; color:#6b5b95; font-weight:500;
                    padding:6px 14px; border-radius:99px; background:#f5f0ff;
                }
                .pm-qr-timer--urgent { background:#fef2f2; color:#dc2626; }
                .pm-qr-timer--urgent svg { stroke:#dc2626; }

                .pm-qr-steps { display:flex; gap:16px; }
                .pm-qr-step { display:flex; align-items:center; gap:6px; font-size:12px; color:#6b5b95; }
                .pm-qr-step__num {
                    width:20px; height:20px; border-radius:50%;
                    background:#7c3aed; color:#fff;
                    font-size:11px; font-weight:700;
                    display:flex; align-items:center; justify-content:center;
                    flex-shrink:0;
                }
                .pm-qr-open-link { font-size:12px; color:#7c3aed; text-decoration:none; font-weight:600; }
                .pm-qr-open-link:hover { text-decoration:underline; }

                /* ── success ── */
                .pm-success {
                    display:flex; flex-direction:column; align-items:center; justify-content:center;
                    padding:52px 32px; gap:12px;
                }
                .pm-success__ring {
                    width:80px; height:80px; border-radius:50%;
                    background:linear-gradient(135deg,#7c3aed,#a78bfa);
                    display:flex; align-items:center; justify-content:center;
                    box-shadow:0 8px 32px rgba(124,58,237,.35);
                    animation:pmPop .3s cubic-bezier(.4,0,.2,1);
                }
                @keyframes pmPop { from{transform:scale(.5);opacity:0}to{transform:scale(1);opacity:1} }
                .pm-success__icon { color:#fff; font-size:36px; line-height:1; }
                .pm-success__title { font-size:20px; font-weight:700; color:#1e0a3c; margin:4px 0 0; }
                .pm-success__amount { font-size:28px; font-weight:800; color:#5b21b6; }
                .pm-success__sub { font-size:13px; color:#9c8dba; }
            `}</style>
        </div>
    );
};