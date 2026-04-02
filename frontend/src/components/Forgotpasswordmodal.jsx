import { useState } from "react";
import "./LoginModal.css";

export const ForgotPasswordModal = ({ onBack }) => {
    const [email,   setEmail]   = useState("");
    const [loading, setLoading] = useState(false);
    const [toast,   setToast]   = useState(null);

    const handleSubmit = async () => {
        if (!email.trim() || loading) return;
        setLoading(true);
        
        // Giả lập gửi OTP - thực tế sẽ gọi authService.forgotPassword
        try {
            // await authService.forgotPassword(email);
            setToast("Gửi mã OTP thành công! Đang chuyển hướng...");
            setTimeout(() => {
                window.location.href = "/reset-password?email=" + encodeURIComponent(email);
            }, 1800);
        } catch (err) {
            alert(err.response?.data?.message || "Có lỗi xảy ra");
            setLoading(false);
        }
    };

    return (
        <div className="lp-overlay">
            {/* ── Left panel (Reused from Login) ── */}
            <div className="lp-left">
                <div className="lp-left__content">
                    <h2 className="lp-left__heading lp-left__heading--large">
                        Hệ thống quản lý<br />
                        <span className="lp-left__accent">tủ nhựa Minh Thắng</span>
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
                        <p className="lp-subtitle">Nhập email đã đăng ký để nhận mã OTP khôi phục</p>
                    </div>

                    {toast && (
                        <div className="sq-toast sq-toast--success" style={{ position: 'relative', top: 0, right: 0, marginBottom: 16, maxWidth: '100%' }}>
                            <span>{toast}</span>
                        </div>
                    )}

                    <div className="lp-form">
                        <div className="lp-field">
                            <label className="lp-label">Email tài khoản</label>
                            <input
                                className="lp-input"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <button className="lp-btn" onClick={handleSubmit} disabled={loading} type="button">
                            <span>{loading ? "Đang xử lý..." : "Nhận mã OTP"}</span>
                            {!loading && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                    <polyline points="12 5 19 12 12 19"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    <button className="lp-forgot" onClick={onBack} style={{ marginTop: 24, textAlign: 'center', width: '100%', display: 'block' }}>
                        ← Quay lại đăng nhập
                    </button>

                    <div className="lp-footer">© 2026 Minh Thang Factory. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
};