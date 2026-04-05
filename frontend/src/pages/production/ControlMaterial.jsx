import { useState } from "react";
import "../sales/SalesPages.css";
import { useMaterials } from "../../hooks/useMaterials.js";
import { useAuth } from "../../context/AuthContext.jsx";

const fmt = (val) =>
    val != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : "—";

// ── Dropdown with "Add New" ─────────────────────────────────
const DropdownWithAdd = ({ label, required, options, value, onChange, placeholder }) => {
    const [showAdd, setShowAdd] = useState(false);
    const [newVal, setNewVal] = useState("");

    const handleAdd = () => {
        if (newVal.trim()) {
            onChange(newVal.trim());
            setShowAdd(false);
            setNewVal("");
        }
    };

    return (
        <div className="sq-f-group">
            <label className="sq-f-label">{label}{required && " *"}</label>
            {!showAdd ? (
                <div style={{ position: "relative" }}>
                    <select
                        className="sq-f-input"
                        value={options.includes(value) ? value : (value ? "__custom__" : "")}
                        onChange={(e) => {
                            if (e.target.value === "__add_new__") {
                                setShowAdd(true);
                            } else if (e.target.value === "__custom__") {
                                // do nothing
                            } else {
                                onChange(e.target.value);
                            }
                        }}
                    >
                        <option value="">{placeholder || "-- Chọn --"}</option>
                        {options.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                        {value && !options.includes(value) && (
                            <option value="__custom__">{value}</option>
                        )}
                        <option value="__add_new__">+ Thêm mới...</option>
                    </select>
                </div>
            ) : (
                <div style={{ display: "flex", gap: "8px" }}>
                    <input
                        className="sq-f-input"
                        value={newVal}
                        onChange={(e) => setNewVal(e.target.value)}
                        placeholder="Nhập giá trị mới..."
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                        style={{ flex: 1 }}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newVal.trim()}
                        style={{
                            padding: "0 14px", borderRadius: "10px", border: "none",
                            background: "#7c3aed", color: "#fff", fontWeight: 600,
                            fontSize: "13px", cursor: "pointer", whiteSpace: "nowrap"
                        }}
                    >
                        Thêm
                    </button>
                    <button
                        onClick={() => { setShowAdd(false); setNewVal(""); }}
                        style={{
                            padding: "0 12px", borderRadius: "10px", border: "1.5px solid #e5e7eb",
                            background: "#fff", color: "#6b7280", fontWeight: 600,
                            fontSize: "13px", cursor: "pointer"
                        }}
                    >
                        Hủy
                    </button>
                </div>
            )}
        </div>
    );
};

// Auto-generate SKU
const generateSku = () => {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `VT-${rand}`;
};

// ── Create Material Modal ───────────────────────────────────
const DEFAULT_UNITS = ["Cái", "Kg", "Tấn"];
const DEFAULT_TYPES = ["Nhựa tấm", "Phụ kiện", "Ốc vít"];

