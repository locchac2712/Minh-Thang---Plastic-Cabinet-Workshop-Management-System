import { useState } from "react";
import "./ProductList.css";
import { useProducts } from "../hooks/useProducts";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = {
    DRAFT:       { text: "Bản nháp",  cls: "prod-status--draft" },
    ACTIVE:      { text: "Đang bán",  cls: "prod-status--active" },
    DEACTIVATED: { text: "Ngừng bán", cls: "prod-status--deactivated" },
};

const STATUS_OPTIONS = ["DRAFT", "ACTIVE", "DEACTIVATED"];

// ── Add Form Modal ─────────────────────────────────────────────
const AddForm = ({ onSave, onClose, loading }) => {
    const [form, setForm] = useState({
        name: "", sku: "", unit: "",
        sellingPrice: 0, description: "", status: "DRAFT",
    });
    const set = (f, v) => setForm((p) => ({ ...p, [f]: v }));

    return (
        <div className="prod-overlay" onClick={onClose}>
            <div className="prod-modal" onClick={(e) => e.stopPropagation()}>
                <div className="prod-modal__header">
                    <h3>Thêm thành phẩm mới</h3>
                    <button className="prod-modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="prod-modal__body">
                    <div className="prod-form-row">
                        <div className="prod-form-group">
                            <label>SKU *</label>
                            <input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="VD: PROD-001" />
                        </div>
                        <div className="prod-form-group">
                            <label>Tên sản phẩm *</label>
                            <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Tên thành phẩm" />
                        </div>
                    </div>
                    <div className="prod-form-row">
                        <div className="prod-form-group">
                            <label>Đơn vị tính *</label>
                            <input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="cái, bộ, chiếc..." />
                        </div>
                        <div className="prod-form-group">
                            <label>Giá bán</label>
                            <input type="number" value={form.sellingPrice} onChange={(e) => set("sellingPrice", Number(e.target.value))} />
                        </div>
                    </div>
                    <div className="prod-form-group">
                        <label>Mô tả</label>
                        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Mô tả sản phẩm..." />
                    </div>
                </div>
                <div className="prod-modal__footer">
                    <button className="btn btn--ghost" onClick={onClose}>Hủy</button>
                    <button className="btn btn--primary" onClick={() => onSave(form)}
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
    const { products, loading, error, refetch, create } = useProducts();
    const { user } = useAuth();
    const [search,     setSearch]     = useState("");
    const [showAdd,    setShowAdd]    = useState(false);
    const [addLoading, setAddLoading] = useState(false);
    const [toast,      setToast]      = useState(null);

    const canWrite = !!user;

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const filtered = products.filter((p) =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
    );

    const handleAdd = async (form) => {
        setAddLoading(true);
        try {
            await create(form);
            setShowAdd(false);
            showToast("Thêm mới thành công!");
        } catch (e) {
            showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
        } finally { setAddLoading(false); }
    };

    return (
        <div className="prod-page">
            {toast && <div className={`prod-toast prod-toast--${toast.type}`}>{toast.msg}</div>}

            <div className="prod-bar">
                <div className="prod-bar__left">
                    <div className="prod-search">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input placeholder="Tìm theo tên hoặc SKU..."
                               value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <span className="prod-count">{filtered.length} sản phẩm</span>
                </div>
                <div className="prod-bar__right">
                    <button className="btn btn--ghost" onClick={refetch} disabled={loading}>🔄 Làm mới</button>
                    {canWrite && <button className="btn btn--primary" onClick={() => setShowAdd(true)}>+ Thêm mới</button>}
                </div>
            </div>

            {loading && (
                <div className="prod-state">
                    <div className="prod-spinner"/>
                    <span>Đang tải dữ liệu...</span>
                </div>
            )}

            {error && !loading && (
                <div className="prod-state prod-state--error">
                    <span style={{ fontSize: 36 }}>⚠️</span>
                    <span style={{ fontWeight: 500 }}>{error}</span>
                    {error.includes("đăng nhập")
                        ? <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Vui lòng nhấn nút <strong>Login</strong> ở góc trên</span>
                        : <button className="btn btn--ghost" onClick={refetch}>🔄 Thử lại</button>}
                </div>
            )}

            {!loading && !error && (
                <div className="prod-table-wrap">
                    <table className="prod-table">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>SKU</th>
                            <th>Tên sản phẩm</th>
                            <th>Đơn vị tính</th>
                            <th>Trạng thái</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="prod-empty">Không có dữ liệu</td></tr>
                        ) : (
                            filtered.map((p, idx) => {
                                const s = STATUS_LABEL[p.status] || { text: p.status, cls: "" };
                                return (
                                    <tr key={p.id} className="prod-row--clickable" onClick={() => onSelectProduct(p)}>
                                        <td className="prod-td--idx">{idx + 1}</td>
                                        <td><span className="prod-code">{p.sku}</span></td>
                                        <td className="prod-td--name">{p.name}</td>
                                        <td>{p.unit || "—"}</td>
                                        <td><span className={`prod-status ${s.cls}`}>{s.text}</span></td>
                                        <td className="prod-td--arrow">›</td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            )}

            {showAdd && <AddForm onSave={handleAdd} onClose={() => setShowAdd(false)} loading={addLoading} />}
        </div>
    );
};