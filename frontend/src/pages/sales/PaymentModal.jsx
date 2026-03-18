import { useState } from "react";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";

const DEPOSIT_MIN_RATIO = 0.3;

/**
 * PaymentModal
 *
 * Props:
 *   order     – object { orderNumber, totalAmount, customer: { name } | customerName }
 *   onClose   – () => void
 *   onConfirm – (paid: number, type: 'full' | 'deposit') => void
 */
export const PaymentModal = ({ order, onClose, onConfirm }) => {
    const total      = Number(order.totalAmount || 0);
    const minDeposit = Math.ceil(total * DEPOSIT_MIN_RATIO);

    const [paymentType,   setPaymentType]   = useState(null); // null | 'full' | 'deposit'
    const [depositAmount, setDepositAmount] = useState(minDeposit);
    const [confirmed,     setConfirmed]     = useState(false);

    const isDepositValid = depositAmount >= minDeposit && depositAmount < total;

    const handleDepositInput = (e) => {
        const val = Number(e.target.value.replace(/\D/g, ""));
        setDepositAmount(val);
    };

    const handleConfirm = () => {
        const paid = paymentType === "full" ? total : depositAmount;
        setConfirmed(true);
        setTimeout(() => {
            onConfirm(paid, paymentType);
            onClose();
        }, 1600);
    };

    return (
        <div className="pm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="pm-box">
                {confirmed ? (
                    <div className="pm-success">
                        <div className="pm-success__icon">✓</div>
                        <p>Đã ghi nhận thanh toán!</p>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="pm-header">
                            <div>
                                <span className="pm-order-badge">{order.orderNumber}</span>
                                <h2 className="pm-title">Xác nhận thanh toán</h2>
                            </div>
                            <button className="pm-close" onClick={onClose}>✕</button>
                        </div>

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
                                <div
                                    className={`pm-option${paymentType === "full" ? " pm-option--active" : ""}`}
                                    onClick={() => setPaymentType("full")}
                                >
                                    <span className="pm-option__icon">💳</span>
                                    <div className="pm-option__text">
                                        <strong>Thanh toán toàn bộ</strong>
                                        <span>{fmt(total)}</span>
                                    </div>
                                    <span className="pm-option__radio">{paymentType === "full" ? "●" : "○"}</span>
                                </div>

                                <div
                                    className={`pm-option${paymentType === "deposit" ? " pm-option--active" : ""}`}
                                    onClick={() => setPaymentType("deposit")}
                                >
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
                                        onChange={handleDepositInput}
                                    />
                                    <span className="pm-deposit-unit">đ</span>
                                </div>
                                {!isDepositValid && (
                                    <p className="pm-deposit-error">
                                        Số tiền đặt cọc phải ≥ {fmt(minDeposit)} và &lt; {fmt(total)}
                                    </p>
                                )}
                                <div className="pm-bar">
                                    <div
                                        className="pm-bar__fill"
                                        style={{ width: `${Math.min((depositAmount / total) * 100, 100)}%` }}
                                    />

                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="pm-footer">
                            <button className="pm-btn pm-btn--cancel" onClick={onClose}>Hủy</button>
                            {paymentType === "full" && (
                                <button className="pm-btn pm-btn--full" onClick={handleConfirm}>
                                    💳 Thanh toán {fmt(total)}
                                </button>
                            )}
                            {paymentType === "deposit" && (
                                <button
                                    className={`pm-btn pm-btn--deposit${!isDepositValid ? " pm-btn--disabled" : ""}`}
                                    onClick={isDepositValid ? handleConfirm : undefined}
                                    disabled={!isDepositValid}
                                >
                                    🪙 Đặt cọc {fmt(depositAmount)}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>

            <style>{`
                .pm-backdrop {
                    position: fixed; inset: 0;
                    background: rgba(10,10,20,.52);
                    backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                    animation: pmFadeIn .16s ease;
                }
                @keyframes pmFadeIn { from{opacity:0} to{opacity:1} }

                .pm-box {
                    background: #fff;
                    border-radius: 20px;
                    width: 600px; max-width: 96vw;
                    box-shadow: 0 32px 80px rgba(80,40,160,.2), 0 4px 16px rgba(0,0,0,.10);
                    font-family: inherit;
                    animation: pmSlideUp .2s cubic-bezier(.4,0,.2,1);
                    overflow: hidden;
                }
                @keyframes pmSlideUp { from{transform:translateY(24px);opacity:0} to{transform:none;opacity:1} }

                .pm-header {
                    display: flex; justify-content: space-between; align-items: flex-start;
                    padding: 28px 32px 20px;
                    background: linear-gradient(135deg,#faf8ff,#f3eeff);
                    border-bottom: 1px solid #ede9fe;
                }
                .pm-order-badge {
                    display: inline-block;
                    background: #7c3aed; color: #fff;
                    font-size: 12px; font-weight: 700; letter-spacing: .04em;
                    border-radius: 7px; padding: 3px 12px; margin-bottom: 7px;
                }
                .pm-title { font-size: 20px; font-weight: 700; color: #1e0a3c; margin: 0; }
                .pm-close {
                    background: none; border: none; cursor: pointer;
                    font-size: 17px; color: #9c8dba; padding: 5px 10px;
                    border-radius: 8px; transition: background .14s;
                }
                .pm-close:hover { background: #ede8ff; color: #5b21b6; }

                .pm-info { padding: 22px 32px 0; display: flex; flex-direction: column; gap: 8px; }
                .pm-info-row {
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 10px 14px; border-radius: 10px; font-size: 15px;
                }
                .pm-info-row span { color: #6b5b95; }
                .pm-info-row strong { color: #1e0a3c; font-weight: 600; }
                .pm-info-row--highlight { background: #f5f0ff; }
                .pm-total { color: #5b21b6 !important; font-size: 17px !important; }
                .pm-deposit-min { color: #d97706 !important; font-size: 16px !important; }

                .pm-options { padding: 20px 32px 0; }
                .pm-options__label { font-size: 13px; font-weight: 600; color: #6b5b95; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .05em; }
                .pm-option-list { display: flex; gap: 12px; }
                .pm-option {
                    flex: 1; display: flex; align-items: center; gap: 12px;
                    padding: 14px 16px; border-radius: 12px;
                    border: 2px solid #e9e3f7; background: #faf8ff;
                    cursor: pointer; transition: all .14s;
                }
                .pm-option:hover { border-color: #a78bfa; }
                .pm-option--active { border-color: #7c3aed; background: #f3eeff; }
                .pm-option__icon { font-size: 22px; }
                .pm-option__text { flex: 1; display: flex; flex-direction: column; }
                .pm-option__text strong { font-size: 14px; color: #1e0a3c; }
                .pm-option__text span { font-size: 13px; color: #7c6faa; margin-top: 2px; }
                .pm-option__radio { font-size: 20px; color: #7c3aed; }

                .pm-deposit-group { padding: 18px 32px 0; }
                .pm-deposit-label { font-size: 13px; font-weight: 600; color: #6b5b95; display: block; margin-bottom: 7px; }
                .pm-deposit-input-wrap { display: flex; }
                .pm-deposit-input {
                    flex: 1; padding: 12px 16px;
                    border: 2px solid #c4b5fd; border-right: none;
                    border-radius: 10px 0 0 10px;
                    font-size: 16px; font-weight: 600; color: #1e0a3c;
                    font-family: inherit; outline: none; transition: border-color .14s;
                }
                .pm-deposit-input:focus { border-color: #7c3aed; }
                .pm-deposit-input--error { border-color: #f87171; }
                .pm-deposit-unit {
                    padding: 12px 16px; background: #f3eeff;
                    border: 2px solid #c4b5fd; border-left: none;
                    border-radius: 0 10px 10px 0;
                    font-size: 16px; font-weight: 700; color: #7c3aed;
                }
                .pm-deposit-error { color: #dc2626; font-size: 12px; margin: 6px 0 0; }
                .pm-bar {
                    margin-top: 12px; height: 6px; background: #ede8ff;
                    border-radius: 99px; position: relative;
                }
                .pm-bar__fill {
                    height: 100%;
                    background: linear-gradient(90deg,#7c3aed,#a78bfa);
                    border-radius: 99px; transition: width .3s;
                }
                .pm-bar__label {
                    position: absolute; right: 0; top: -20px;
                    font-size: 12px; color: #7c3aed; font-weight: 600;
                }

                .pm-footer {
                    display: flex; gap: 10px; justify-content: flex-end;
                    padding: 22px 32px 28px;
                }
                .pm-btn {
                    padding: 12px 24px; border-radius: 10px; border: none;
                    font-family: inherit; font-size: 14px; font-weight: 700;
                    cursor: pointer; transition: all .15s;
                }
                .pm-btn--cancel {
                    background: #fff; border: 2px solid #e9e3f7; color: #6b5b95;
                }
                .pm-btn--cancel:hover { background: #f5f0ff; border-color: #c4b5fd; }
                .pm-btn--full { background: linear-gradient(135deg,#7c3aed,#5b21b6); color: #fff; }
                .pm-btn--full:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(124,58,237,.35); }
                .pm-btn--deposit { background: linear-gradient(135deg,#d97706,#b45309); color: #fff; }
                .pm-btn--deposit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(217,119,6,.3); }
                .pm-btn--disabled { opacity: .45; cursor: not-allowed; transform: none !important; box-shadow: none !important; }

                .pm-success {
                    display: flex; flex-direction: column; align-items: center; justify-content: center;
                    padding: 64px 32px; gap: 16px;
                }
                .pm-success__icon {
                    width: 68px; height: 68px; border-radius: 50%;
                    background: linear-gradient(135deg,#7c3aed,#a78bfa);
                    color: #fff; font-size: 32px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 28px rgba(124,58,237,.32);
                    animation: pmPop .28s cubic-bezier(.4,0,.2,1);
                }
                @keyframes pmPop { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
                .pm-success p { font-size: 17px; font-weight: 700; color: #1e0a3c; margin: 0; }
            `}</style>
        </div>
    );
};