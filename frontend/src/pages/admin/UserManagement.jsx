import { useState, useEffect } from "react";
import userService from "../../services/userService";
import "./UserManagement.css";

const ROLE_LABELS = {
    ROLE_ADMIN: "Quản trị viên",
    ROLE_DIRECTOR: "Giám đốc",
    ROLE_PRODUCTION_MANAGER: "Quản lý sản xuất",
    ROLE_SALES_STAFF: "Nhân viên kinh doanh",
};

export const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterRole, setFilterRole] = useState("ALL");
    const [filterStatus, setFilterStatus] = useState("ALL");

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        role: "",
        isActive: true,
    });
    const [formError, setFormError] = useState("");
    const [saving, setSaving] = useState(false);

    // Confirm dialog
    const [confirmModal, setConfirmModal] = useState({ show: false, type: "", user: null });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersData, rolesData] = await Promise.all([
                userService.getAllUsers(),
                userService.getAllRoles(),
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filteredUsers = users.filter((u) => {
        const matchSearch =
            u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRole = filterRole === "ALL" || u.role === filterRole;
        const matchStatus =
            filterStatus === "ALL" ||
            (filterStatus === "ACTIVE" && u.isActive) ||
            (filterStatus === "LOCKED" && !u.isActive);
        return matchSearch && matchRole && matchStatus;
    });

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ username: "", email: "", password: "", role: roles[0]?.roleName || "", isActive: true });
        setFormError("");
        setShowModal(true);
    };

    const openEditModal = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email || "",
            password: "",
            role: user.role || "",
            isActive: user.isActive,
        });
        setFormError("");
        setShowModal(true);
    };

    const handleFormChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFormError("");
    };

    const handleSubmit = async () => {
        if (!formData.username.trim()) { setFormError("Tên đăng nhập không được để trống."); return; }
        if (!editingUser && !formData.password.trim()) { setFormError("Mật khẩu không được để trống."); return; }

        setSaving(true);
        try {
            const payload = {
                username: formData.username,
                email: formData.email || null,
                role: { roleName: formData.role },
                isActive: formData.isActive,
            };
            if (formData.password.trim()) {
                payload.password = formData.password;
            }

            if (editingUser) {
                await userService.updateUser(editingUser.id, payload);
            } else {
                await userService.createUser(payload);
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || "Có lỗi xảy ra.";
            setFormError(typeof msg === "string" ? msg : JSON.stringify(msg));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = async (user) => {
        try {
            if (user.isActive) {
                await userService.lockUser(user.id);
            } else {
                await userService.unlockUser(user.id);
            }
            fetchData();
        } catch (err) {
            alert(err?.response?.data?.message || "Có lỗi xảy ra.");
        }
        setConfirmModal({ show: false, type: "", user: null });
    };

    const handleDelete = async (user) => {
        try {
            await userService.deleteUser(user.id);
            fetchData();
        } catch (err) {
            alert(err?.response?.data?.message || "Có lỗi xảy ra.");
        }
        setConfirmModal({ show: false, type: "", user: null });
    };

    if (loading) {
        return (
            <div className="um-loading">
                <div className="um-spinner"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="um-container">
            {/* Header */}
            <div className="um-header">
                <div>
                    <h1 className="um-title">Quản lý người dùng</h1>
                    <p className="um-subtitle">Quản lý tài khoản, phân quyền và trạng thái người dùng trong hệ thống.</p>
                </div>
                <button className="um-btn um-btn--primary" onClick={openCreateModal}>
                    + Thêm người dùng
                </button>
            </div>

            {/* Stats */}
            <div className="um-stats">
                <div className="um-stat-card">
                    <span className="um-stat-number">{users.length}</span>
                    <span className="um-stat-label">Tổng người dùng</span>
                </div>
                <div className="um-stat-card um-stat-card--green">
                    <span className="um-stat-number">{users.filter(u => u.isActive).length}</span>
                    <span className="um-stat-label">Đang hoạt động</span>
                </div>
                <div className="um-stat-card um-stat-card--red">
                    <span className="um-stat-number">{users.filter(u => !u.isActive).length}</span>
                    <span className="um-stat-label">Đã khóa</span>
                </div>
                <div className="um-stat-card um-stat-card--purple">
                    <span className="um-stat-number">{new Set(users.map(u => u.role)).size}</span>
                    <span className="um-stat-label">Vai trò</span>
                </div>
            </div>

            {/* Filters */}
            <div className="um-filters">
                <input
                    className="um-search"
                    type="text"
                    placeholder="Tìm kiếm theo tên, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select className="um-select" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                    <option value="ALL">Tất cả vai trò</option>
                    {roles.map((r) => (
                        <option key={r.id} value={r.roleName}>{ROLE_LABELS[r.roleName] || r.roleName}</option>
                    ))}
                </select>
                <select className="um-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="LOCKED">Đã khóa</option>
                </select>
            </div>

            {/* Table */}
            <div className="um-table-wrap">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tên đăng nhập</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Trạng thái</th>
                            <th style={{ textAlign: "center" }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="um-empty">Không có dữ liệu.</td>
                            </tr>
                        ) : (
                            filteredUsers.map((u) => (
                                <tr key={u.id}>
                                    <td className="um-cell-id">{u.id}</td>
                                    <td>
                                        <div className="um-user-cell">
                                            <div className="um-avatar">{u.username?.charAt(0)?.toUpperCase()}</div>
                                            <span className="um-username">{u.username}</span>
                                        </div>
                                    </td>
                                    <td className="um-cell-email">{u.email || "—"}</td>
                                    <td>
                                        <span className={`um-role-badge um-role--${(u.role || "").replace("ROLE_", "").toLowerCase()}`}>
                                            {ROLE_LABELS[u.role] || u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`um-status ${u.isActive ? "um-status--active" : "um-status--locked"}`}>
                                            {u.isActive ? "Hoạt động" : "Đã khóa"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="um-actions">
                                            <button className="um-action-btn um-action-btn--edit" onClick={() => openEditModal(u)} title="Sửa">
                                                Sửa
                                            </button>
                                            <button
                                                className={`um-action-btn ${u.isActive ? "um-action-btn--lock" : "um-action-btn--unlock"}`}
                                                onClick={() => setConfirmModal({ show: true, type: "lock", user: u })}
                                                title={u.isActive ? "Khóa" : "Mở khóa"}
                                            >
                                                {u.isActive ? "Khóa" : "Mở khóa"}
                                            </button>
                                            <button
                                                className="um-action-btn um-action-btn--delete"
                                                onClick={() => setConfirmModal({ show: true, type: "delete", user: u })}
                                                title="Xóa"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="um-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="um-modal-header">
                            <h2>{editingUser ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}</h2>
                            <button className="um-modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="um-modal-body">
                            {formError && <div className="um-form-error">{formError}</div>}

                            <div className="um-form-group">
                                <label>Tên đăng nhập <span className="um-required">*</span></label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => handleFormChange("username", e.target.value)}
                                    placeholder="Nhập tên đăng nhập"
                                />
                            </div>
                            <div className="um-form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleFormChange("email", e.target.value)}
                                    placeholder="Nhập email"
                                />
                            </div>
                            <div className="um-form-group">
                                <label>Mật khẩu {!editingUser && <span className="um-required">*</span>}</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleFormChange("password", e.target.value)}
                                    placeholder={editingUser ? "Để trống nếu không đổi" : "Nhập mật khẩu (tối thiểu 8 ký tự, 1 chữ hoa, 1 số)"}
                                />
                            </div>
                            <div className="um-form-group">
                                <label>Vai trò</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => handleFormChange("role", e.target.value)}
                                >
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.roleName}>
                                            {ROLE_LABELS[r.roleName] || r.roleName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {editingUser && (
                                <div className="um-form-group um-form-group--checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => handleFormChange("isActive", e.target.checked)}
                                        />
                                        Tài khoản hoạt động
                                    </label>
                                </div>
                            )}
                        </div>
                        <div className="um-modal-footer">
                            <button className="um-btn um-btn--secondary" onClick={() => setShowModal(false)}>Hủy</button>
                            <button className="um-btn um-btn--primary" onClick={handleSubmit} disabled={saving}>
                                {saving ? "Đang lưu..." : editingUser ? "Cập nhật" : "Tạo mới"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal.show && (
                <div className="um-modal-overlay" onClick={() => setConfirmModal({ show: false, type: "", user: null })}>
                    <div className="um-modal um-modal--confirm" onClick={(e) => e.stopPropagation()}>
                        <div className="um-modal-header">
                            <h2>{confirmModal.type === "delete" ? "Xác nhận xóa" : confirmModal.user?.isActive ? "Xác nhận khóa" : "Xác nhận mở khóa"}</h2>
                            <button className="um-modal-close" onClick={() => setConfirmModal({ show: false, type: "", user: null })}>&times;</button>
                        </div>
                        <div className="um-modal-body">
                            {confirmModal.type === "delete" ? (
                                <p>Bạn có chắc chắn muốn xóa người dùng <strong>{confirmModal.user?.username}</strong>? Hành động này không thể hoàn tác.</p>
                            ) : (
                                <p>
                                    Bạn có chắc chắn muốn {confirmModal.user?.isActive ? "khóa" : "mở khóa"} tài khoản{" "}
                                    <strong>{confirmModal.user?.username}</strong>?
                                </p>
                            )}
                        </div>
                        <div className="um-modal-footer">
                            <button className="um-btn um-btn--secondary" onClick={() => setConfirmModal({ show: false, type: "", user: null })}>Hủy</button>
                            <button
                                className={`um-btn ${confirmModal.type === "delete" ? "um-btn--danger" : "um-btn--primary"}`}
                                onClick={() =>
                                    confirmModal.type === "delete"
                                        ? handleDelete(confirmModal.user)
                                        : handleToggleLock(confirmModal.user)
                                }
                            >
                                {confirmModal.type === "delete" ? "Xóa" : confirmModal.user?.isActive ? "Khóa" : "Mở khóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
