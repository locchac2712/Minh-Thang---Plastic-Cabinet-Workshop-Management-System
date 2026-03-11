import { useState } from "react";
import "./ProductDetail.css";
import { useAuth } from "../context/AuthContext";
import productService from "../services/productService";

const STATUS_LABEL = {
    DRAFT:       { text: "Bản nháp",  cls: "prod-status--draft" },
    ACTIVE:      { text: "Đang bán",  cls: "prod-status--active" },
    DEACTIVATED: { text: "Ngừng bán", cls: "prod-status--deactivated" },
};

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "DEACTIVATED"];

const formatPrice = (val) =>
    val != null
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
        : "—";

// ── Edit Form ──────────────────────────────────────────────────
const EditForm = ({ initial, onSave, onClose, loading }) => {
    const [form, setForm] = useState({
        name:         initial.name         || "",
        sku:          initial.sku          || "",
        unit:         initial.unit         || "",
        sellingPrice: initial.sellingPrice ?? 0,
        description:  initial.description  || "",
        status:       initial.status       || "DRAFT",
        currentStock: initial.currentStock ?? 0,
    });
    const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    return (
        <div className="pd-overlay" onClick={onClose}>
            <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
                <div className="pd-modal__header">
                    <h3>Cập nhật thành phẩm</h3>
                    <button className="pd-modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="pd-modal__body">
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label>SKU *</label>
                            <input value={form.sku} onChange={(e) => set("sku", e.target.value)} />
                        </div>
                        <div className="pd-form-group">
                            <label>Tên sản phẩm *</label>
                            <input value={form.name} onChange={(e) => set("name", e.target.value)} />
                        </div>
                    </div>
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label>Đơn vị tính *</label>
                            <input value={form.unit} onChange={(e) => set("unit", e.target.value)} />
                        </div>
                        <div className="pd-form-group">
                            <label>Giá bán</label>
                            <input type="number" value={form.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="pd-form-row">
                        <div className="pd-form-group">
                            <label>Tồn kho</label>
                            <input type="number" value={form.currentStock} onChange={(e) => set("currentStock", Number(e.target.value))} />
                        </div>
                        <div className="pd-form-group">
                            <label>Trạng thái</label>
                            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{STATUS_LABEL[s]?.text || s}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="pd-form-group">
                        <label>Mô tả</label>
                        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
                    </div>
                </div>
                <div className="pd-modal__footer">
                    <button className="btn btn--ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn--primary" onClick={() => onSave(form)}
                            disabled={loading || !form.name || !form.sku || !form.unit}>
                        {loading ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Info Row ───────────────────────────────────────────────────
const InfoRow = ({ label, value, highlight }) => (
    <div className="pd-info-row">
        <span className="pd-info-label">{label}</span>
        <span className={`pd-info-value${highlight ? " pd-info-value--highlight" : ""}`}>{value ?? "—"}</span>
    </div>
);

// ── Main ───────────────────────────────────────────────────────
export const ProductDetail = ({ product: initial, onBack, onUpdated }) => {
    const { user } = useAuth();
    const [product,       setProduct]       = useState(initial);
    const [showEdit,      setShowEdit]      = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast,         setToast]         = useState(null);

    const canWrite = !!user;
    const s = STATUS_LABEL[product.status] || { text: product.status, cls: "" };

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (form) => {
        setActionLoading(true);
        try {
            const payload = { ...product, ...form };
            await productService.update(product.id, payload);
            setProduct(payload);
            setShowEdit(false);
            showToast("Cập nhật thành công!");
            if (onUpdated) onUpdated(payload);
        } catch (e) {
            showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally { setActionLoading(false); }
    };

    return (
        <div className="pd-page">
            {toast && <div className={`pd-toast pd-toast--${toast.type}`}>{toast.msg}</div>}

            {/* Topbar */}
            <div className="pd-topbar">
                <button className="pd-back-btn" onClick={onBack}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    Quay lại danh sách
                </button>
                {canWrite && (
                    <button className="btn btn--primary" onClick={() => setShowEdit(true)} disabled={actionLoading}>
                        ✏️ Cập nhật
                    </button>
                )}
            </div>

            {/* Header card */}
            <div className="pd-header-card">
                <div className="pd-header-card__left">
                    <div className="pd-avatar">{product.name?.charAt(0)?.toUpperCase() || "P"}</div>
                    <div>
                        <h1 className="pd-name">{product.name}</h1>
                        <span className="pd-sku-badge">{product.sku}</span>
                    </div>
                </div>
                <div className="pd-header-card__right">
                    <span className={`prod-status ${s.cls}`} style={{ fontSize: 13, padding: "5px 14px" }}>{s.text}</span>
                </div>
            </div>

            {/* Grid */}
            <div className="pd-grid">
                <div className="pd-card">
                    <div className="pd-card__title">📋 Thông tin sản phẩm</div>
                    <div className="pd-info-list">
                        <InfoRow label="SKU"           value={product.sku} highlight />
                        <InfoRow label="Tên sản phẩm" value={product.name} />
                        <InfoRow label="Đơn vị tính"  value={product.unit} />
                        <InfoRow label="Giá bán"       value={formatPrice(product.sellingPrice)} />
                        <InfoRow label="Tồn kho"       value={`${product.currentStock ?? 0} ${product.unit ?? ""}`} />
                        <InfoRow label="Trạng thái"    value={s.text} />
                    </div>
                </div>

                <div className="pd-card">
                    <div className="pd-card__title">📝 Mô tả</div>
                    <p className="pd-desc-text">{product.description || "Chưa có mô tả."}</p>
                </div>
            </div>

            {showEdit && (
                <EditForm initial={product} onSave={handleSave} onClose={() => setShowEdit(false)} loading={actionLoading} />
            )}
        </div>
    );
};