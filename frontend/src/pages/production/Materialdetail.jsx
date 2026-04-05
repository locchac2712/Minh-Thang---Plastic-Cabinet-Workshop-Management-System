// ============================================================
// src/pages/MaterialDetail.jsx
// Hiển thị chi tiết 1 vật liệu + CRUD actions
// ============================================================
import { useState } from "react";
import "./Materialdetail.css";
import { useAuth } from "../../context/AuthContext.jsx";
import materialService from "../../services/materialService.js";

// ── Edit Form Modal ──────────────────────────────────────────
const EditForm = ({ initial, onSave, onClose, loading }) => {
    const [form, setForm] = useState({
        materialName:  initial.materialName || "",
        unit:          initial.unit         || "",
        materialType:  initial.materialType || "",
        standardSize:  initial.standardSize || "",
        description:   initial.description  || "",
    });
    const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    return (
        <div className="md-overlay" onClick={onClose}>
            <div className="md-modal" onClick={(e) => e.stopPropagation()}>
                <div className="md-modal__header">n
                    <h3>Chỉnh sửa vật liệu</h3>
                    <button className="md-modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="md-modal__body">
                    <div className="md-form-row">
                        <div className="md-form-group">
                            <label>Tên vật liệu *</label>
                            <input value={form.materialName} onChange={(e) => set("materialName", e.target.value)} />
                        </div>
                        <div className="md-form-group">
                            <label>Đơn vị</label>
                            <input value={form.unit || ""} onChange={(e) => set("unit", e.target.value)} placeholder="Kg, cái, hộp..." />
                        </div>
                    </div>
                    <div className="md-form-row">
                        <div className="md-form-group">
                            <label>Loại NVL</label>
                            <input value={form.materialType || ""} onChange={(e) => set("materialType", e.target.value)} />
                        </div>
                        <div className="md-form-group">
                            <label>Kích thước chuẩn</label>
                            <input value={form.standardSize || ""} onChange={(e) => set("standardSize", e.target.value)} />
                        </div>
                    </div>
                    <div className="md-form-group">
                        <label>Mô tả</label>
                        <textarea value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} />
                    </div>
                </div>
                <div className="md-modal__footer">
                    <button className="btn btn--ghost" onClick={onClose}>Hủy</button>
                    <button
                        className="btn btn--primary"
                        onClick={() => onSave(form)}
                        disabled={loading || !form.materialName}
                    >
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Confirm Delete ───────────────────────────────────────────
const ConfirmDelete = ({ name, onConfirm, onClose, loading }) => (
    <div className="md-overlay" onClick={onClose}>
        <div className="md-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="md-confirm__icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6V20a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </div>
            <h3>Xác nhận xóa</h3>
            <p>Bạn chắc chắn muốn xóa <strong>{name}</strong>?<br />Hành động này không thể hoàn tác.</p>
            <div className="md-confirm__actions">
                <button className="btn btn--ghost" onClick={onClose}>Hủy</button>
                <button className="btn btn--danger" onClick={onConfirm} disabled={loading}>
                    {loading ? "Đang xóa..." : "Xóa"}
                </button>
            </div>
        </div>
    </div>
);

// ── Info Row component ───────────────────────────────────────
const InfoRow = ({ label, value, highlight }) => (
    <div className="md-info-row">
        <span className="md-info-label">{label}</span>
        <span className={`md-info-value${highlight ? " md-info-value--highlight" : ""}`}>
      {value ?? "—"}
    </span>
    </div>
);

// ── Main Page ────────────────────────────────────────────────
export const MaterialDetail = ({ material: initialMaterial, onBack, onDeleted }) => {
    const { user, hasRole } = useAuth();
    const [material,      setMaterial]      = useState(initialMaterial);
    const [showEdit,      setShowEdit]      = useState(false);
    const [showDelete,    setShowDelete]    = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast,         setToast]         = useState(null);

    // Hiện nút cho tất cả user đã đăng nhập
    // (phân quyền thật sự do backend kiểm soát qua @PreAuthorize)
    const isLoggedIn = !!user;
    const canWrite   = isLoggedIn;
    const canDelete  = hasRole?.("ADMIN", "DIRECTOR") || user?.role?.includes("ADMIN") || user?.role?.includes("DIRECTOR");

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (form) => {
        setActionLoading(true);
        try {
            const payload = { ...material, ...form };
            await materialService.update(material.id, payload);
            setMaterial(payload);
            setShowEdit(false);
            showToast("Cập nhật thành công!");
        } catch (e) {
            showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally { setActionLoading(false); }
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await materialService.remove(material.id);
            showToast("Đã xóa thành công!");
            setTimeout(() => onDeleted(), 1200);
        } catch (e) {
            showToast(e.response?.data?.message || "Xóa thất bại", "error");
            setActionLoading(false);
        }
    };

    const stockPercent = material.minStockLevel > 0
        ? Math.min((material.currentStock / (material.minStockLevel * 3)) * 100, 100)
        : 100;

    return (
        <div className="md-page">
            {toast && <div className={`md-toast md-toast--${toast.type}`}>{toast.msg}</div>}

            {/* Back button + actions */}
            <div className="md-topbar">
                <button className="md-back-btn" onClick={onBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Quay lại danh sách
                </button>

                <div className="md-actions">
                    {canWrite && (
                        <button className="btn btn--primary" onClick={() => setShowEdit(true)} disabled={actionLoading}>
                            Cập nhật
                        </button>
                    )}
                    {canDelete && (
                        <button className="btn btn--danger-outline" onClick={() => setShowDelete(true)}>
                            Xóa
                        </button>
                    )}
                </div>
            </div>

            {/* Header card */}
            <div className="md-header-card">
                <div className="md-header-card__left">
                    <div className="md-avatar">
                        {material.materialName?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                        <h1 className="md-name">
                            {material.materialName || <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Chưa có tên — bấm Cập nhật để sửa</span>}
                        </h1>
                        <span className="md-sku-badge">{material.sku}</span>
                    </div>
                </div>
            </div>

            {/* Content grid */}
            <div className="md-grid">

                {/* Info card */}
                <div className="md-card md-card--info">
                    <div className="md-card__title">Thông tin chi tiết</div>
                    <div className="md-info-list">
                        <InfoRow label="SKU"               value={material.sku} highlight />
                        <InfoRow label="Tên vật liệu"      value={material.materialName} />
                        <InfoRow label="Đơn vị tính"       value={material.unit} />
                        <InfoRow label="Loại NVL"          value={material.materialType} />
                        <InfoRow label="Kích thước chuẩn"  value={material.standardSize} />
                    </div>
                </div>

                {/* Description card */}
                <div className="md-card md-card--desc">
                    <div className="md-card__title">Mô tả</div>
                    <p className="md-desc-text">
                        {material.description || "Chưa có mô tả cho vật liệu này."}
                    </p>
                </div>

            </div>

            {/* Modals */}
            {showEdit && (
                <EditForm
                    initial={material}
                    onSave={handleSave}
                    onClose={() => setShowEdit(false)}
                    loading={actionLoading}
                />
            )}
            {showDelete && (
                <ConfirmDelete
                    name={material.materialName}
                    onConfirm={handleDelete}
                    onClose={() => setShowDelete(false)}
                    loading={actionLoading}
                />
            )}
        </div>
    );
};