import { useState } from "react";
import "./Auth.css";
import { useAuth } from "../../context/AuthContext";

export const ForgotPassword = ({ onBack, onNext }) => {
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
        <div className="auth-overlay">
            <div className="auth-left">
                <div className="auth-left__content">
                    <h2 className="auth-left__heading">
                        Hệ thống quản lý<br />
                        <span className="auth-left__accent">tủ nhựa Minh Thắng</span>
                    </h2>
                    <p className="auth-left__desc">
                        Nền tảng số hóa quy trình sản xuất và giám sát tiến độ đơn hàng thời gian thực.
                    </p>
                </div>
                <div className="auth-left__footer">© 2026 Tủ Nhựa Minh Thắng</div>
            </div>

            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Quên mật khẩu</h1>
                        <p className="auth-subtitle">Nhập email đã đăng ký để nhận mã OTP đặt lại mật khẩu</p>
                    </div>

                    {success && <div className="auth-toast">{success}</div>}
                    
                    {error && !error.includes("email") && <div className="auth-error-box">{error}</div>}

                    <div className="auth-form">
                        <div className="auth-field">
                            <label className="auth-label">Email tài khoản</label>
                            <input
                                className={`auth-input ${error && error.includes("email") ? 'auth-input--error' : ''}`}
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                autoFocus
                            />
                            {error && error.includes("email") && <span className="auth-field-error">{error}</span>}
                        </div>

                        <button className="auth-btn" onClick={handleSubmit} disabled={loading || !!success} type="button">
                            <span>{loading ? "Đang xử lý..." : "Nhận mã OTP"}</span>
                            {!loading && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    <button 
                        className="auth-link" 
                        onClick={onBack} 
                        style={{ 
                            marginTop: 24, 
                            textAlign: 'center', 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '8px'
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                        </svg>
                        Quay lại đăng nhập
                    </button>

                    <div className="auth-footer">© 2026 Minh Thang Factory. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
};