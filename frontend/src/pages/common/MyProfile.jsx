import { useAuth } from "../../context/AuthContext";
import "../sales/SalesPages.css";

export const MyProfile = () => {
    const { user } = useAuth();

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Hồ sơ của tôi</h1>
                    <p className="sp-subtitle">Quản lý thông tin cá nhân và tài khoản của bạn</p>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px" }}>
                {/* ── Thông tin cơ bản ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="sp-card" style={{ padding: "32px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
                            <div style={{ 
                                width: "80px", 
                                height: "80px", 
                                borderRadius: "24px", 
                                background: "linear-gradient(135deg, #7c3aed, #4f46e5)", 
                                color: "white", 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "center", 
                                fontSize: "32px", 
                                fontWeight: "800",
                                boxShadow: "0 10px 25px -5px rgba(124, 58, 237, 0.3)"
                            }}>
                                {user?.username?.charAt(0)?.toUpperCase() || "U"}
                            </div>
                            <div>
                                <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: 0 }}>{user?.username || "Người dùng"}</h2>
                                <p style={{ fontSize: "14px", color: "#64748b", margin: "4px 0 0" }}>Thành viên hệ thống PCWMS</p>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                            <div className="profile-info-item">
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Tên đăng nhập</label>
                                <div style={{ fontSize: "15px", fontWeight: "600", color: "#334155", padding: "12px 16px", background: "#f8fafc", borderRadius: "12px", border: "1.5px solid #f1f5f9" }}>
                                    {user?.username}
                                </div>
                            </div>
                            <div className="profile-info-item">
                                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Vai trò hệ thống</label>
                                <div style={{ display: "flex" }}>
                                    <span className="sq-badge sq-badge--confirmed" style={{ padding: "8px 16px", fontSize: "13px" }}>
                                        {user?.role || "Chưa xác định"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="sp-card" style={{ padding: "32px" }}>
                        <h3 style={{ fontSize: "16px", fontWeight: "800", color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Bảo mật tài khoản
                        </h3>
                        <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "24px" }}>Bạn nên thay đổi mật khẩu định kỳ để đảm bảo an toàn cho tài khoản cá nhân.</p>
                        <button className="sp-btn-primary" style={{ width: "fit-content", padding: "10px 24px" }}>
                            Đổi mật khẩu
                        </button>
                    </div>
                </div>

                {/* ── Side Info ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    <div className="sp-card" style={{ padding: "24px", background: "#f8fafc" }}>
                        <h4 style={{ fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "16px", textTransform: "uppercase" }}>Hoạt động gần đây</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", marginTop: "5px" }} />
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Đăng nhập hệ thống</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>Hôm nay, 14:30</div>
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7c3aed", marginTop: "5px" }} />
                                <div>
                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Cập nhật Kế hoạch SX</div>
                                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>Hôm qua, 09:15</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
