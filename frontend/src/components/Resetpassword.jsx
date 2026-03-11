// ============================================================
// src/pages/ResetPassword.jsx
// Trang /reset-password?token=xxxx
// Gọi POST /api/v1/auth/reset-password
// ============================================================

import { useState } from "react";
import "./ResetPassword.css";
import { useAuth } from "../context/AuthContext";

export const ResetPassword = () => {
    const { resetPassword } = useAuth();

    // Lấy token từ URL: ?token=xxxxx
    const params    = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token") || "";

    const [password,   setPassword]   = useState("");
    const [confirm,    setConfirm]    = useState("");
    const [loading,    setLoading]    = useState(false);
    const [success,    setSuccess]    = useState(false);
    const [error,      setError]      = useState(null);
    const [showPass,   setShowPass]   = useState(false);

    const validate = () => {
        if (!password)               return "Vui lòng nhập mật khẩu mới";
        if (password.length < 6)     return "Mật khẩu phải có ít nhất 6 ký tự";
        if (password !== confirm)    return "Mật khẩu xác nhận không khớp";
        if (!tokenParam)             return "Token không hợp lệ, vui lòng thử lại link trong email";
        return null;
    };

    const handleSubmit = async () => {
        const err = validate();
        if (err) { setError(err); return; }
        setLoading(true);
        setError(null);
        try {
            await resetPassword(tokenParam, password);
            setSuccess(true);
        } catch (e) {
            setError(e.response?.data || "Token không hợp lệ hoặc đã hết hạn");
        } finally {
            setLoading(false);
        }
    };

    const goLogin = () => {
        // Chuyển về trang gốc để mở lại modal login
        window.location.href = "/";
    };

    return (
        <div className="rp-page">
            <div className="rp-card">
                <div className="rp-icon">{success ? "✅" : "🔑"}</div>

                <h1 className="rp-title">
                    {success ? "Đặt lại thành công!" : "Đặt lại mật khẩu"}
                </h1>

                <p className="rp-subtitle">
                    {success
                        ? "Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ."
                        : "Nhập mật khẩu mới cho tài khoản của bạn."}
                </p>

                {!success && (
                    <div className="rp-form">
                        {error && <div className="rp-error">{error}</div>}

                        {!tokenParam && (
                            <div className="rp-error">
                                ⚠️ Không tìm thấy token. Vui lòng sử dụng đúng link từ email.
                            </div>
                        )}

                        <div className="rp-form-group">
                            <label>Mật khẩu mới</label>
                            <div className="rp-input-wrap">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="Tối thiểu 6 ký tự"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                />
                                <button className="rp-toggle" onClick={() => setShowPass(!showPass)}>
                                    {showPass ? "🙈" : "👁️"}
                                </button>
                            </div>
                        </div>

                        <div className="rp-form-group">
                            <label>Xác nhận mật khẩu</label>
                            <div className="rp-input-wrap">
                                <input
                                    type={showPass ? "text" : "password"}
                                    placeholder="Nhập lại mật khẩu"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                />
                            </div>
                            {confirm && password !== confirm && (
                                <span className="rp-hint rp-hint--error">Mật khẩu không khớp</span>
                            )}
                            {confirm && password === confirm && confirm.length >= 6 && (
                                <span className="rp-hint rp-hint--ok">✓ Mật khẩu khớp</span>
                            )}
                        </div>

                        <button
                            className="rp-btn"
                            onClick={handleSubmit}
                            disabled={loading || !tokenParam}
                        >
                            {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                        </button>
                    </div>
                )}

                {success && (
                    <button className="rp-btn" onClick={goLogin}>
                        Về trang đăng nhập
                    </button>
                )}
            </div>
        </div>
    );
};