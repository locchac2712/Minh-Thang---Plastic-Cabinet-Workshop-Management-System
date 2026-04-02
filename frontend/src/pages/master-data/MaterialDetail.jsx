import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import materialService from "../../services/materialService";

export const MaterialDetail = ({ material: initialMaterial, onClose, onDeleted, onUpdated }) => {
    const { user, hasRole } = useAuth();
    const [material, setMaterial] = useState(initialMaterial);
    const [isEditing, setIsEditing] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        materialName:  initialMaterial.materialName || "",
        sku:           initialMaterial.sku          || "",
        unit:          initialMaterial.unit         || "",
        currentStock:  initialMaterial.currentStock ?? 0,
        minStockLevel: initialMaterial.minStockLevel ?? 0,
        price:         initialMaterial.price        ?? 0,
        description:   initialMaterial.description  || "",
        supplier:      initialMaterial.supplier     || "",
        active:        initialMaterial.active       ?? true,
    });

    const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    const isLoggedIn = !!user;
    const canDelete  = hasRole?.("ADMIN", "DIRECTOR");

    const handleSave = async () => {
        setLoading(true);
        setError("");
        try {
            const payload = { ...material, ...form };
            await materialService.update(material.id, payload);
            setMaterial(payload);
            setIsEditing(false);
            if (onUpdated) onUpdated(payload);
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra khi cập nhật");
        } finally { setLoading(false); }
    };

    const handleDelete = async () => {
        setLoading(true);
        setError("");
        try {
            await materialService.remove(material.id);
            if (onDeleted) onDeleted();
            onClose();
        } catch (e) {
            setError(e.response?.data?.message || "Xóa thất bại");
            setLoading(false);
        }
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box" onClick={(e) => e.stopPropagation()} style={{ width: "520px" }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title">
                            {isEditing ? "Chỉnh sửa vật tư" : "Chi tiết vật tư"}
                        </h3>
                        <span className="sq-modal-sub">{material.sku} · {material.materialName}</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="sq-modal-body">
                    {error && (
                        <div className="sp-state sp-state--error" style={{ padding: "12px", marginBottom: "20px", borderRadius: "12px", background: "#fef2f2" }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {isEditing ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div className="sq-f-group">
                                    <label className="sq-f-label">SKU *</label>
                                    <input className="sq-f-input" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Nhập mã SKU..." />
                                </div>
                                <div className="sq-f-group">
                                    <label className="sq-f-label">Tên vật tư *</label>
                                    <input className="sq-f-input" value={form.materialName} onChange={(e) => set("materialName", e.target.value)} placeholder="Tên nguyên liệu..." />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div className="sq-f-group">
                                    <label className="sq-f-label">Đơn vị</label>
                                    <input className="sq-f-input" value={form.unit || ""} onChange={(e) => set("unit", e.target.value)} placeholder="kg, cái, hộp..." />
                                </div>
                                <div className="sq-f-group">
                                    <label className="sq-f-label">Nhà cung cấp</label>
                                    <input className="sq-f-input" value={form.supplier || ""} onChange={(e) => set("supplier", e.target.value)} placeholder="Tên nhà cung cấp..." />
                                </div>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div className="sq-f-group">
                                    <label className="sq-f-label">Tồn kho hiện tại</label>
                                    <input className="sq-f-input" type="number" value={form.currentStock ?? 0} onChange={(e) => set("currentStock", Number(e.target.value))} />
                                </div>
                                <div className="sq-f-group">
                                    <label className="sq-f-label">Tồn tối thiểu</label>
                                    <input className="sq-f-input" type="number" value={form.minStockLevel ?? 0} onChange={(e) => set("minStockLevel", Number(e.target.value))} />
                                </div>
                            </div>

                            <div className="sq-f-group">
                                <label className="sq-f-label">Mô tả</label>
                                <textarea className="sq-f-input" value={form.description || ""} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Ghi chú thêm về vật tư này..." style={{ minHeight: "80px", resize: "vertical" }} />
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                                <div>
                                    <span className="sod-info-label">SKU</span>
                                    <div className="sq-quote-id" style={{ marginTop: "4px" }}>{material.sku}</div>
                                </div>
                                <div>
                                    <span className="sod-info-label">Tên vật tư</span>
                                    <div className="sod-info-value" style={{ marginTop: "4px", fontSize: "15px" }}>{material.materialName}</div>
                                </div>
                                <div>
                                    <span className="sod-info-label">Tồn kho hiện tại</span>
                                    <div className="sod-info-value" style={{ marginTop: "4px", color: material.currentStock <= material.minStockLevel ? "#ef4444" : "#16a34a", fontWeight: "700" }}>
                                        {material.currentStock ?? 0} {material.unit}
                                    </div>
                                </div>
                                <div>
                                    <span className="sod-info-label">Đơn vị tính</span>
                                    <div className="sod-info-value" style={{ marginTop: "4px" }}>{material.unit || "—"}</div>
                                </div>
                                <div>
                                    <span className="sod-info-label">Nhà cung cấp</span>
                                    <div className="sod-info-value" style={{ marginTop: "4px" }}>{material.supplier || "—"}</div>
                                </div>
                                <div>
                                    <span className="sod-info-label">Tồn tối thiểu</span>
                                    <div className="sod-info-value" style={{ marginTop: "4px" }}>{material.minStockLevel ?? 0} {material.unit}</div>
                                </div>
                            </div>
                            
                            <div>
                                <span className="sod-info-label">Mô tả chi tiết</span>
                                <div style={{ background: "#f9fafb", padding: "14px", borderRadius: "12px", border: "1.5px solid #f0f0f5", fontSize: "13.5px", marginTop: "8px", lineHeight: "1.5", color: "#4b5563" }}>
                                    {material.description || "Chưa có mô tả bổ sung cho vật tư này."}
                                </div>
                            </div>

                            {showDelete && !isEditing && (
                                <div style={{ padding: "16px", background: "#fef2f2", border: "1.5px solid #fee2e2", borderRadius: "12px", marginTop: "12px" }}>
                                    <p style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: "600", color: "#991b1b" }}>⚠️ Xác nhận xóa vật tư này khỏi hệ thống?</p>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button className="sq-modal-btn" style={{ background: "#ef4444", color: "#fff" }} onClick={handleDelete} disabled={loading}>
                                            {loading ? "Đang xử lý..." : "Đúng, xóa ngay"}
                                        </button>
                                        <button className="sq-modal-btn sq-modal-btn--cancel" onClick={() => setShowDelete(false)}>Quay lại</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="sq-modal-footer">
                    {isEditing ? (
                        <>
                            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={() => setIsEditing(false)}>Hủy bỏ</button>
                            <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={loading || !form.materialName || !form.sku}>
                                {loading ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </>
                    ) : (
                        <>
                            {canDelete && !showDelete && (
                                <button className="sq-modal-btn" style={{ color: "#ef4444", background: "transparent", marginRight: "auto", paddingLeft: "0", fontWeight: "600" }} onClick={() => setShowDelete(true)}>
                                    Xóa vật tư
                                </button>
                            )}
                            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                            {isLoggedIn && (
                                <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};