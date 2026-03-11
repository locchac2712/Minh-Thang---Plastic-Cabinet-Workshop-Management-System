// ============================================================
// src/components/ForgotPasswordModal.jsx
// Gọi POST /api/v1/auth/forgot-password
// ============================================================

import { useState } from "react";
import "./LoginModal.css"; // dùng chung style modal
import { useAuth } from "../context/AuthContext";

export const ForgotPasswordModal = ({ onClose, onBack }) => {
    const { forgotPassword } = useAuth();
    const [email,    setEmail]    = useState("");
    const [loading,  setLoading]  = useState(false);
    const [success,  setSuccess]  = useState(false);
    const [error,    setError]    = useState(null);

    const handleSubmit = async () => {
        if (!email.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await forgotPassword(email.trim());
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data || "Email không tồn tại trong hệ thống");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>✕</button>

                <div className="modal-icon">📧</div>
                <h2 className="modal-title">Quên mật khẩu</h2>
                <p className="modal-subtitle">
                    {success
                        ? "Kiểm tra email của bạn để nhận link đặt lại mật khẩu."
                        : "Nhập email đã đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu."}
                </p>

                {!success && (
                    <div className="modal-form">
                        {error && <div className="modal-error">{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Email</label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="example@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                autoFocus
                            />
                        </div>

                        <button
                            className="btn btn--primary btn--full"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? "Đang gửi..." : "Gửi link đặt lại"}
                        </button>
                    </div>
                )}

                {success && (
                    <div className="modal-form">
                        <div className="modal-success">
                            ✅ Email đã được gửi! Vui lòng kiểm tra hộp thư (kể cả Spam).
                        </div>
                        <button className="btn btn--primary btn--full" onClick={onClose}>
                            Đóng
                        </button>
                    </div>
                )}

                <button className="modal-back-link" onClick={onBack}>
                    ← Quay lại đăng nhập
                </button>
            </div>
        </div>
    );
};