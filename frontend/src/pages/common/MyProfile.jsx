import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import userService from "../../services/userService";
import "./MyProfile.css";

export const MyProfile = () => {
    const { user, logout } = useAuth(); // If username changes, we'll need to logout
    const [activeTab, setActiveTab] = useState("info");
    
    // Trạng thái lưu trữ thông tin hồ sơ người dùng
    const [profile, setProfile] = useState({
        username: "",
        fullName: "",
        email: "",
        phoneNumber: "",
        gender: "Nam",
        address: "",
        department: "" 
    });
    
    // To know if username/email changed later
    const [initialUsername, setInitialUsername] = useState("");

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    const [isGenderOpen, setIsGenderOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });

    const checks = {
        length: passwords.newPassword.length >= 8,
        upper: /[A-Z]/.test(passwords.newPassword),
        number: /[0-9]/.test(passwords.newPassword),
        match: passwords.newPassword && passwords.newPassword === passwords.confirmPassword
    };

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [errors,  setErrors]  = useState({});

    // Hàm validation toàn diện cho tất cả các trường
    const validateField = (name, value) => {
        let error = "";
        switch (name) {
            case "fullName":
                if (!value.trim()) error = "Họ và tên không được để trống";
                else if (value.trim().length < 2) error = "Họ và tên quá ngắn";
                break;
            case "phoneNumber":
                const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;
                if (!value) error = "Số điện thoại không được để trống";
                else if (!phoneRegex.test(value)) error = "Số điện thoại không đúng định dạng VN";
                break;
            case "email":
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!value) error = "Email không được để trống";
                else if (!emailRegex.test(value)) error = "Email không đúng định dạng";
                break;
            case "username":
                if (!value) error = "Tên đăng nhập không được để trống";
                else if (value.length < 4) error = "Tên đăng nhập phải ít nhất 4 ký tự";
                break;
            default:
                break;
        }
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    useEffect(() => {
        // Lấy dữ liệu hồ sơ từ API khi component được mount
        const fetchProfile = async () => {
            try {
                const data = await userService.getProfile();
                setProfile({
                    username: data.username || "",
                    fullName: data.fullName || "",
                    email: data.email || "",
                    phoneNumber: data.phoneNumber || "",
                    gender: (data.gender === "Nữ") ? "Nữ" : "Nam",
                    address: data.address || "",
                    department: data.department || ""
                });
                setInitialUsername(data.username);
            } catch (err) {
                console.error("Lỗi lấy hồ sơ:", err);
            }
        };
        fetchProfile();

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsGenderOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!profile.username.trim()) {
            newErrors.username = "Tên đăng nhập không được để trống.";
        } else if (profile.username.length < 4 || /\s/.test(profile.username)) {
            newErrors.username = "Tên đăng nhập tối thiểu 4 ký tự và không có khoảng trắng.";
        }

        if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
            newErrors.email = "Email không hợp lệ.";
        }

        if (!profile.fullName.trim() || profile.fullName.trim().split(" ").length < 2) {
            newErrors.fullName = "Vui lòng nhập đầy đủ Họ và Tên.";
        }

        if (!profile.phoneNumber.trim() || !/^0[0-9]{9,10}$/.test(profile.phoneNumber.trim())) {
            newErrors.phoneNumber = "Số điện thoại chưa đúng định dạng.";
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 5000);
            return;
        }

        setLoading(true);
        setErrors({});
        try {
            await userService.updateProfile(profile);
            
            // Nếu thay đổi username, hệ thống yêu cầu đăng nhập lại để làm mới Token
            if (profile.username !== initialUsername) {
                setMessage({ type: "success", text: "Đổi Tên đăng nhập thành công. Vui lòng đăng nhập lại!" });
                setTimeout(() => logout(), 2500);
            } else {
                setMessage({ type: "success", text: "Cập nhật thông tin hồ sơ thành công!" });
                setTimeout(() => setMessage(null), 4000);
            }
        } catch (err) {
            const serverMsg = err.response?.data?.message || err.response?.data || "Lỗi hệ thống.";
            setErrors({ general: serverMsg });
            setTimeout(() => setErrors({}), 6000);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!passwords.currentPassword) newErrors.currentPassword = "Nhập mật khẩu hiện tại.";
        if (!checks.length || !checks.upper || !checks.number) newErrors.newPassword = "Mật khẩu chưa đủ mạnh.";
        if (!checks.match) newErrors.confirmPassword = "Xác nhận không khớp.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => setErrors({}), 5000);
            return;
        }
        
        setLoading(true);
        setErrors({});
        try {
            await userService.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setTimeout(() => setMessage(null), 4000);
        } catch (err) {
            const serverMsg = err.response?.data?.message || "Mật khẩu hiện tại không chính xác.";
            setErrors({ currentPassword: serverMsg });
            setTimeout(() => setErrors({}), 5000);
        } finally {
            setLoading(false);
        }
    };

    const getFullRoleName = (role) => {
        const map = {
            'ROLE_ADMIN': 'Quản trị hệ thống',
            'ROLE_DIRECTOR': 'Giám đốc',
            'ROLE_PRODUCTION_MANAGER': 'Quản lý sản xuất',
            'ROLE_SALES_STAFF': 'Nhân viên Kinh doanh'
        };
        return map[role] || role.replace("ROLE_", "");
    };

    return (
        <div className="profile-wrapper">
            <div className="profile-grid">
                <aside className="profile-side-card">
                    <div className="profile-avatar-wrapper"><div className="profile-avatar">{user?.username?.charAt(0)?.toUpperCase()}</div></div>
                    <h3 className="profile-user-name">{user?.username}</h3>
                    <p className="profile-user-role">{getFullRoleName(user?.role)}</p>
                    <nav className="profile-nav">
                        <button className={`profile-nav-item ${activeTab === "info" ? "profile-nav-item--active" : ""}`} onClick={() => { setActiveTab("info"); setErrors({}); setMessage(null); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Thông tin cá nhân
                        </button>
                        <button className={`profile-nav-item ${activeTab === "password" ? "profile-nav-item--active" : ""}`} onClick={() => { setActiveTab("password"); setErrors({}); setMessage(null); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                            Bảo mật & Mật khẩu
                        </button>
                    </nav>
                </aside>

                <main className="profile-content-card">
                    {message && <div className={`sq-toast sq-toast--${message.type}`} style={{ marginBottom: "24px" }}>{message.text}</div>}
                    {errors.general && <div className="lp-error" style={{ marginBottom: "24px" }}>{errors.general}</div>}

                    {activeTab === "info" ? (
                        <form onSubmit={handleProfileSubmit}>
                            <h2 className="profile-section-title">Hồ sơ cá nhân</h2>
                            <div className="profile-form-grid">
                                <div className="profile-form-group">
                                    <label className="profile-label">Tên đăng nhập<span className="required">*</span></label>
                                    <input className={`profile-input ${errors.username ? "profile-input--error" : ""}`} value={profile.username} onChange={(e) => setProfile({...profile, username: e.target.value})} placeholder="Tên tài khoản (không khoảng trắng)" />
                                    {errors.username && <div className="lp-field-error">{errors.username}</div>}
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Email<span className="required">*</span></label>
                                    <input className={`profile-input ${errors.email ? "profile-input--error" : ""}`} value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} placeholder="Địa chỉ email liên hệ" />
                                    {errors.email && <div className="lp-field-error">{errors.email}</div>}
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Họ và tên<span className="required">*</span></label>
                                    <input className={`profile-input ${errors.fullName ? "profile-input--error" : ""}`} value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} placeholder="Họ và tên đầy đủ" />
                                    {errors.fullName && <div className="lp-field-error">{errors.fullName}</div>}
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Số điện thoại<span className="required">*</span></label>
                                    <input className={`profile-input ${errors.phoneNumber ? "profile-input--error" : ""}`} value={profile.phoneNumber} onChange={(e) => setProfile({...profile, phoneNumber: e.target.value})} placeholder="Số điện thoại" />
                                    {errors.phoneNumber && <div className="lp-field-error">{errors.phoneNumber}</div>}
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Giới tính</label>
                                    <div className="gender-select-container" ref={dropdownRef}>
                                        <div className={`gender-select-trigger ${isGenderOpen ? "active" : ""}`} onClick={() => setIsGenderOpen(!isGenderOpen)}>{profile.gender} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M6 9l6 6 6-6"/></svg></div>
                                        {isGenderOpen && (
                                            <div className="gender-dropdown-menu">
                                                <div className={`gender-option ${profile.gender === "Nam" ? "selected" : ""}`} onClick={() => { setProfile({...profile, gender: "Nam"}); setIsGenderOpen(false); }}>Nam</div>
                                                <div className={`gender-option ${profile.gender === "Nữ" ? "selected" : ""}`} onClick={() => { setProfile({...profile, gender: "Nữ"}); setIsGenderOpen(false); }}>Nữ</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="profile-form-group profile-form-group--full">
                                    <label className="profile-label">Địa chỉ</label>
                                    <input className="profile-input" value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} placeholder="Địa chỉ chi tiết" />
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Vai trò</label>
                                    <div style={{ padding: "12px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", fontSize: "14px", fontWeight: "700", color: "#64748b" }}>{getFullRoleName(user?.role)}</div>
                                </div>
                            </div>
                            <button className="profile-btn-save" type="submit" disabled={loading}>{loading ? "Đang xử lý..." : "Lưu thông tin"}</button>
                        </form>
                    ) : (
                        <form onSubmit={handlePasswordSubmit}>
                            <h2 className="profile-section-title">Đổi mật khẩu</h2>
                            <div style={{ maxWidth: "500px", display: "flex", flexDirection: "column", gap: "24px" }}>
                                <div className="profile-form-group">
                                    <label className="profile-label">Mật khẩu hiện tại<span className="required">*</span></label>
                                    <div className="profile-input-wrap">
                                        <input className={`profile-input ${errors.currentPassword ? "profile-input--error" : ""}`} type={showPass.current ? "text" : "password"} value={passwords.currentPassword} onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} placeholder="Mật khẩu đang dùng" />
                                        <button type="button" className="password-eye-btn" onClick={() => setShowPass({...showPass, current: !showPass.current})}>
                                            {showPass.current ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.currentPassword && <div className="lp-field-error">{errors.currentPassword}</div>}
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Mật khẩu mới<span className="required">*</span></label>
                                    <div className="profile-input-wrap">
                                        <input className={`profile-input ${errors.newPassword ? "profile-input--error" : ""}`} type={showPass.new ? "text" : "password"} value={passwords.newPassword} onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} placeholder="Tối thiểu 8 ký tự" />
                                        <button type="button" className="password-eye-btn" onClick={() => setShowPass({...showPass, new: !showPass.new})}>
                                            {showPass.new ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.newPassword && <div className="lp-field-error">{errors.newPassword}</div>}
                                    <div className="password-requirements">
                                        <div style={{ height: 5, borderRadius: 3, background: '#e2e8f0', overflow: 'hidden', marginBottom: 12 }}><div style={{ height: '100%', width: `${((checks.length + checks.upper + (checks.number ? 1 : 0)) / 3) * 100}%`, background: checks.length && checks.upper && checks.number ? '#10b981' : (passwords.newPassword ? '#f59e0b' : '#e2e8f0'), transition: '0.3s' }} /></div>
                                        <div className={`requirement-item ${checks.length ? "requirement-item--valid" : "requirement-item--invalid"}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>Ít nhất 8 ký tự</div>
                                        <div className={`requirement-item ${checks.upper ? "requirement-item--valid" : "requirement-item--invalid"}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>Ít nhất 1 chữ hoa</div>
                                        <div className={`requirement-item ${checks.number ? "requirement-item--valid" : "requirement-item--invalid"}`}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5"/></svg>Ít nhất 1 chữ số</div>
                                    </div>
                                </div>
                                <div className="profile-form-group">
                                    <label className="profile-label">Xác nhận mật khẩu<span className="required">*</span></label>
                                    <div className="profile-input-wrap">
                                        <input className={`profile-input ${errors.confirmPassword ? "profile-input--error" : ""}`} type={showPass.confirm ? "text" : "password"} value={passwords.confirmPassword} onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})} placeholder="Xác nhận mật khẩu" />
                                        <button type="button" className="password-eye-btn" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}>
                                            {showPass.confirm ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            )}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <div className="lp-field-error">{errors.confirmPassword}</div>}
                                </div>
                                <button className="profile-btn-save" type="submit" disabled={loading}>{loading ? "Đang xử lý..." : "Cập nhật mật khẩu ngay"}</button>
                            </div>
                        </form>
                    )}
                </main>
            </div>
        </div>
    );
};
