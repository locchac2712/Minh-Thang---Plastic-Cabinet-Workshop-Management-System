import { useState, useEffect } from "react";
import "./Auth.css";
import { useAuth } from "../../context/AuthContext";

export const ResetPassword = () => {
    const { resetPassword, forgotPassword } = useAuth();
    const query = new URLSearchParams(window.location.search);
    const email = query.get("email");

    const [otp,        setOtp]        = useState("");
    const [password,   setPassword]   = useState("");
    const [confirm,    setConfirm]    = useState("");
    const [loading,    setLoading]    = useState(false);
    const [success,    setSuccess]    = useState(false);
    const [resendMsg,  setResendMsg]  = useState(null);
    const [errors,     setErrors]     = useState({});
    const [showPass,   setShowPass]   = useState(false);
    const [countdown,  setCountdown]  = useState(60);
    const [resending,  setResending]  = useState(false);

    useEffect(() => {
        let timer;
        if (countdown > 0) {
            timer = setInterval(() => {
                setCountdown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [countdown]);

    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        match: password && password === confirm
    };

    const validate = () => {
        const newErrors = {};
        if (!otp) newErrors.otp = "Vui lòng nhập mã OTP.";
        else if (otp.length !== 6) newErrors.otp = "Mã OTP phải có 6 chữ số.";

        if (!password) newErrors.password = "Vui lòng nhập mật khẩu mới.";
        else if (!checks.length || !checks.upper || !checks.number) newErrors.password = "Mật khẩu chưa đủ mạnh.";

        if (!confirm) newErrors.confirm = "Vui lòng xác nhận mật khẩu.";
        else if (!checks.match) newErrors.confirm = "Mật khẩu xác nhận không khớp.";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        setErrors({});
        try {
            await resetPassword(otp, password);
            setResendMsg("Đặt lại mật khẩu thành công!");
            setTimeout(() => { window.location.href = "/"; }, 2000);
        } catch (e) {
            const apiMsg = e.response?.data?.message || "";
            if (apiMsg.toLowerCase().includes("otp")) setErrors({ otp: apiMsg });
            else setErrors({ general: apiMsg || "Có lỗi xảy ra. Vui lòng thử lại." });
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0 || resending) return;
        setResending(true);
        setErrors({});
        try {
            await forgotPassword(email);
            setCountdown(60); 
            setResendMsg("Gửi lại mã OTP thành công!");
            setTimeout(() => setResendMsg(null), 5000);
        } catch (e) {
            setErrors({ general: "Không thể gửi lại mã. Vui lòng thử lại sau." });
        } finally {
            setResending(false);
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
                        <h1 className="auth-title">Đặt lại mật khẩu</h1>
                        <p className="auth-subtitle">Nhập mã OTP (6 chữ số) và mật khẩu mới của bạn</p>
                    </div>

                    {errors.general && <div className="auth-error-box" style={{ marginBottom: 20 }}>{errors.general}</div>}
                    {resendMsg && <div className="auth-toast">{resendMsg}</div>}

                    <div className="auth-form">
                        <div className="auth-field">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="auth-label">Mã OTP</label>
                                {countdown > 0 && <span style={{ fontSize: 12, color: '#64748b' }}>Gửi lại sau {countdown}s</span>}
                            </div>
                            <div className="auth-input-wrap">
                                <input
                                    className={`auth-input ${errors.otp ? 'auth-input--error' : ''}`}
                                    type="text" maxLength={6} placeholder="000000"
                                    value={otp} onChange={(e) => setOtp(e.target.value)}
                                    autoFocus
                                />
                                <button className="auth-eye" onClick={handleResend} disabled={countdown > 0 || resending} type="button" title="Gửi lại mã">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                    </svg>
                                </button>
                            </div>
                            {errors.otp && <span className="auth-field-error">{errors.otp}</span>}
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Mật khẩu mới</label>
                            <div className="auth-input-wrap">
                                <input
                                    className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                                    type={showPass ? "text" : "password"} placeholder="Nhập mật khẩu"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                />
                                <button className="auth-eye" onClick={() => setShowPass(!showPass)} type="button">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                            {errors.password && <span className="auth-field-error">{errors.password}</span>}

                            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ fontSize: 12, color: checks.length ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg> Tối thiểu 8 ký tự
                                </div>
                                <div style={{ fontSize: 12, color: checks.upper ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg> Có chữ hoa & chữ số
                                </div>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label">Xác nhận mật khẩu</label>
                            <input
                                className={`auth-input ${errors.confirm ? 'auth-input--error' : ''}`}
                                type={showPass ? "text" : "password"} placeholder="Nhập lại mật khẩu"
                                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            />
                            {errors.confirm && <span className="auth-field-error">{errors.confirm}</span>}
                        </div>

                        <button className="auth-btn" onClick={handleSubmit} disabled={loading} type="button">
                            <span>{loading ? "Đang xử lý..." : "Xác nhận đặt lại"}</span>
                            {!loading && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    <button className="auth-link" onClick={() => window.location.href = "/"} style={{ marginTop: 24, textAlign: 'center', width: '100%' }}>
                        Quay lại đăng nhập
                    </button>

                    <div className="auth-footer">© 2026 Minh Thang Factory. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
};