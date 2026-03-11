// ============================================================
// src/context/AuthContext.jsx
// JwtResponse: { token, id, username, role }  (role là string đơn)
// ============================================================

import { createContext, useContext, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Xóa session cũ khi khởi động app → bắt buộc đăng nhập lại
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError,   setAuthError]   = useState(null);

  // ── Login ──────────────────────────────────────────────────
  const login = async (username, password) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // data = { token, id, username, role }
      const data = await authService.login(username, password);
      const userInfo = { id: data.id, username: data.username, role: data.role };
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(userInfo));
      setUser(userInfo);
      // Báo cho các hook biết đã login → refetch data
      window.dispatchEvent(new Event("auth-change"));
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu";
      setAuthError(msg);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const logout = () => {
    authService.logout();
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
  };

  // ── Forgot password ────────────────────────────────────────
  const forgotPassword = async (email) => {
    const res = await authService.forgotPassword(email);
    return res; // trả về message string
  };

  // ── Reset password ─────────────────────────────────────────
  const resetPassword = async (token, newPassword) => {
    const res = await authService.resetPassword(token, newPassword);
    return res;
  };

  // role là string đơn: "ROLE_ADMIN", "ROLE_DIRECTOR", v.v.
  const hasRole = (...roles) => roles.some((r) => user?.role === `ROLE_${r}`);

  return (
      <AuthContext.Provider
          value={{ user, login, logout, forgotPassword, resetPassword, hasRole, authLoading, authError, setAuthError }}
      >
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);