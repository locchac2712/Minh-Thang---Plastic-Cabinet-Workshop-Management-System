import { useState } from "react";
import "./LoginModal.css";
import { useAuth } from "../context/AuthContext";
import { ForgotPasswordModal } from "./Forgotpasswordmodal";

export const LoginModal = ({ onClose }) => {
  const { login, authLoading, authError, setAuthError } = useAuth();
  const [username,   setUsername]   = useState("");
  const [password,   setPassword]   = useState("");
  const [remember,   setRemember]   = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errors,     setErrors]     = useState({});

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Tên đăng nhập là bắt buộc";
    if (!password.trim()) newErrors.password = "Mật khẩu là bắt buộc";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const ok = await login(username.trim(), password.trim());
    if (ok) onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
    // Bỏ Escape — không cho đóng login page
  };

  if (showForgot) {
    return <ForgotPasswordModal onBack={() => setShowForgot(false)} onNext={(email) => window.location.href = "/reset-password?email=" + encodeURIComponent(email)} />;
  }

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
              <h1 className="lp-title">Đăng nhập</h1>
              <p className="lp-subtitle">Nhập thông tin tài khoản để truy cập hệ thống</p>
            </div>

            {authError && <div className="lp-error" style={{ marginBottom: 20 }}>{authError}</div>}

            <div className="lp-form">
              <div className="lp-field">
                <label className="lp-label">Tên đăng nhập</label>
                <input
                    className={`lp-input ${errors.username ? 'lp-input--error' : ''}`}
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if(errors.username) setErrors({...errors, username:null}); }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                {errors.username && <span className="lp-field-error">{errors.username}</span>}
              </div>

              <div className="lp-field">
                <label className="lp-label">Mật khẩu</label>
                <div className="lp-input-wrap">
                  <input
                      className={`lp-input ${errors.password ? 'lp-input--error' : ''}`}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password:null}); }}
                      onKeyDown={handleKeyDown}
                  />
                  <button className="lp-eye" onClick={() => setShowPass(!showPass)} tabIndex={-1} type="button">
                    {showPass ? (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                    ) : (
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <span className="lp-field-error">
                    {errors.password}
                  </span>
                )}
              </div>

              <div className="lp-row">
                <label className="lp-remember">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span className="lp-checkmark" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button className="lp-forgot" onClick={() => { setAuthError?.(null); setShowForgot(true); }} type="button">
                  Quên mật khẩu?
                </button>
              </div>

              <button className="lp-btn" onClick={handleSubmit} disabled={authLoading} type="button">
                <span>{authLoading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
                {!authLoading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                )}
              </button>
            </div>

            <div className="lp-footer">© 2026 Minh Thang Factory. All rights reserved.</div>
          </div>
        </div>
      </div>
  );
};