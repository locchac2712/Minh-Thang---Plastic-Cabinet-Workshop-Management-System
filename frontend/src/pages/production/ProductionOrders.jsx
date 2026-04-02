import { useState } from "react";
import "../sales/SalesPages.css";
import { SalesOrderDetail } from "../sales/SalesOrderDetail.jsx";
import { useAuth } from "../../context/AuthContext";
import { useSalesOrders } from "../../hooks/useSalesOrders";
import { ORDER_STATUS_MAP } from "../../services/salesOrderService.js";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

// Specialized Status Map for Production Orders (Confirmed+)
const PROD_STATUS_MAP = {
    ...ORDER_STATUS_MAP,
    CONFIRMED:   { text: "Đã xác nhận",       cls: "so-badge--confirmed" },
    PLANNING:    { text: "Đang lập kế hoạch", cls: "so-badge--planning"  },
    IN_PROGRESS: { text: "Đang sản xuất",     cls: "so-badge--producing" },
    PROCESSING:  { text: "Đang sản xuất",     cls: "so-badge--producing" },
    COMPLETED:   { text: "Đã hoàn tất",       cls: "so-badge--ready"     },
};

export const ProductionOrders = () => {
    const { user } = useAuth();
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("CONFIRMED"); // Default: Confirmed
    const [page, setPage] = useState(0);
    const [viewId, setViewId] = useState(null);
    const [planOrder, setPlanOrder] = useState(null);

    // Lấy dữ liệu với trạng thái được lọc
    const { data, loading, error, refetch } = useSalesOrders({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        page, size: 10,
    });

    const orders = data?.content ?? [];
    const total = data?.totalElements ?? 0;

    if (viewId) return (
        <SalesOrderDetail
            orderId={viewId}
            onBack={() => setViewId(null)}
            isSalesStaff={false}
        />
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Đơn hàng</h1>
                </div>
            </div>

            <div className="sq-toolbar">
                <div className="sq-toolbar__left">
                    <div className="sq-search-wrap">
                        <div className="sp-search">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                                placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                                value={keyword}
                                onChange={e => { setKeyword(e.target.value); setPage(0); }}
                            />
                        </div>
                    </div>

                    <div className="sq-filter-group" style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                        <select 
                            className="sq-select" 
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', outline: 'none', background: 'white', fontSize: '13px', fontWeight: '500' }}
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="PLANNING">Đang lập kế hoạch</option>
                            <option value="IN_PROGRESS">Đang sản xuất</option>
                            <option value="COMPLETED">Đã hoàn thành</option>
                        </select>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="sp-state">
                    <div className="sp-spinner" />
                    <span>Đang tải danh sách đơn hàng...</span>
                </div>
            )}

            {error && !loading && (
                <div className="sp-state sp-state--error">
                    <span style={{ fontSize: 32 }}>⚠️</span>
                    <span style={{ fontWeight: 600, marginTop: "8px" }}>{error}</span>
                </div>
            )}

            {!loading && !error && (
                <div className="sp-card">
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>Danh sách đơn hàng</h3>
                        <span className="sp-td--muted" style={{ fontSize: '12px' }}>Tổng số: {total}</span>
                    </div>
                    <table className="sp-table">
                        <thead className="sq-table-head">
                            <tr>
                                <th style={{ width: "60px" }}>STT</th>
                                <th>Mã đơn hàng</th>
                                <th>Khách hàng</th>
                                <th>Ngày đặt hàng</th>
                                <th>Trạng thái</th>
                                <th>Tổng giá trị</th>
                                <th style={{ textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="sp-empty-row">
                                        <div className="sq-empty">
                                            <div className="sq-empty__icon">📦</div>
                                            <p>{keyword ? "Không tìm thấy đơn hàng phù hợp" : "Hiện không có đơn hàng nào trong trạng thái này"}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o, idx) => {
                                    const s = PROD_STATUS_MAP[o.status] || { text: o.status, cls: "so-badge--pending" };
                                    return (
                                        <tr key={o.id} className="sp-table__row" style={{ cursor: "pointer" }} onClick={() => setViewId(o.id)}>
                                            <td className="sp-td--muted">{(page * 10) + idx + 1}</td>
                                            <td><span className="so-order-id">{o.orderNumber}</span></td>
                                            <td className="sp-td--name">{o.customerName}</td>
                                            <td className="sp-td--muted">{fmtDate(o.createdDate)}</td>
                                            <td><span className={`so-badge ${s.cls}`}>{s.text}</span></td>
                                            <td className="sp-td--price">{fmt(o.totalAmount)}</td>
                                            <td>
                                                <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                                    <button
                                                        className="sp-action-btn"
                                                        title="Xem chi tiết"
                                                        onClick={(e) => { e.stopPropagation(); setViewId(o.id); }}
                                                    >
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                        </svg>
                                                    </button>
                                                    {o.status === "CONFIRMED" && (
                                                        <button
                                                            className="sp-action-btn"
                                                            title="Lập kế hoạch"
                                                            style={{ color: "#7c3aed" }}
                                                            onClick={(e) => { e.stopPropagation(); setPlanOrder(o); }}
                                                        >
                                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {total > 0 && (
                        <div className="sp-pagination">
                            <div className="sp-pagination__left">
                                Hiển thị <b>{(page * 10) + 1} - {Math.min((page + 1) * 10, total)}</b> trong tổng số <b>{total}</b> đơn hàng
                            </div>
                            <div className="sp-pagination__right">
                                <button className="sp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>&lt;</button>
                                {[...Array(data.totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        className={`sp-page-btn${page === i ? " sp-page-btn--active" : ""}`}
                                        onClick={() => setPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button className="sp-page-btn" disabled={page >= data.totalPages - 1} onClick={() => setPage(page + 1)}>&gt;</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {planOrder && (
                <PlanModal
                    order={planOrder}
                    onClose={() => setPlanOrder(null)}
                    onSuccess={() => { setPlanOrder(null); refetch(); }}
                />
            )}
            
            <style>{`
                .so-badge--confirmed {
                    background: #f0fdf4;
                    color: #15803d;
                    border: 1.5px solid #bbf7d0;
                }
            `}</style>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   MODAL LẬP KẾ HOẠCH
───────────────────────────────────────────────────────────── */
import api from "../../services/api";

const PlanModal = ({ order, onClose, onSuccess }) => {
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate]     = useState("");
    const [startShift, setStartShift] = useState("S"); // S, C
    const [endShift, setEndShift]     = useState("C"); // S, C
    const [loading, setLoading]     = useState(false);

    const isWeekend = (dateStr) => {
        if (!dateStr) return false;
        const day = new Date(dateStr).getDay();
        return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    };

    const handleCreate = async () => {
        if (!endDate) return alert("Vui lòng chọn ngày kết thúc dự kiến!");
        if (isWeekend(startDate) || isWeekend(endDate)) {
            return alert("Không thể lập kế hoạch vào Thứ 7 hoặc Chủ nhật!");
        }
        setLoading(true);
        try {
            await api.post(`/production-plans/generate?salesOrderId=${order.id}`, {
                startDate,
                endDate,
                startShift,
                endShift
            });
            alert("Đã tạo kế hoạch sản xuất thành công!");
            onSuccess();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể lập kế hoạch"));
        } finally {
            setLoading(false);
        }
    };

    // Helper for beautiful date display
    const DateField = ({ label, value, onChange, error }) => (
        <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 8 }}>{label}</label>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input.showPicker) input.showPicker(); else input.focus();
            }}>
                <div style={{ 
                    display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", 
                    border: error ? "2px solid #ef4444" : "1.5px solid #e2e8f0", 
                    borderRadius: "10px", background: "#f8fafc", transition: "all 0.2s" 
                }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span style={{ fontSize: "14px", color: value ? "#0f172a" : "#94a3b8", fontWeight: "600" }}>
                        {value ? new Date(value).toLocaleDateString("vi-VN") : "Chọn ngày tháng năm"}
                    </span>
                </div>
                <input
                    type="date"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                        position: "absolute", opacity: 0, inset: 0, width: "100%", height: "100%", pointerEvents: "none"
                    }}
                />
            </div>
            {error && <span style={{fontSize: 11, color: '#ef4444', marginTop: 4, display: 'block', fontWeight: 600}}>{error}</span>}
        </div>
    );

    return (
        <div className="sq-modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(4px)', background: 'rgba(15, 23, 42, 0.4)' }}>
            <div className="sq-modal-box" onClick={e => e.stopPropagation()} style={{ width: 450, borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                <div className="sq-modal-header" style={{ padding: '24px 24px 16px', border: 'none' }}>
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title" style={{ fontSize: 20, fontWeight: 800 }}>Lập kế hoạch sản xuất</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 6 }}>
                             <span className="so-order-id" style={{ background: '#f1f5f9', color: '#475569', fontSize: 11, padding: '2px 8px', borderRadius: 6 }}>{order.orderNumber}</span>
                             <span style={{ color: '#94a3b8', fontSize: 13 }}>•</span>
                             <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>{order.customerName}</span>
                        </div>
                    </div>
                </div>
                <div className="sq-modal-body" style={{ padding: "8px 24px 24px" }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <DateField 
                            label="Ngày bắt đầu" 
                            value={startDate} 
                            onChange={setStartDate} 
                            error={isWeekend(startDate) ? "Không thể làm việc cuối tuần" : null}
                        />
                        <DateField 
                            label="Ngày kết thúc dự kiến" 
                            value={endDate} 
                            onChange={setEndDate} 
                            error={isWeekend(endDate) ? "Không thể kết thúc vào cuối tuần" : null}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: 20 }}>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Ca bắt đầu</label>
                            <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                    onClick={() => setStartShift("S")}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
                                        border: startShift === "S" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                                        background: startShift === "S" ? "#f5f3ff" : "white",
                                        color: startShift === "S" ? "#7c3aed" : "#64748b"
                                    }}
                                >☀️ Sáng</button>
                                <button
                                    onClick={() => setStartShift("C")}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
                                        border: startShift === "C" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                                        background: startShift === "C" ? "#f5f3ff" : "white",
                                        color: startShift === "C" ? "#7c3aed" : "#64748b"
                                    }}
                                >⛅ Chiều</button>
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#334155", marginBottom: 10 }}>Ca kết thúc</label>
                            <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                    onClick={() => setEndShift("S")}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
                                        border: endShift === "S" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                                        background: endShift === "S" ? "#f5f3ff" : "white",
                                        color: endShift === "S" ? "#7c3aed" : "#64748b"
                                    }}
                                >☀️ Sáng</button>
                                <button
                                    onClick={() => setEndShift("C")}
                                    style={{
                                        flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s",
                                        border: endShift === "C" ? "2px solid #7c3aed" : "1.5px solid #e2e8f0",
                                        background: endShift === "C" ? "#f5f3ff" : "white",
                                        color: endShift === "C" ? "#7c3aed" : "#64748b"
                                    }}
                                >⛅ Chiều</button>
                            </div>
                        </div>
                    </div>
                    <div style={{ background: "#f1f5f9", padding: "14px 16px", borderRadius: 12, fontSize: 12, color: "#475569", lineHeight: 1.6, display: 'flex', gap: '10px' }}>
                        <span style={{ fontSize: 16 }}>💡</span>
                        <span>Hệ thống sẽ tự động tạo các <b>Lệnh sản xuất</b> cho đơn hàng sau khi xác nhận.</span>
                    </div>
                </div>
                <div className="sq-modal-footer" style={{ border: 'none', padding: '0 24px 24px' }}>
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose} style={{ flex: 1, height: 48, borderRadius: 12 }}>Hủy</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleCreate} disabled={loading} style={{ flex: 2, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none' }}>
                        {loading ? "Đang tạo..." : "Xác nhận lập kế hoạch"}
                    </button>
                </div>
            </div>
        </div>
    );
};
