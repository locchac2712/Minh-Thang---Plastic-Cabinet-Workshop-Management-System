// ============================================================
// src/context/AuthContext.jsx
// JwtResponse: { token, id, username, role }  (role là string đơn)
// ============================================================

import { createContext, useContext, useEffect, useState } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(() => {
    // Nếu đã có user trong localStorage thì không cần hiện màn hình loading hệ thống
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    return !!token && !savedUser; // Chỉ loading nếu có token mà chưa có user info
  });
  const [authError,   setAuthError]   = useState(null);

  // ── Verify session on mount ───────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const freshUser = await authService.getCurrentUser();
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (err) {
        console.error("Session verification failed", err);
        // api.js handles 401 redirect, but we clear state here for safety
        if (err.response?.status === 401) {
          setUser(null);
        }
      } finally {
        setAuthLoading(false);
      }
    };
    verify();
  }, []);

  const login = async (username, password) => {
    setAuthError(null);
    try {
      // data = { token, id, username, role }
      const data = await authService.login(username, password);
      const userInfo = { id: data.id, username: data.username, role: data.role };
      
      // Lưu vào localStorage trước để nếu user F5 vẫn giữ được phiên
      localStorage.setItem("token", data.token);
      localStorage.setItem("user",  JSON.stringify(userInfo));
      
      return userInfo;
    } catch (err) {
      const msg = err.response?.data?.message || "Sai tên đăng nhập hoặc mật khẩu";
      setAuthError(msg);
      return null;
    }
  };

  const completeLogin = (userInfo) => {
    setUser(userInfo);
    window.dispatchEvent(new Event("auth-change"));
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
  const resetPassword = async (otp, newPassword) => {
    const res = await authService.resetPassword(otp, newPassword);
    return res;
  };

  // role là string đơn: "ROLE_ADMIN", "ROLE_DIRECTOR", v.v.
  const hasRole = (...roles) => roles.some((r) => user?.role === `ROLE_${r}`);

  return (
      <AuthContext.Provider
          value={{ user, login, completeLogin, logout, forgotPassword, resetPassword, hasRole, authLoading, authError, setAuthError }}
      >
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);