import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import productService from "../../services/productService";

const STATUS_LABEL = {
    DRAFT:       { text: "Bản nháp",  cls: "sq-badge--draft" },
    ACTIVE:      { text: "Đang bán",  cls: "sq-badge--confirmed" },
    DEACTIVATED: { text: "Ngừng bán", cls: "sq-badge--rejected" },
};

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "DEACTIVATED"];

const formatPrice = (val) =>
    val != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : "—";

export const ProductDetail = ({ product: initial, onClose, onUpdated }) => {
    const { user } = useAuth();
    const [product, setProduct] = useState(initial);
    const [image, setImage] = useState(initial.imageUrl || null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

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

    useEffect(() => {
        productService.getById(initial.id)
            .then((data) => {
                setProduct(data);
                if (data.imageUrl) setImage(data.imageUrl);
            })
            .catch(() => {});
    }, [initial.id]);

    const canWrite = !!user;

    const handleSave = async () => {
        setLoading(true);
        setError("");
        try {
            const payload = { ...product, ...form };
            await productService.update(product.id, payload);
            setProduct(payload);
            setIsEditing(false);
            if (onUpdated) onUpdated(payload);
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
        } finally { setLoading(false); }
    };

    const handleImageChange = async (file) => {
        if (!file || !file.type.startsWith("image/")) return;
        if (file.size > 5 * 1024 * 1024) {
            setError("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        setImage(previewUrl);
        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await import("../../services/api").then(m =>
                m.default.post("/files/upload/products", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
            );
            const imageUrl = res.data?.data ?? res.data;
            const payload = { ...product, imageUrl };
            await productService.update(product.id, payload);
            setProduct(payload);
            if (onUpdated) onUpdated(payload);
        } catch (e) {
            setError(e.response?.data?.message || "Upload thất bại");
            setImage(product.imageUrl || null);
        } finally { setLoading(false); }
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={(e) => e.stopPropagation()} style={{ width: "720px" }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title">
                            {isEditing ? "Chỉnh sửa thành phẩm" : "Chi tiết thành phẩm"}
                        </h3>
                        <span className="sq-modal-sub">{product.sku} · {product.name}</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="sq-modal-body">
                    {error && (
                        <div className="sp-state sp-state--error" style={{ padding: "12px", marginBottom: "20px", borderRadius: "12px", background: "#fef2f2" }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <div style={{ display: "flex", gap: "32px" }}>
                        {/* Image section */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "200px" }}>
                            <div style={{ width: "200px", height: "200px", borderRadius: "16px", border: "2px dashed #e5e7eb", background: "#f9fafb", overflow: "hidden", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {image ? (
                                    <img src={image} alt="product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                    <div style={{ textAlign: "center", color: "#9ca3af" }}>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                                        </svg>
                                        <div style={{ fontSize: "12px", fontWeight: "500" }}>Chưa có ảnh</div>
                                    </div>
                                )}
                                {canWrite && (
                                    <button
                                        onClick={() => inputRef.current?.click()}
                                        disabled={loading}
                                        style={{
                                            position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", color: "white",
                                            border: "none", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0,
                                            transition: "opacity 0.2s", cursor: "pointer", fontSize: "13px", fontWeight: "600"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                                    >
                                        {loading ? "Đang tải..." : "Thay đổi ảnh"}
                                    </button>
                                )}
                                <input
                                    ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
                                    onChange={(e) => handleImageChange(e.target.files[0])}
                                />
                            </div>
                            
                            {!isEditing && (
                                <div style={{ background: "#f5f3ff", padding: "12px", borderRadius: "12px", border: "1.5px solid #ede9fe" }}>
                                    <span className="sod-info-label" style={{ color: "#7c3aed" }}>Trạng thái bán</span>
                                    <div style={{ marginTop: "6px" }}>
                                        <span className={`sq-badge ${STATUS_LABEL[product.status]?.cls || "sq-badge--draft"}`}>
                                            {STATUS_LABEL[product.status]?.text || product.status}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Info section */}
                        <div style={{ flex: 1 }}>
                            {isEditing ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div className="sq-f-group">
                                            <label className="sq-f-label">Mã SKU *</label>
                                            <input className="sq-f-input" value={form.sku} onChange={(e) => set("sku", e.target.value)} />
                                        </div>
                                        <div className="sq-f-group">
                                            <label className="sq-f-label">Tên sản phẩm *</label>
                                            <input className="sq-f-input" value={form.name} onChange={(e) => set("name", e.target.value)} />
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div className="sq-f-group">
                                            <label className="sq-f-label">Giá bán (VND)</label>
                                            <input className="sq-f-input" type="number" min="0" step="1000" value={form.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} />
                                        </div>
                                        <div className="sq-f-group">
                                            <label className="sq-f-label">Đơn vị tính *</label>
                                            <input className="sq-f-input" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                        <div className="sq-f-group">
                                            <label className="sq-f-label">Tồn kho hiện tại</label>
                                            <input className="sq-f-input" type="number" value={form.currentStock} onChange={(e) => set("currentStock", Number(e.target.value))} />
                                        </div>
                                        <div className="sq-f-group">
                                            <label className="sq-f-label">Trạng thái</label>
                                            <select className="sq-f-input" value={form.status} onChange={(e) => set("status", e.target.value)} style={{ cursor: "pointer" }}>
                                                {STATUS_OPTIONS.map((s) => (
                                                    <option key={s} value={s}>{STATUS_LABEL[s]?.text || s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="sq-f-group">
                                        <label className="sq-f-label">Mô tả sản phẩm</label>
                                        <textarea className="sq-f-input" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} style={{ minHeight: "80px", resize: "vertical" }} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                        <div>
                                            <span className="sod-info-label">Mã thành phẩm</span>
                                            <div className="sq-quote-id" style={{ marginTop: "4px" }}>{product.sku}</div>
                                        </div>
                                        <div>
                                            <span className="sod-info-label">Giá niêm yết</span>
                                            <div className="sp-td--price" style={{ marginTop: "4px", fontSize: "16px", fontWeight: "700" }}>{formatPrice(product.sellingPrice)}</div>
                                        </div>
                                        <div>
                                            <span className="sod-info-label">Tên gọi</span>
                                            <div className="sod-info-value" style={{ marginTop: "4px", fontSize: "15px" }}>{product.name}</div>
                                        </div>
                                        <div>
                                            <span className="sod-info-label">Số lượng tồn</span>
                                            <div className="sod-info-value" style={{ marginTop: "4px" }}>{product.currentStock ?? 0} {product.unit}</div>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="sod-info-label">Mô tả chi tiết</span>
                                        <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "12px", border: "1.5px solid #f0f0f5", fontSize: "13.5px", marginTop: "8px", lineHeight: "1.6", color: "#4b5563" }}>
                                            {product.description || "Thành phẩm này hiện chưa được cập nhật mô tả chi tiết."}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="sq-modal-footer">
                    {isEditing ? (
                        <>
                            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={() => setIsEditing(false)}>Hủy bỏ</button>
                            <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={loading || !form.name || !form.sku}>
                                {loading ? "Đang lưu..." : "Cập nhật dữ liệu"}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng cửa sổ</button>
                            {canWrite && (
                                <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => setIsEditing(true)}>Chỉnh sửa thông tin</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};