import { useState, useEffect } from "react";
import "./Auth.css";
import { useAuth } from "../../context/AuthContext";
import { ForgotPassword } from "./ForgotPassword";

export const Login = ({ onClose }) => {
  const { login, completeLogin, authError, setAuthError } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Tên đăng nhập là bắt buộc";
    if (!password.trim()) newErrors.password = "Mật khẩu là bắt buộc";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const saved = localStorage.getItem("rememberedUsername");
    if (saved) {
      setUsername(saved);
      setRemember(true);
    }
  }, []);

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setAuthError?.(null);

    const cleanUsername = username.trim();
    const userInfo = await login(cleanUsername, password.trim());
    
    if (userInfo) {
      setSuccess("Đăng nhập thành công! Đang vào hệ thống...");
      if (remember) {
        localStorage.setItem("rememberedUsername", cleanUsername);
      } else {
        localStorage.removeItem("rememberedUsername");
      }
      
      // Delay to let user see success message
      setTimeout(() => {
        completeLogin(userInfo);
        onClose?.();
      }, 1200);
    } else {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  if (showForgot) {
    return <ForgotPassword onBack={() => setShowForgot(false)} onNext={(email) => window.location.href = "/reset-password?email=" + encodeURIComponent(email)} />;
  }

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
              <h1 className="auth-title">Đăng nhập</h1>
              <p className="auth-subtitle">Nhập thông tin tài khoản để truy cập hệ thống</p>
            </div>

            {success && <div className="auth-toast">{success}</div>}
            {authError && !success && <div className="auth-error-box">{authError}</div>}

            <div className="auth-form">
              <div className="auth-field">
                <label className="auth-label">Tên đăng nhập</label>
                <input
                    className={`auth-input ${errors.username ? 'auth-input--error' : ''}`}
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); if(errors.username) setErrors({...errors, username:null}); }}
                    onKeyDown={handleKeyDown}
                    autoFocus
                />
                {errors.username && <span className="auth-field-error">{errors.username}</span>}
              </div>

              <div className="auth-field">
                <label className="auth-label">Mật khẩu</label>
                <div className="auth-input-wrap">
                  <input
                      className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password:null}); }}
                      onKeyDown={handleKeyDown}
                  />
                  <button className="auth-eye" onClick={() => setShowPass(!showPass)} type="button">
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
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#374151' }}>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#7c3aed' }} />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button className="auth-link" onClick={() => { setAuthError?.(null); setShowForgot(true); }} type="button">
                  Quên mật khẩu?
                </button>
              </div>

              <button className="auth-btn" onClick={handleSubmit} disabled={loading || !!success} type="button">
                <span>{loading ? (success ? "Đang chuyển hướng..." : "Đang đăng nhập...") : "Đăng nhập"}</span>
                {!loading && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                )}
              </button>
            </div>

            <div className="auth-footer">© 2026 Minh Thang Factory. All rights reserved.</div>
          </div>
        </div>
      </div>
  );
};