import { useState } from "react";
import "../sales/SalesPages.css";
import { useMaterials } from "../../hooks/useMaterials.js";
import { useAuth } from "../../context/AuthContext.jsx";

const fmt = (val) =>
    val != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : "—";

export const ControlMaterial = ({ onSelectMaterial }) => {
    const { materials, loading, error, refetch } = useMaterials();
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const pageSize = 10;

    const filtered = materials.filter((m) =>
        m.materialName?.toLowerCase().includes(search.toLowerCase()) ||
        m.sku?.toLowerCase().includes(search.toLowerCase()) ||
        m.name?.toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="sp-page">
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
                        <button className="sp-btn-primary sp-btn-primary--pill" onClick={refetch} disabled={loading}>
                            Làm mới
                        </button>
                    </div>
                </div>
            </div>

            {loading && <div className="sp-state"><div className="sp-spinner"/><span>Đang thu thập dữ liệu vật tư...</span></div>}

            {error && !loading && (
                <div className="sp-state sp-state--error">
                    <span style={{ fontWeight: 600 }}>{error}</span>
                </div>
            )}

            {!loading && !error && (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead className="sq-table-head">
                        <tr>
                            <th style={{ width: "60px" }}>STT</th>
                            <th>Mã SKU</th>
                            <th>Tên vật tư</th>
                            <th>Đơn vị</th>
                            <th style={{ textAlign: "right" }}>Tồn kho</th>
                            <th style={{ textAlign: "right" }}>Giá vốn TB</th>
                            <th style={{ textAlign: "center" }}>Trạng thái</th>
                            <th style={{ textAlign: "center" }}>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginated.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="sp-empty-row">
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
                                    <td style={{ textAlign: "right" }}>
                                        <span style={{
                                            fontWeight: 700,
                                            color: (m.currentStock ?? 0) <= (m.minStockLevel ?? 0) ? "#dc2626" : "#059669"
                                        }}>
                                            {(m.currentStock ?? 0).toLocaleString("vi-VN")}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: "right" }} className="sp-td--price">
                                        {m.averageUnitCost ? fmt(m.averageUnitCost) : "—"}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        <span className={`sq-badge ${m.isActive !== false ? "sq-badge--accepted" : "sq-badge--rejected"}`}>
                                            {m.isActive !== false ? "Đang dùng" : "Ngừng"}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                            <button
                                                className="sp-action-btn"
                                                title="Xem chi tiết"
                                                onClick={(e) => { e.stopPropagation(); onSelectMaterial(m); }}
                                            >
                                                Xem
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
        </div>
    );
};