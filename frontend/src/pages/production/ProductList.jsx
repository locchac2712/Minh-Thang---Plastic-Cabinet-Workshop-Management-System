import { useState } from "react";
import "../sales/SalesPages.css";
import { useProducts } from "../../hooks/useProducts.js";
import { useAuth } from "../../context/AuthContext.jsx";

const fmt = (val) =>
    val != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : "—";

const STATUS_MAP = {
    DRAFT:       { text: "Bản nháp",  cls: "sq-badge--draft" },
    ACTIVE:      { text: "Đang bán",  cls: "sq-badge--accepted" },
    DEACTIVATED: { text: "Ngừng bán", cls: "sq-badge--rejected" },
};

// ── Add Form Modal (reusing BOM modal styles) ───────────────
const AddForm = ({ onSave, onClose, loading }) => {
    const [form, setForm] = useState({
        name: "", sku: "", unit: "",
        sellingPrice: 0, description: "", status: "DRAFT",
    });
    const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box" onClick={(e) => e.stopPropagation()} style={{ width: "580px" }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title">Thêm thành phẩm mới</h3>
                        <span className="sq-modal-sub">Nhập thông tin sản phẩm vào hệ thống</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="sq-modal-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="sq-f-group">
                                <label className="sq-f-label">SKU *</label>
                                <input className="sq-f-input" value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="VD: SP-001" />
                            </div>
                            <div className="sq-f-group">
                                <label className="sq-f-label">Tên sản phẩm *</label>
                                <input className="sq-f-input" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tên thành phẩm" />
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div className="sq-f-group">
                                <label className="sq-f-label">Đơn vị tính *</label>
                                <input className="sq-f-input" value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="cái, bộ, chiếc..." />
                            </div>
                            <div className="sq-f-group">
                                <label className="sq-f-label">Giá bán</label>
                                <input className="sq-f-input" type="number" value={form.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} />
                            </div>
                        </div>
                        <div className="sq-f-group">
                            <label className="sq-f-label">Mô tả</label>
                            <textarea className="sq-f-input" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Mô tả sản phẩm..." style={{ resize: "none" }} />
                        </div>
                    </div>
                </div>
                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Hủy bỏ</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => onSave(form)}
                            disabled={loading || !form.name || !form.sku || !form.unit}>
                        {loading ? "Đang lưu..." : "Thêm mới"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main List ──────────────────────────────────────────────────
export const ProductList = ({ onSelectProduct }) => {
    const { items, loading, error, refetch, create } = useProducts();
    const { user } = useAuth();
    const [search,     setSearch]     = useState("");
    const [showAdd,    setShowAdd]    = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [toast,      setToast]      = useState(null);

    const [page, setPage] = useState(0);
    const pageSize = 10;

    const canWrite = !!user;

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filtered = (items || []).filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(total / pageSize);

    const handleAdd = async (form) => {
        setAddLoading(true);
        try {
            await create(form);
            setShowAdd(false);
            showToast("Thêm mới thành phẩm thành công!");
        } catch (e) {
            showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally { setAddLoading(false); }
    };

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
                    <h1 className="sp-title">Danh mục Thành phẩm</h1>
                </div>
            </div>

            <div className="sq-toolbar">
                <div className="sq-toolbar__left">
                    <div className="sq-search-wrap">
                        <div className="sp-search">
                            <input placeholder="Tìm theo tên sản phẩm hoặc SKU..."
                                   value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
                        </div>
                    </div>
                </div>
                <div className="sq-toolbar__right">
                    <div className="sp-header-actions">
                        {canWrite && (
                            <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowAdd(true)}>
                                + Thêm mới
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Chỉ hiện spinner ở giữa màn hình nếu chưa có dữ liệu và đang load */}
            {(loading && (items || []).length === 0) && (
                <div className="sp-state">
                    <div className="sp-spinner"/>
                    <span>Đang thu thập dữ liệu sản phẩm...</span>
                </div>
            )}

            {/* Hiện lỗi nếu có và không có dữ liệu */}
            {error && (items || []).length === 0 && (
                <div className="sp-state sp-state--error">
                    <span style={{ fontWeight: 600 }}>{error}</span>
                </div>
            )}

            {/* Luôn hiện card nếu có dữ liệu hoặc khi đã load xong không lỗi */}
            {((items || []).length > 0 || (!loading && !error)) && (
                <div className={`sp-card ${loading ? "sp-card--loading" : ""}`}>
                    {loading && (items || []).length > 0 && (
                        <div className="sp-refresh-overlay">
                            <div className="sp-spinner-sm" />
                            <span>Đang cập nhật...</span>
                        </div>
                    )}
                    <table className="sp-table">
                        <thead className="sq-table-head">
                        <tr>
                            <th style={{ width: "60px" }}>STT</th>
                            <th>Mã SKU</th>
                            <th>Tên sản phẩm</th>
                            <th>Đơn vị</th>
                            <th style={{ textAlign: "right" }}>Giá bán</th>
                            <th style={{ textAlign: "right" }}>Tồn kho</th>
                            <th style={{ textAlign: "center" }}>Trạng thái</th>
                            <th style={{ textAlign: "center" }}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="sp-empty-row">
                                    <div className="sq-empty">
                                        <p>{search ? "Không tìm thấy sản phẩm phù hợp" : "Chưa có sản phẩm nào trong hệ thống"}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginated.map((p, idx) => {
                                const s = STATUS_MAP[p.status] || { text: p.status || "—", cls: "sq-badge--draft" };
                                return (
                                    <tr key={p.id} className="sp-table__row" style={{ cursor: "pointer" }} onClick={() => onSelectProduct(p)}>
                                        <td className="sp-td--muted">{(page * pageSize) + idx + 1}</td>
                                        <td><span className="sq-quote-id">{p.sku}</span></td>
                                        <td className="sp-td--name">{p.name}</td>
                                        <td>{p.unit || "—"}</td>
                                        <td style={{ textAlign: "right" }} className="sp-td--price">{fmt(p.sellingPrice)}</td>
                                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                                            {(p.currentStock ?? 0).toLocaleString("vi-VN")}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <span className={`sq-badge ${s.cls}`}>{s.text}</span>
                                        </td>
                                        <td>
                                            <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                                <button
                                                    className="sp-action-btn"
                                                    title="Xem chi tiết"
                                                    onClick={(e) => { e.stopPropagation(); onSelectProduct(p); }}
                                                >
                                                    Xem
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>

                    {total > 0 && (
                        <div className="sp-pagination">
                            <div className="sp-pagination__left">
                                Hiển thị <b>{(page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)}</b> trong tổng số <b>{total}</b> sản phẩm
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

            {showAdd && <AddForm onSave={handleAdd} onClose={() => setShowAdd(false)} loading={addLoading} />}
        </div>
    );
};