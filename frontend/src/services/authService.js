// ============================================================
// src/services/authService.js
// Khớp với AuthController: /api/v1/auth/login
// Response: { status, message, data: { token, id, username, role } }
// ============================================================

import api from "./api";

const authService = {
    // POST /api/v1/auth/login
    login: (username, password) =>
        api.post("/auth/login", { username, password }).then((res) => res.data.data),

    // POST /api/v1/auth/forgot-password
    forgotPassword: (email) =>
        api.post("/auth/forgot-password", { email }).then((res) => res.data),

    // POST /api/v1/auth/reset-password
    resetPassword: (token, newPassword) =>
        api.post("/auth/reset-password", { token, newPassword }).then((res) => res.data),

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    },
};

export default authService;