const CreateMaterialModal = ({ onSave, onClose, saving }) => {
    const [unitOptions, setUnitOptions] = useState(DEFAULT_UNITS);
    const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPES);
    const [form, setForm] = useState({
        name: "", unit: "", materialType: "", standardSize: "", description: "",
    });
    const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    const valid = form.name.trim() && form.unit.trim();

    const handleUnitChange = (val) => {
        set("unit", val);
        if (!unitOptions.includes(val)) setUnitOptions((prev) => [...prev, val]);
    };

    const handleTypeChange = (val) => {
        set("materialType", val);
        if (!typeOptions.includes(val)) setTypeOptions((prev) => [...prev, val]);
    };

    const handleSave = () => {
        onSave({ ...form, sku: generateSku() });
    };

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box" onClick={(e) => e.stopPropagation()} style={{ width: "620px" }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title">Tạo vật tư mới</h3>
                        <span className="sq-modal-sub">Thêm vật tư / nguyên liệu vào hệ thống kho</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="sq-modal-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Tên vật tư */}
                        <div className="sq-f-group">
                            <label className="sq-f-label">Tên vật tư *</label>
                            <input className="sq-f-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tên vật tư / nguyên liệu" />
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            {/* Đơn vị tính - dropdown + add new */}
                            <DropdownWithAdd
                                label="Đơn vị tính"
                                required
                                options={unitOptions}
                                value={form.unit}
                                onChange={handleUnitChange}
                                placeholder="-- Chọn đơn vị --"
                            />
                            {/* Loại NVL - dropdown + add new */}
                            <DropdownWithAdd
                                label="Loại NVL"
                                options={typeOptions}
                                value={form.materialType}
                                onChange={handleTypeChange}
                                placeholder="-- Chọn loại --"
                            />
                        </div>

                        {/* Kích thước chuẩn */}
                        <div className="sq-f-group">
                            <label className="sq-f-label">Kích thước chuẩn</label>
                            <input className="sq-f-input" value={form.standardSize} onChange={(e) => set("standardSize", e.target.value)} placeholder="VD: 100x50x30 mm, Ø25mm, ..." />
                        </div>

                        {/* Mô tả */}
                        <div className="sq-f-group">
                            <label className="sq-f-label">Mô tả</label>
                            <textarea className="sq-f-input" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Mô tả chi tiết vật tư..." style={{ resize: "none" }} />
                        </div>
                    </div>
                </div>
                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Hủy bỏ</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={saving || !valid}>
                        {saving ? "Đang lưu..." : "Tạo vật tư"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main List ───────────────────────────────────────────────
export const ControlMaterial = ({ onSelectMaterial }) => {
    const { materials, loading, error, refetch, create } = useMaterials();
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const pageSize = 10;

    const [showCreate, setShowCreate] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreate = async (form) => {
        setSaving(true);
        try {
            await create(form);
            setShowCreate(false);
            showToast("Tạo vật tư mới thành công!");
        } catch (e) {
            showToast(e.response?.data?.message || "Có lỗi xảy ra khi tạo vật tư", "error");
        } finally { setSaving(false); }
    };

    const filtered = (materials || []).filter((m) =>
        m.materialName?.toLowerCase().includes(search.toLowerCase()) ||
        m.sku?.toLowerCase().includes(search.toLowerCase()) ||
        m.name?.toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="sp-page">
            {/* Toast */}
            {toast && (
                <div className={`cf-toast cf-toast--${toast.type === "error" ? "error" : "success"}`}>
                    <span>{toast.msg}</span>
                    <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, marginLeft: "10px" }}>✕</button>
                </div>
            )}

            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Vật tư & Nguyên liệu</h1>
                </div>
            </div>

            <div className="sq-toolbar">
                <div className="sq-toolbar__left">
                    <div className="sq-search-wrap">
                        <div className="sp-search">
                            <input placeholder="Tìm theo tên hoặc SKU..."
                                   value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
                        </div>
                    </div>
                </div>
                <div className="sq-toolbar__right">
                    <div className="sp-header-actions">
                        {user && (
                            <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)}>
                                + Tạo vật tư
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Trạng thái Loading ban đầu */}
            {(loading && materials.length === 0) && (
                <div className="sp-state">
                    <div className="sp-spinner" />
                    <span>Đang tải dữ liệu vật tư...</span>
                </div>
            )}

            {/* Trạng thái Lỗi */}
            {error && materials.length === 0 && (
                <div className="sp-state sp-state--error">
                    <span style={{ fontWeight: 600 }}>{error}</span>
                </div>
            )}

            {/* Bảng dữ liệu */}
            {(materials.length > 0 || (!loading && !error)) && (
                <div className={`sp-card ${loading ? "sp-card--loading" : ""}`}>
                    {loading && materials.length > 0 && (
                        <div className="sp-refresh-overlay">
                            <div className="sp-spinner-sm" />
                            <span>Đang làm mới...</span>
                        </div>
                    )}
                    <table className="sp-table">
                        <thead className="sq-table-head">
                        <tr>
                            <th style={{ width: "60px" }}>STT</th>
                            <th>Mã SKU</th>
                            <th>Tên vật tư</th>
                            <th>Đơn vị</th>
                            <th>Loại NVL</th>
                            <th>Kích thước chuẩn</th>
                            <th style={{ textAlign: "center" }}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="sp-empty-row">
                                    <div className="sq-empty">
                                        <p>{search ? "Không tìm thấy vật tư phù hợp" : "Chưa có vật tư nào trong hệ thống"}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginated.map((m, idx) => (
                                <tr key={m.id} className="sp-table__row" style={{ cursor: "pointer" }} onClick={() => onSelectMaterial(m)}>
                                    <td className="sp-td--muted">{(page * pageSize) + idx + 1}</td>
                                    <td><span className="sq-quote-id">{m.sku}</span></td>
                                    <td className="sp-td--name">{m.materialName || m.name}</td>
                                    <td>{m.unit || "—"}</td>
                                    <td>{m.materialType || "—"}</td>
                                    <td>{m.standardSize || "—"}</td>
                                    <td>
                                        <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                            <button
                                                className="sp-action-btn"
                                                title="Xem chi tiết"
                                                onClick={(e) => { e.stopPropagation(); onSelectMaterial(m); }}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>

                    {total > 0 && (
                        <div className="sp-pagination">
                            <div className="sp-pagination__left">
                                Hiển thị <b>{(page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)}</b> trong tổng số <b>{total}</b> vật tư
                            </div>
                            <div className="sp-pagination__right">
                                <button className="sp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>&lt;</button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`sp-page-btn${page === i ? " sp-page-btn--active" : ""}`}
                                        onClick={() => setPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button className="sp-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>&gt;</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showCreate && (
                <CreateMaterialModal
                    onSave={handleCreate}
                    onClose={() => setShowCreate(false)}
                    saving={saving}
                />
            )}
        </div>
    );
};