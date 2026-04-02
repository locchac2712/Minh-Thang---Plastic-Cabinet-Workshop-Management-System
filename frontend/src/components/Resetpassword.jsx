// ============================================================
// src/pages/ResetPassword.jsx
// Trang /reset-password?token=xxxx
// Gọi POST /api/v1/auth/reset-password
// ============================================================
import { useState, useEffect } from "react";
import "./ResetPassword.css";
import { useAuth } from "../context/AuthContext";

export const ResetPassword = () => {
    const { resetPassword, forgotPassword } = useAuth();
    
    // Lấy email từ URL
    const query = new URLSearchParams(window.location.search);
    const email = query.get("email");

    const [otp,        setOtp]        = useState("");
    const [password,   setPassword]   = useState("");
    const [confirm,    setConfirm]    = useState("");
    const [loading,    setLoading]    = useState(false);
    const [success,    setSuccess]    = useState(false); // Đổi thành boolean để báo Reset thành công
    const [resendMsg,  setResendMsg]  = useState(null); // Thông báo gửi lại mã

    const [errors,     setErrors]     = useState({});
    const [showPass,   setShowPass]   = useState(false);

    // Timer & Resend state
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

    // Kiểm tra cấu trúc mật khẩu real-time
    const checks = {
        length: password.length >= 8,
        upper: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        match: password && password === confirm
    };

    const validate = () => {
        const newErrors = {};
        if (!otp) {
            newErrors.otp = "Vui lòng nhập mã OTP.";
        } else if (otp.length !== 6) {
            newErrors.otp = "Mã OTP phải có 6 chữ số.";
        }

        if (!password) {
            newErrors.password = "Vui lòng nhập mật khẩu mới.";
        } else if (!checks.length || !checks.upper || !checks.number) {
            newErrors.password = "Mật khẩu chưa đủ mạnh.";
        }

        if (!confirm) {
            newErrors.confirm = "Vui lòng xác nhận mật khẩu.";
        } else if (!checks.match) {
            newErrors.confirm = "Mật khẩu xác nhận không khớp.";
        }

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
            setTimeout(() => {
                window.location.href = "/";
            }, 2000);
        } catch (e) {
            const apiMsg = e.response?.data?.message || "";
            if (apiMsg.toLowerCase().includes("otp")) {
                setErrors({ otp: apiMsg });
            } else {
                setErrors({ general: apiMsg || "Có lỗi xảy ra. Vui lòng thử lại." });
            }
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

    const goLogin = () => { window.location.href = "/"; };

    return (
        <div className="lp-overlay">
            {/* ── Left panel ── */}
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
                        <h1 className="lp-title">Đặt lại mật khẩu</h1>
                        <p className="lp-subtitle">Nhập mã OTP và mật khẩu mới của bạn</p>
                    </div>

                    {errors.general && <div className="lp-error">{errors.general}</div>}
                    
                    {resendMsg && (
                        <div className="sq-toast sq-toast--success" style={{ marginBottom: 24 }}>
                            {resendMsg}
                        </div>
                    )}

                    {success ? (
                        <div style={{ textAlign: 'center' }}>
                            <div className="sq-toast sq-toast--success" style={{ marginBottom: 24, display: 'inline-block' }}>
                                Mật khẩu của bạn đã được đặt lại thành công..
                            </div>
                            <button className="lp-btn" onClick={goLogin} style={{ marginTop: 16 }}>
                                Về trang đăng nhập
                            </button>
                        </div>
                    ) : (
                        <div className="lp-form">
                            <div className="lp-field">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <label className="lp-label" style={{ marginBottom: 0 }}>Mã OTP (6 chữ số)</label>
                                    {countdown > 0 && (
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                            Gửi lại sau {countdown}s
                                        </span>
                                    )}
                                </div>
                                <div className="lp-input-wrap">
                                    <input
                                        className={`lp-input ${errors.otp ? 'lp-input--error' : ''}`}
                                        type="text"
                                        maxLength={6}
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => {
                                            setOtp(e.target.value);
                                            if (errors.otp) setErrors({ ...errors, otp: null });
                                        }}
                                        autoFocus
                                        style={{ paddingRight: '46px' }}
                                    />
                                    <button 
                                        className="lp-eye" 
                                        onClick={handleResend} 
                                        disabled={countdown > 0 || resending}
                                        type="button"
                                        title="Gửi lại mã OTP"
                                        style={{ 
                                            opacity: countdown > 0 ? 0.3 : 1, 
                                            cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                                            color: countdown > 0 ? '#94a3b8' : '#7c3aed'
                                        }}
                                    >
                                        {resending ? (
                                            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                            </svg>
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.otp && <span className="lp-field-error">{errors.otp}</span>}
                            </div>

                            <div className="lp-field">
                                <label className="lp-label">Mật khẩu mới</label>
                                <div className="lp-input-wrap">
                                    <input
                                        className={`lp-input ${errors.password ? 'lp-input--error' : ''}`}
                                        type={showPass ? "text" : "password"}
                                        placeholder="Tối thiểu 8 ký tự, hoa, thường, số"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({ ...errors, password: null });
                                        }}
                                    />
                                    <button className="lp-eye" onClick={() => setShowPass(!showPass)} type="button">
                                        {showPass ? (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && <span className="lp-field-error">{errors.password}</span>}

                                {/* Password Strength Visual */}
                                <div style={{ marginTop: 12 }}>
                                    <div className="pw-strength-bar" style={{ height: 4, borderRadius: 2, background: '#e2e8f0', overflow: 'hidden' }}>
                                        <div style={{ 
                                            height: '100%', 
                                            width: `${((checks.length + checks.upper + (checks.number ? 1 : 0)) / 3) * 100}%`,
                                            background: checks.length && checks.upper && checks.number ? '#10b981' : '#f59e0b',
                                            transition: '0.3s'
                                        }} />
                                    </div>

                                    <div className="pw-hints" style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: checks.length ? '#10b981' : '#94a3b8', transition: '0.2s' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                            Tối thiểu 8 ký tự
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: checks.upper ? '#10b981' : '#94a3b8', transition: '0.2s' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                            Có ít nhất 1 chữ hoa
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: checks.number ? '#10b981' : '#94a3b8', transition: '0.2s' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                            Có ít nhất 1 chữ số
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lp-field">
                                <label className="lp-label">Xác nhận mật khẩu</label>
                                <div className="lp-input-wrap">
                                    <input
                                        className={`lp-input ${errors.confirm ? 'lp-input--error' : ''}`}
                                        type={showPass ? "text" : "password"}
                                        placeholder="Nhập lại mật khẩu"
                                        value={confirm}
                                        onChange={(e) => {
                                            setConfirm(e.target.value);
                                            if (errors.confirm) setErrors({ ...errors, confirm: null });
                                        }}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                    />
                                    {confirm && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            right: 16, 
                                            top: '50%', 
                                            transform: 'translateY(-50%)', 
                                            color: checks.match ? '#10b981' : '#ef4444',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}>
                                            {checks.match ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {errors.confirm && <span className="lp-field-error">{errors.confirm}</span>}
                            </div>

                            <button className="lp-btn" onClick={handleSubmit} disabled={loading}>
                                <span>{loading ? "Đang cập nhật..." : "Xác nhận đặt lại"}</span>
                                {!loading && (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="5" y1="12" x2="19" y2="12"/>
                                        <polyline points="12 5 19 12 12 19"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    )}

                    {success && (
                        <button className="lp-btn" onClick={goLogin} style={{ marginTop: 16 }}>
                            Về trang đăng nhập
                        </button>
                    )}

                    <div className="lp-footer">© 2026 Minh Thang Factory. All rights reserved.</div>
                </div>
            </div>
        </div>
    );
};