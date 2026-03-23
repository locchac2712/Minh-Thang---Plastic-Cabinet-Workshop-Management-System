import { useState } from "react";
import axios from "axios";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " \u0111" : "\u2014";

const DEPOSIT_MIN_RATIO = 0.3;

/**
 * PaymentModal
 * Props:
 *   order     - { id, orderNumber, totalAmount, customer: { name } | customerName }
 *   onClose   - () => void
 *   onConfirm - (paid: number, type: 'full'|'deposit') => void
 */
export const PaymentModal = ({ order, onClose, onConfirm }) => {
    const total      = Number(order.totalAmount || 0);
    const minDeposit = Math.ceil(total * DEPOSIT_MIN_RATIO);

    const [paymentType,   setPaymentType]   = useState(null);
    const [depositAmount, setDepositAmount] = useState(minDeposit);
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState(null);
    const [done,          setDone]          = useState(false);

    const isDepositValid = depositAmount >= minDeposit && depositAmount < total;
    const finalAmount    = paymentType === "full" ? total : depositAmount;
    const canProceed     = paymentType === "full" || (paymentType === "deposit" && isDepositValid);

    const handleExportInvoice = async () => {
        if (!canProceed) return;
        setLoading(true);
        setError(null);
        try {
            const type = paymentType === "full" ? "FULL" : "DEPOSIT";
            const url  = `/api/invoices/sales-order/${order.id}?paymentType=${type}&amount=${finalAmount}`;

            // Lấy token từ localStorage — được set bởi AuthContext sau login
            // Không bị xóa vì AuthContext chỉ xóa khi app khởi động lần đầu,
            // còn trong session đang dùng thì token vẫn còn
            const token = localStorage.getItem("token");

            const res = await axios.get(url, {
                responseType: "blob",
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            // Kiểm tra response có phải PDF không
            const contentType = res.headers["content-type"] || "";
            if (!contentType.includes("application/pdf")) {
                // Đọc nội dung lỗi từ blob
                const text = await res.data.text();
                throw new Error("Server tra ve loi: " + text.substring(0, 200));
            }

            // Auto download
            const blob    = new Blob([res.data], { type: "application/pdf" });
            const blobUrl = URL.createObjectURL(blob);
            const link    = document.createElement("a");
            link.href     = blobUrl;
            link.download = `HoaDon_${order.orderNumber}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(blobUrl);

            setDone(true);
            setTimeout(() => {
                onConfirm(finalAmount, paymentType);
                onClose();
            }, 1800);

        } catch (err) {
            console.error("Export invoice error:", err);
            if (err.response?.status === 403) {
                setError("Khong co quyen. Vui long dang nhap lai.");
            } else if (err.response?.status === 500) {
                setError("Loi server khi tao PDF. Kiem tra log Spring Boot.");
            } else {
                setError(err.message || "Khong the xuat hoa don. Thu lai!");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pm-backdrop" onClick={(e) => e.target === e.currentTarget && !loading && onClose()}>
            <div className="pm-box">

                {/* SUCCESS */}
                {done ? (
                    <div className="pm-success">
                        <div className="pm-success__ring">
                            <div className="pm-success__icon">&#10003;</div>
                        </div>
                        <p className="pm-success__title">Da xuat hoa don!</p>
                        <span className="pm-success__amount">{fmt(finalAmount)}</span>
                        <span className="pm-success__sub">
                            {paymentType === "full" ? "Thanh toan toan bo" : "Dat coc"}
                        </span>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="pm-header">
                            <div>
                                <span className="pm-order-badge">{order.orderNumber}</span>
                                <h2 className="pm-title">Xac nhan thanh toan</h2>
                            </div>
                            <button className="pm-close" onClick={onClose} disabled={loading}>&#10005;</button>
                        </div>

                        {error && <div className="pm-error-banner">&#9888; {error}</div>}

                        {/* Info */}
                        <div className="pm-info">
                            <div className="pm-info-row">
                                <span>Khach hang</span>
                                <strong>{order.customer?.name || order.customerName}</strong>
                            </div>
                            <div className="pm-info-row pm-info-row--highlight">
                                <span>Gia tri don hang</span>
                                <strong className="pm-total">{fmt(total)}</strong>
                            </div>
                            <div className="pm-info-row">
                                <span>Dat coc toi thieu (30%)</span>
                                <strong className="pm-deposit-min">{fmt(minDeposit)}</strong>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="pm-options">
                            <p className="pm-options__label">Hinh thuc thanh toan</p>
                            <div className="pm-option-list">
                                <div className={`pm-option${paymentType === "full" ? " pm-option--active" : ""}`}
                                     onClick={() => setPaymentType("full")}>
                                    <span className="pm-option__icon">&#128179;</span>
                                    <div className="pm-option__text">
                                        <strong>Thanh toan toan bo</strong>
                                        <span>{fmt(total)}</span>
                                    </div>
                                    <span className="pm-option__radio">{paymentType === "full" ? "●" : "○"}</span>
                                </div>

                                <div className={`pm-option${paymentType === "deposit" ? " pm-option--active" : ""}`}
                                     onClick={() => setPaymentType("deposit")}>
                                    <span className="pm-option__icon">&#129681;</span>
                                    <div className="pm-option__text">
                                        <strong>Dat coc</strong>
                                        <span>Toi thieu {fmt(minDeposit)}</span>
                                    </div>
                                    <span className="pm-option__radio">{paymentType === "deposit" ? "●" : "○"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Deposit input */}
                        {paymentType === "deposit" && (
                            <div className="pm-deposit-group">
                                <label className="pm-deposit-label">So tien dat coc</label>
                                <div className="pm-deposit-input-wrap">
                                    <input
                                        className={`pm-deposit-input${!isDepositValid ? " pm-deposit-input--error" : ""}`}
                                        value={depositAmount.toLocaleString("vi-VN")}
                                        onChange={(e) => setDepositAmount(Number(e.target.value.replace(/\D/g, "")))}
                                    />
                                    <span className="pm-deposit-unit">d</span>
                                </div>
                                {!isDepositValid && (
                                    <p className="pm-deposit-error">
                                        So tien dat coc phai &gt;= {fmt(minDeposit)} va &lt; {fmt(total)}
                                    </p>
                                )}

                            </div>
                        )}

                        {/* QR note */}
                        {canProceed && (
                            <div className="pm-qr-note">
                                &#128196; PDF xuat ra se kem ma QR de thanh toan
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pm-footer">
                            <button className="pm-btn pm-btn--cancel" onClick={onClose} disabled={loading}>
                                Huy
                            </button>
                            <button
                                className={`pm-btn pm-btn--invoice${!canProceed || loading ? " pm-btn--disabled" : ""}`}
                                onClick={handleExportInvoice}
                                disabled={!canProceed || loading}
                            >
                                {loading
                                    ? <><span className="pm-spinner"/> Dang tao QR va xuat PDF...</>
                                    : <>&#128196; Xuat hoa don PDF</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .pm-backdrop {
                    position:fixed; inset:0;
                    background:rgba(10,10,20,.58);
                    backdrop-filter:blur(6px);
                    display:flex; align-items:center; justify-content:center;
                    z-index:1000; animation:pmFadeIn .16s ease;
                }
                @keyframes pmFadeIn { from{opacity:0}to{opacity:1} }
                .pm-box {
                    background:#fff; border-radius:20px;
                    width:600px; max-width:96vw;
                    box-shadow:0 32px 80px rgba(80,40,160,.22),0 4px 16px rgba(0,0,0,.10);
                    font-family:inherit;
                    animation:pmSlide .22s cubic-bezier(.4,0,.2,1); overflow:hidden;
                }
                @keyframes pmSlide { from{transform:translateY(24px);opacity:0}to{transform:none;opacity:1} }
                .pm-header {
                    display:flex; justify-content:space-between; align-items:flex-start;
                    padding:28px 32px 20px;
                    background:linear-gradient(135deg,#faf8ff,#f3eeff);
                    border-bottom:1px solid #ede9fe;
                }
                .pm-order-badge {
                    display:inline-block; background:#7c3aed; color:#fff;
                    font-size:12px; font-weight:700; letter-spacing:.04em;
                    border-radius:7px; padding:3px 12px; margin-bottom:7px;
                }
                .pm-title { font-size:20px; font-weight:700; color:#1e0a3c; margin:0; }
                .pm-close {
                    background:none; border:none; cursor:pointer;
                    font-size:17px; color:#9c8dba; padding:5px 10px;
                    border-radius:8px; transition:background .14s;
                }
                .pm-close:hover:not(:disabled) { background:#ede8ff; color:#5b21b6; }
                .pm-close:disabled { opacity:.4; cursor:not-allowed; }
                .pm-error-banner {
                    margin:14px 32px 0; padding:10px 14px; border-radius:10px;
                    background:#fef2f2; border:1.5px solid #fecaca;
                    color:#dc2626; font-size:13px; font-weight:500;
                }
                .pm-info { padding:22px 32px 0; display:flex; flex-direction:column; gap:8px; }
                .pm-info-row {
                    display:flex; justify-content:space-between; align-items:center;
                    padding:10px 14px; border-radius:10px; font-size:15px;
                }
                .pm-info-row span { color:#6b5b95; }
                .pm-info-row strong { color:#1e0a3c; font-weight:600; }
                .pm-info-row--highlight { background:#f5f0ff; }
                .pm-total { color:#5b21b6!important; font-size:17px!important; }
                .pm-deposit-min { color:#d97706!important; font-size:16px!important; }
                .pm-options { padding:20px 32px 0; }
                .pm-options__label {
                    font-size:13px; font-weight:600; color:#6b5b95;
                    margin:0 0 10px; text-transform:uppercase; letter-spacing:.05em;
                }
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
                .pm-deposit-group { padding:18px 32px 0; }
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
                .pm-qr-note {
                    margin:14px 32px 0; padding:10px 14px; border-radius:10px;
                    background:#f5f0ff; border:1.5px solid #ddd6fe;
                    color:#5b21b6; font-size:13px; font-weight:500;
                }
                .pm-footer {
                    display:flex; gap:10px; justify-content:flex-end;
                    padding:20px 32px 28px;
                }
                .pm-btn {
                    padding:12px 24px; border-radius:10px; border:none;
                    font-family:inherit; font-size:14px; font-weight:700;
                    cursor:pointer; transition:all .15s;
                    display:flex; align-items:center; gap:7px;
                }
                .pm-btn--cancel { background:#fff; border:2px solid #e9e3f7; color:#6b5b95; }
                .pm-btn--cancel:hover:not(:disabled) { background:#f5f0ff; border-color:#c4b5fd; }
                .pm-btn--cancel:disabled { opacity:.5; cursor:not-allowed; }
                .pm-btn--invoice { background:linear-gradient(135deg,#7c3aed,#5b21b6); color:#fff; }
                .pm-btn--invoice:hover:not(.pm-btn--disabled) { transform:translateY(-1px); box-shadow:0 4px 16px rgba(124,58,237,.35); }
                .pm-btn--disabled { opacity:.45; cursor:not-allowed; transform:none!important; box-shadow:none!important; }
                .pm-spinner {
                    width:14px; height:14px; border:2px solid rgba(255,255,255,.35);
                    border-top-color:#fff; border-radius:50%;
                    animation:pmSpin .7s linear infinite; display:inline-block;
                }
                @keyframes pmSpin { to{transform:rotate(360deg)} }
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