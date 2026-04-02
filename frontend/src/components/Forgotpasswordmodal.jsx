import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const ForgotPasswordModal = ({ onBack, onNext }) => {
    const { forgotPassword, setAuthError } = useAuth();
    const [email,   setEmail]   = useState("");
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            setError("Vui lòng nhập email.");
            return;
        }
        if (loading) return;

        // Kiểm tra định dạng email bằng Regex đơn giản
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setError("Định dạng email không hợp lệ.");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const message = await forgotPassword(trimmedEmail);
            setSuccess(message);
            setTimeout(() => {
                if (onNext) onNext(trimmedEmail);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || "Hệ thống gặp sự cố. Vui lòng thử lại sau.");
            setLoading(false);
        }
    };

    return (
        <div className="lp-overlay">
            {/* ── Left panel (Reused from Login) ── */}
            <div className="lp-left">
                <div className="lp-left__content">
                    <h2 className="lp-left__heading lp-left__heading--large">
                        Hệ thống quản&nbsp;lý<br />
                        <span className="lp-left__accent">tủ&nbsp;nhựa Minh&nbsp;Thắng</span>
                    </h2>
                    <p className="lp-left__desc">
                        Nền tảng số hóa quy trình sản xuất và giám sát
                        tiến độ đơn hàng thời gian thực.
                    </p>
                </div>
                <div className="lp-left__footer">© 2026 Tủ Nhựa Minh Thắng</div>
            </div>

            {/* ── Right panel ── */}
            <div className="lp-right">
                <div className="lp-card">
                    <div className="lp-header">
                        <h1 className="lp-title">Quên mật khẩu</h1>
                        <p className="lp-subtitle">Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu</p>
                    </div>

                    {success && <div className="sq-toast sq-toast--success" style={{ marginBottom: 16 }}>{success}</div>}
                    
                    {error && !error.includes("email") && <div className="lp-error" style={{ marginBottom: 16 }}>{error}</div>}

                    <div className="lp-form">
                        <div className="lp-field">
                            <label className="lp-label">Email tài khoản</label>
                            <input
                                className={`lp-input ${error && error.includes("email") ? 'lp-input--error' : ''}`}
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                autoFocus
                            />
                            {error && error.includes("email") && <span className="lp-field-error">{error}</span>}
                        </div>

                        <button className="lp-btn" onClick={handleSubmit} disabled={loading || !!success} type="button">
                            <span>{loading ? "Đang xử lý..." : "Nhận mã OTP"}</span>
                            {!loading && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12 5 19 12 12 19"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    <button 
                        className="lp-forgot" 
                        onClick={onBack} 
                        style={{ 
                            marginTop: 24, 
                            textAlign: 'center', 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '8px', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            color: '#64748b',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="19" y1="12" x2="5" y2="12"/>
                            <polyline points="12 19 5 12 12 5"/>
                        </svg>
                        Quay lại đăng nhập
                    </button>

                    <div className="lp-footer">© 2026 Minh Thang Factory. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
};