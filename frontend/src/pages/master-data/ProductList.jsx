import { useState } from "react";
import "../sales/SalesPages.css";
import { useProducts } from "../../hooks/useProducts";
import { useAuth } from "../../context/AuthContext";
import { ProductDetail } from "./ProductDetail";

export const ProductList = () => {
    const { products, loading, error, refetch } = useProducts();
    const { hasRole } = useAuth();
    const [search, setSearch] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    const filtered = products.filter((p) =>
        (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (p.sku || "").toLowerCase().includes(search.toLowerCase())
    );

    const total = filtered.length;
    const [page, setPage] = useState(0);
    const pageSize = 10;
    const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(total / pageSize);

    const formatPrice = (val) =>
        val != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : "—";

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Danh mục Thành phẩm</h1>
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
                                placeholder="Tìm theo tên sản phẩm hoặc SKU..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            />
                        </div>
                    </div>
                </div>
                <div className="sq-toolbar__right">
                    <div className="sp-header-actions">

                        <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setIsCreating(true)}>
                            Thêm sản phẩm
                            <span className="sp-btn-plus">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content States */}
            {loading && (
                <div className="sp-state">
                    <div className="sp-spinner" />
                    <span>Đang tải danh sách sản phẩm...</span>
                </div>
            )}

            {error && !loading && (
                <div className="sp-state sp-state--error">
                    <span style={{ fontSize: 32 }}>⚠️</span>
                    <span style={{ fontWeight: 600, marginTop: "8px" }}>{error}</span>

                </div>
            )}

            {/* Table */}
            {!loading && !error && (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead className="sq-table-head">
                            <tr>
                                <th style={{ width: "60px" }}>STT</th>
                                <th>Ảnh</th>
                                <th>Mã SKU</th>
                                <th>Tên sản phẩm</th>
                                <th>Giá bán</th>
                                <th>Tồn kho</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="sp-empty-row">
                                        <div className="sq-empty">
                                            <div className="sq-empty__icon">📦</div>
                                            <p>{search ? "Không tìm thấy sản phẩm nào" : "Chưa có dữ liệu thành phẩm"}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((p, idx) => (
                                    <tr
                                        key={p.id}
                                        className="sp-table__row"
                                        onClick={() => setSelectedProduct(p)}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <td className="sp-td--muted">{(page * pageSize) + idx + 1}</td>
                                        <td>
                                            <div style={{ width: "40px", height: "40px", borderRadius: "8px", overflow: "hidden", background: "#f3f4f6", border: "1.5px solid #f0f0f5" }}>
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt="p" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                ) : (
                                                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#9ca3af" }}>N/A</div>
                                                )}
                                            </div>
                                        </td>
                                        <td><span className="sq-quote-id">{p.sku}</span></td>
                                        <td className="sp-td--name">{p.name}</td>
                                        <td className="sp-td--price">{formatPrice(p.sellingPrice)}</td>
                                        <td style={{ fontWeight: "600" }}>{p.currentStock ?? 0} {p.unit}</td>
                                        <td>
                                            <span className={`sq-badge ${p.status === "ACTIVE" ? "sq-badge--confirmed" : p.status === "DRAFT" ? "sq-badge--draft" : "sq-badge--rejected"}`}>
                                                {p.status === "ACTIVE" ? "Đang bán" : p.status === "DRAFT" ? "Bản nháp" : "Ngừng bán"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                                <button 
                                                    className="sp-action-btn" 
                                                    title="Xem chi tiết"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
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

            {/* Modals */}
            {selectedProduct && (
                <ProductDetail
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onUpdated={() => refetch()}
                />
            )}

            {isCreating && (
                <ProductDetail
                    product={{ sku: "", name: "", unit: "", sellingPrice: 0, status: "DRAFT", currentStock: 0 }}
                    onClose={() => setIsCreating(false)}
                    onUpdated={() => { setIsCreating(false); refetch(); }}
                />
            )}
        </div>
    );
};