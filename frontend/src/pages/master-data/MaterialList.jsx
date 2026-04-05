import { useState } from "react";
import "../sales/SalesPages.css";
import { useMaterials } from "../../hooks/useMaterials";
import { useAuth } from "../../context/AuthContext";
import { MaterialDetail } from "./MaterialDetail";

export const MaterialList = () => {
    const { materials, loading, error, refetch } = useMaterials();
    const { hasRole } = useAuth();
    const [search, setSearch] = useState("");
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const filtered = (materials || []).filter((m) =>
        (m.materialName || "").toLowerCase().includes(search.toLowerCase()) ||
        (m.sku || "").toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Vật tư & Nguyên liệu</h1>
                </div>
            </div>

            {/* Toolbar */}
            <div className="sq-toolbar">
                <div className="sq-toolbar__left">
                    <div className="sq-search-wrap">
                        <div className="sp-search">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                placeholder="Tìm theo tên hoặc SKU..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            />
                        </div>
                    </div>
                </div>
                <div className="sq-toolbar__right">
                    <div className="sp-header-actions">

                        <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setIsCreating(true)}>
                            Thêm vật tư
                            <span className="sp-btn-plus">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </span>
                        </button>
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
                    <span style={{ fontSize: 32 }}>⚠️</span>
                    <span style={{ fontWeight: 600, marginTop: "8px" }}>{error}</span>
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
                                <th>Tồn kho</th>
                                <th>Nhà cung cấp</th>
                                <th style={{ textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="sp-empty-row">
                                        <div className="sq-empty">
                                            <div className="sq-empty__icon">📦</div>
                                            <p>{search ? "Không tìm thấy vật tư phù hợp" : "Chưa có dữ liệu vật tư"}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((m, idx) => (
                                    <tr
                                        key={m.id}
                                        className="sp-table__row"
                                        onClick={() => setSelectedMaterial(m)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td className="sp-td--muted">{(page * pageSize) + idx + 1}</td>
                                        <td><span className="sq-quote-id">{m.sku}</span></td>
                                        <td className="sp-td--name">{m.materialName}</td>
                                        <td style={{ fontWeight: "700", color: m.currentStock <= (m.minStockLevel || 0) ? "#ef4444" : "#111827" }}>
                                            {m.currentStock ?? 0} {m.unit}
                                        </td>
                                        <td className="sp-td--muted">{m.supplier || "—"}</td>
                                        <td>
                                            <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                                <button 
                                                    className="sp-action-btn" 
                                                    title="Xem chi tiết"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedMaterial(m); }}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

                    {/* Pagination */}
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

            {/* Detail Modal */}
            {selectedMaterial && (
                <MaterialDetail
                    material={selectedMaterial}
                    onClose={() => setSelectedMaterial(null)}
                    onDeleted={() => {
                        setSelectedMaterial(null);
                        refetch();
                    }}
                    onUpdated={() => refetch()}
                />
            )}

            {/* Create Modal - Here we use a fake initial material for creation */}
            {isCreating && (
                <MaterialDetail
                    material={{ SKU: "", materialName: "", currentStock: 0, minStockLevel: 0, unit: "" }}
                    onClose={() => setIsCreating(false)}
                    onUpdated={() => { setIsCreating(false); refetch(); }}
                />
            )}
        </div>
    );
};