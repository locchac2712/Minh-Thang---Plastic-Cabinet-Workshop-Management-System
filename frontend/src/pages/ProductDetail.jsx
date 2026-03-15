import { useState, useRef, useEffect } from "react";
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

// ── Image Upload ───────────────────────────────────────────────
const ProductImage = ({ image, onImageChange, canWrite, loading }) => {
    const inputRef = useRef(null);

    const handleFile = (file) => {
        if (!file || !file.type.startsWith("image/")) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        onImageChange(file, previewUrl);
    };

    return (
        <div className="pd-img-wrap">
            {/* Ảnh lớn */}
            <div className="pd-img-box">
                {image ? (
                    <img src={image} alt="product" className="pd-img-preview" />
                ) : (
                    <div className="pd-img-placeholder">
                        <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                        >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <span className="pd-img-placeholder__text">Chưa có ảnh</span>
                    </div>
                )}

                {loading && (
                    <div className="pd-img-loading">
                        <div className="pd-img-spinner" />
                        <span>Đang upload...</span>
                    </div>
                )}
            </div>

            {/* Nút upload */}
            {canWrite && (
                <button
                    className="pd-img-upload-btn"
                    onClick={() => inputRef.current?.click()}
                    disabled={loading}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                    >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>

                    {loading ? "Đang upload..." : image ? "Thay ảnh" : "Upload ảnh"}
                </button>
            )}

            {/* Input hidden */}
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => handleFile(e.target.files[0])}
            />
        </div>
    );
};

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
                            <label>Giá bán (VNĐ)</label>
                            <div className="pd-price-wrap">
                                <span className="pd-price-prefix">₫</span>
                                <input
                                    type="number" min="0" step="1000"
                                    value={form.sellingPrice}
                                    onChange={(e) => set("sellingPrice", e.target.value === "" ? 0 : Number(e.target.value))}
                                    placeholder="0"
                                    className="pd-price-input"
                                />
                            </div>
                            {form.sellingPrice > 0 && (
                                <span className="pd-price-preview">
                  = {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(form.sellingPrice)}
                </span>
                            )}
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
    const [image,         setImage]         = useState(initial.imageUrl || null);
    const [showEdit,      setShowEdit]      = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [toast,         setToast]         = useState(null);

    // Fetch lại từ API để đảm bảo có imageUrl đầy đủ
    useEffect(() => {
        productService.getById(initial.id)
            .then((data) => {
                setProduct(data);
                if (data.imageUrl) setImage(data.imageUrl);
            })
            .catch(() => {});
    }, [initial.id]);

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

    const handleImageChange = async (file, previewUrl) => {
        setImage(previewUrl); // Hiện preview ngay
        setActionLoading(true);
        try {
            // Upload file lên server
            const formData = new FormData();
            formData.append("file", file);
            const res = await import("../services/api").then(m =>
                m.default.post("/files/upload/products", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
            );
            const imageUrl = res.data?.data ?? res.data;
            // Lưu URL vào product
            const payload = { ...product, imageUrl };
            await productService.update(product.id, payload);
            setProduct(payload);
            showToast("Upload ảnh thành công!");
        } catch (e) {
            showToast(e.response?.data?.message || "Upload thất bại", "error");
            setImage(product.imageUrl || null); // Rollback nếu lỗi
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
                    <ProductImage image={image} onImageChange={handleImageChange} canWrite={canWrite} loading={actionLoading} />
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