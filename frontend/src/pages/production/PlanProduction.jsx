import { useState, useEffect, useCallback } from "react";
import "../sales/SalesPages.css";
import api from "../../services/api";
import manufactureOrderService from "../../services/manufactureOrderService.js";

// ── Constants ─────────────────────────────────────────────
const PRIORITY = {
    LOW:    {text: "Thấp",     cls: "sq-badge--draft"},
    MEDIUM: {text: "Trung bình", cls: "sq-badge--sent"},
    HIGH:   {text: "Cao",      cls: "sq-badge--confirmed"},
    URGENT: {text: "Ưu tiên",  cls: "sq-badge--rejected"},
};

const STATUS = {
    CONFIRMED:   {text: "Đã xác nhận", cls: "so-badge--confirmed"},
    IN_PROGRESS: {text: "Đang sản xuất", cls: "so-badge--producing"},
    COMPLETED:   {text: "Hoàn tất",      cls: "so-badge--ready"},
    CANCELLED:   {text: "Đã hủy",        cls: "so-badge--cancelled"},
};

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
};

const getDaysRemaining = (d) => {
    if (!d) return null;
    const diff = new Date(d) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const getPriorityKey = (level) => {
    if (level === 1) return "HIGH";
    if (level === 2) return "MEDIUM";
    if (level === 3) return "LOW";
    return "MEDIUM";
};

// ── Hook ──────────────────────────────────────────────────
const useProductionQueue = (keyword, page) => {
    const [orders,        setOrders]        = useState([]);
    const [totalPages,    setTotalPages]    = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading,       setLoading]       = useState(false);
    const [error,         setError]         = useState(null);

    const fetchQueue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({page, size: PAGE_SIZE});
            if (keyword) params.set("keyword", keyword);

            const res = await api.get(`/sales-orders/production-queue?${params}`);
            const pageData = res.data?.data;
            setOrders(pageData?.content ?? []);
            setTotalPages(pageData?.totalPages ?? 0);
            setTotalElements(pageData?.totalElements ?? 0);
        } catch (err) {
            setError(err.response?.data?.message || err.message || "Có lỗi khi tải danh sách");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [keyword, page]);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    return {orders, totalPages, totalElements, loading, error, refetch: fetchQueue};
};

// ── Detail Modal ──────────────────────────────────────────
const WorkOrderDetailModal = ({ order, onClose, onSchedule }) => {
    const priorityKey = getPriorityKey(order.priorityLevel);
    const p           = PRIORITY[priorityKey] || {text: String(order.priorityLevel), cls: "sq-badge--draft"};
    const s           = STATUS[order.status]  || {text: order.status, cls: "so-badge--pending"};
    const totalUnits  = order.details?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ?? 0;
    const daysLeft    = getDaysRemaining(order.dueDate);

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={(e) => e.stopPropagation()} style={{ width: "850px" }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h3 className="sq-modal-title">Chi tiết Lệnh sản xuất</h3>
                        <span className="sq-modal-sub">{order.orderNumber} · {order.customer?.name || "Khách lẻ"}</span>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                
                <div className="sq-modal-body" style={{ background: "#f9fafb" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
                        {/* ── Left ── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <div className="sod-card" style={{ padding: "20px", border: "1.5px solid #f0f0f5", borderRadius: "16px" }}>
                                <div className="sod-card__title" style={{ marginBottom: "16px" }}>Thông tin tiến độ</div>
                                <div className="sod-info-grid">
                                    <div className="sod-info-row">
                                        <span className="sod-info-label">Mã đơn hàng</span>
                                        <span className="so-order-id" style={{ width: "fit-content", marginTop: "4px" }}>{order.orderNumber}</span>
                                    </div>
                                    <div className="sod-info-row">
                                        <span className="sod-info-label">Hạn giao (Deadline)</span>
                                        <span className="sod-info-value" style={{ color: "#ef4444", fontWeight: "700", marginTop: "4px" }}>
                                            {fmtDate(order.dueDate)}
                                            {daysLeft !== null && (
                                                <span style={{ fontSize: "11px", marginLeft: "6px", fontWeight: "600", padding: "2px 6px", background: "#fef2f2", borderRadius: "20px" }}>
                                                    ({daysLeft < 0 ? `Trễ ${Math.abs(daysLeft)} ngày` : `Còn ${daysLeft} ngày`})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="sod-info-row">
                                        <span className="sod-info-label">Trạng thái hiện tại</span>
                                        <div style={{ marginTop: "4px" }}><span className={`so-badge ${s.cls}`}>{s.text}</span></div>
                                    </div>
                                    <div className="sod-info-row">
                                        <span className="sod-info-label">Mức độ ưu tiên</span>
                                        <div style={{ marginTop: "4px" }}><span className={`sq-badge ${p.cls}`}>{p.text}</span></div>
                                    </div>
                                </div>
                            </div>

                            <div className="sod-card" style={{ padding: "0", border: "1.5px solid #f0f0f5", borderRadius: "16px", overflow: "hidden" }}>
                                <div style={{ padding: "16px 20px", fontWeight: "700", fontSize: "14px", borderBottom: "1.5px solid #f9fafb" }}>Sản phẩm cần sản xuất</div>
                                <table className="sp-table" style={{ margin: 0 }}>
                                    <thead className="sq-table-head">
                                        <tr>
                                            <th style={{ width: "50px" }}>#</th>
                                            <th>Tên gọi sản phẩm</th>
                                            <th style={{ textAlign: "center" }}>Số lượng</th>
                                            <th style={{ textAlign: "center" }}>Lập lịch</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.details?.map((d, i) => (
                                            <tr key={i} className="sp-table__row">
                                                <td className="sp-td--muted">{(i + 1).toString().padStart(2, '0')}</td>
                                                <td><span className="sp-td--name">{d.productName}</span></td>
                                                <td style={{ textAlign: "center", fontWeight: "700" }}>{d.quantity}</td>
                                                <td style={{ textAlign: "center" }}>
                                                    <button 
                                                        className="sp-action-btn" 
                                                        onClick={() => onSchedule(d)}
                                                        title="Lập lịch sản xuất thủ công"
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Right ── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            {order.customer && (
                                <div className="sod-card" style={{ padding: "18px", border: "1.5px solid #f0f0f5", borderRadius: "16px" }}>
                                    <div className="sod-card__title" style={{ fontSize: "11px" }}>Thông tin khách hàng</div>
                                    <div style={{ marginTop: "12px" }}>
                                        <div className="sod-td--name" style={{ fontSize: "15px", marginBottom: "8px" }}>{order.customer.name}</div>
                                        <div style={{ fontSize: "13px", color: "#6b7280", display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                            {order.customer.phone || "—"}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#9ca3af", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {order.customer.address || "—"}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="sod-card" style={{ padding: "18px", border: "1.5px solid #f0f0f5", borderRadius: "16px", background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "white" }}>
                                <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", opacity: 0.8, marginBottom: "12px" }}>Tổng kết lệnh</div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "13px", opacity: 0.9 }}>Số loại hàng:</span>
                                    <span style={{ fontWeight: "700" }}>{order.details?.length ?? 0} loại</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                                    <span style={{ opacity: 0.9 }}>Tổng số lượng:</span>
                                    <span style={{ fontWeight: "800", fontSize: "18px" }}>{totalUnits} đv</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng cửa sổ</button>
                </div>
            </div>
        </div>
    );
};

// ── Scheduling Modal ──────────────────────────────────────
const ManualScheduleModal = ({ item, order, onClose, onFinish }) => {
    const [schedStart, setSchedStart] = useState("");
    const [schedEnd, setSchedEnd] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        if (!schedStart || !schedEnd) return alert("Vui lòng chọn ngày bắt đầu và kết thúc!");
        setSaving(true);
        try {
            await manufactureOrderService.manualSchedule({
                salesOrderId: order.id,
                productId: item.productId || item.product?.id,
                quantity: item.quantity,
                technicalNotes: "",
                requestedStartDate: schedStart,
                requestedEndDate: schedEnd
            });
            alert("Đã xếp lịch sản xuất thành công!");
            onFinish();
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="sq-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="sq-modal-box" style={{ width: "450px" }}>
                <div className="sq-modal-header">
                    <h3 className="sq-modal-title">Lập lịch thủ công</h3>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="sq-modal-body">
                    <div style={{ marginBottom: "16px" }}>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>Sản phẩm:</div>
                        <div style={{ fontWeight: "700", color: "#1e293b" }}>{item.productName}</div>
                    </div>
                    <div className="sq-f-group">
                        <label className="sq-f-label">Ngày bắt đầu dự kiến</label>
                        <input type="datetime-local" className="sq-f-input" value={schedStart} onChange={e => setSchedStart(e.target.value)} />
                    </div>
                    <div className="sq-f-group">
                        <label className="sq-f-label">Ngày kết thúc dự kiến</label>
                        <input type="datetime-local" className="sq-f-input" value={schedEnd} onChange={e => setSchedEnd(e.target.value)} />
                    </div>
                </div>
                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Hủy</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSubmit} disabled={saving}>
                        {saving ? "Đang lưu..." : "Xác nhận Lập lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────
export const PlanProduction = () => {
    const [viewMode,       setViewMode]       = useState("calendar");
    const [search,         setSearch]         = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page,           setPage]           = useState(0);
    const [viewOrder,      setViewOrder]      = useState(null);
    const [schedItem,      setSchedItem]      = useState(null);
    const [plans,          setPlans]          = useState([]);
    const [loadingPlans,   setLoadingPlans]   = useState(false);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const {orders, totalPages, totalElements, loading, error, refetch} = useProductionQueue(debouncedSearch, page);

    const fetchPlans = async () => {
        setLoadingPlans(true);
        try {
            const res = await api.get("/production-plans");
            setPlans(res.data?.data || []);
        } catch (err) {
            console.error("Lỗi khi tải kế hoạch:", err);
        } finally {
            setLoadingPlans(false);
        }
    };

    useEffect(() => {
        if (viewMode === "calendar") fetchPlans();
    }, [viewMode]);

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Kế hoạch Sản xuất</h1>
                </div>
                <div className="sp-view-toggle">
                    <button className={`sp-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px'}}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        Lịch biểu
                    </button>
                    <button className={`sp-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight: '6px'}}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        Danh sách
                    </button>
                </div>
            </div>

            {viewMode === "list" ? (
                <>
                    <div className="sq-toolbar">
                        <div className="sq-toolbar__left">
                            <div className="sq-search-wrap">
                                <div className="sp-search">
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                    <input
                                        placeholder="Tìm theo mã đơn hoặc tên khách hàng..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading && (
                        <div className="sp-state">
                            <div className="sp-spinner" />
                            <span>Đang trích xuất dữ liệu lệnh sản xuất...</span>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="sp-card">
                            <table className="sp-table">
                                <thead className="sq-table-head">
                                    <tr>
                                        <th style={{ width: "60px" }}>STT</th>
                                        <th>Mã đơn</th>
                                        <th>Khách hàng</th>
                                        <th style={{ textAlign: "center" }}>SL Loại</th>
                                        <th style={{ textAlign: "center" }}>Tổng SL</th>
                                        <th>Hạn giao hàng</th>
                                        <th>Ưu tiên</th>
                                        <th>Trạng thái</th>
                                        <th style={{ textAlign: "center" }}>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="sp-empty-row">
                                                <div className="sq-empty">
                                                    <div className="sq-empty__icon">📋</div>
                                                    <p>{search ? "Không tìm thấy lệnh phù hợp" : "Chưa có lệnh sản xuất nào trong hàng chờ"}</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((o, idx) => {
                                            const priorityKey = getPriorityKey(o.priorityLevel);
                                            const p           = PRIORITY[priorityKey] || {text: String(o.priorityLevel), cls: "sq-badge--draft"};
                                            const s           = STATUS[o.status]      || {text: o.status, cls: "so-badge--pending"};
                                            const totalUnits  = o.details?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ?? 0;
                                            const daysLeft    = getDaysRemaining(o.dueDate);

                                            return (
                                                <tr key={o.id} className="sp-table__row" onClick={() => setViewOrder(o)}>
                                                    <td className="sp-td--muted">{(page * 10) + idx + 1}</td>
                                                    <td><span className="so-order-id">{o.orderNumber}</span></td>
                                                    <td className="sp-td--name">{o.customer?.name ?? (o.customerName || "—")}</td>
                                                    <td style={{ textAlign: "center" }}>{o.details?.length ?? 0}</td>
                                                    <td style={{ textAlign: "center", fontWeight: "700" }}>{totalUnits}</td>
                                                    <td>
                                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                                            <span style={{ fontWeight: 600 }}>{fmtDate(o.dueDate)}</span>
                                                            {daysLeft !== null && (
                                                                <span style={{ fontSize: "11px", fontWeight: "600", color: daysLeft <= 2 ? "#ef4444" : "#b45309" }}>
                                                                    {daysLeft < 0 ? `Trễ ${Math.abs(daysLeft)}n` : `Còn ${daysLeft}n`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td><span className={`sq-badge ${p.cls}`}>{p.text}</span></td>
                                                    <td><span className={`so-badge ${s.cls}`}>{s.text}</span></td>
                                                    <td>
                                                        <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                                            <button className="sp-action-btn" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); setViewOrder(o); }}>
                                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                            
                            {/* Simple Pagination */}
                            {totalPages > 1 && (
                                <div className="sp-pagination">
                                    <div className="sp-pagination__left">Trang {page + 1} / {totalPages}</div>
                                    <div className="sp-pagination__right">
                                        <button className="sp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>&lt;</button>
                                        <button className="sp-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>&gt;</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="sp-card" style={{ padding: 0 }}>
                    <ProductionCalendar plans={plans} loading={loadingPlans} />
                </div>
            )}

            {viewOrder && (
                <WorkOrderDetailModal 
                    order={viewOrder} 
                    onClose={() => setViewOrder(null)} 
                    onSchedule={(item) => setSchedItem(item)}
                />
            )}

            {schedItem && (
                <ManualScheduleModal 
                    item={schedItem} 
                    order={viewOrder} 
                    onClose={() => setSchedItem(null)} 
                    onFinish={() => { setSchedItem(null); setViewOrder(null); refetch(); }}
                />
            )}

            <style>{`
                .sp-view-toggle {
                    display: flex;
                    background: #f1f5f9;
                    padding: 4px;
                    border-radius: 10px;
                    gap: 4px;
                }
                .sp-toggle-btn {
                    padding: 8px 16px;
                    border: none;
                    background: transparent;
                    border-radius: 7px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                }
                .sp-toggle-btn.active {
                    background: white;
                    color: #7c3aed;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
            `}</style>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   COMPONENT LỊCH SẢN XUẤT (CUSTOM CALENDAR)
───────────────────────────────────────────────────────────── */
const ProductionCalendar = ({ plans, loading }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
    const weekDays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    const totalDays = daysInMonth(month, year);
    const startDay = (firstDayOfMonth(month, year) + 6) % 7; 

    const calendarDays = [];
    for (let i = 0; i < startDay; i++) {
        calendarDays.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
        calendarDays.push(new Date(year, month, i));
    }

    const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
    const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));

    if (loading) return <div className="sp-state" style={{ padding: 100 }}><div className="sp-spinner" /></div>;

    return (
        <div className="pc-container">
            <div className="pc-header">
                <button className="pc-nav-btn" onClick={prevMonth}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h2>{monthNames[month]} {year}</h2>
                <button className="pc-nav-btn" onClick={nextMonth}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
            </div>
            <div className="pc-weekdays">
                {weekDays.map(d => <div key={d} className="pc-weekday">{d}</div>)}
            </div>
            <div className="pc-grid">
                {calendarDays.map((date, idx) => {
                    if (!date) return <div key={`empty-${idx}`} className="pc-cell empty"></div>;
                    const dateStr = date.toISOString().split('T')[0];
                    
                    const dayPlans = plans.filter(p => dateStr >= p.startDate && dateStr <= p.endDate);
                    const isSat = date.getDay() === 6;
                    const isSun = date.getDay() === 0;
                    const isWeekend = isSat || isSun;

                    return (
                        <div key={dateStr} className={`pc-cell ${isWeekend ? 'weekend' : ''}`}>
                            <div className="pc-cell-header">
                                <span className="pc-date">{date.getDate()}</span>
                                {isWeekend && <span className="pc-weekend-label">{isSat ? 'T7' : 'CN'}</span>}
                            </div>
                            
                            {!isWeekend ? (
                                <div className="pc-shifts">
                                    {/* Morning Shift (S) */}
                                    <div className="pc-shift-slot">
                                        <div className="pc-shift-tag morning">S</div>
                                        <div className="pc-events">
                                            {dayPlans.filter(p => {
                                                if (dateStr === p.startDate) return p.startShift === "S";
                                                return true;
                                            }).flatMap(p => (p.manufactureOrders || []).map(mo => ({...mo, planName: p.planName, startDate: p.startDate})))
                                            .map(mo => (
                                                <div key={mo.id} className={`pc-event status-${mo.wipStatus.toLowerCase()}`} title={`${mo.product?.name} (${mo.planName}) - ${mo.wipStatus}`}>
                                                    {mo.startDate === dateStr ? `${mo.product?.sku}: ${mo.quantity}` : "•"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    {/* Afternoon Shift (C) */}
                                    <div className="pc-shift-slot">
                                        <div className="pc-shift-tag afternoon">C</div>
                                        <div className="pc-events">
                                            {dayPlans.filter(p => {
                                                if (dateStr === p.endDate) return p.endShift === "C";
                                                return true;
                                            }).flatMap(p => (p.manufactureOrders || []).map(mo => ({...mo, planName: p.planName, startDate: p.startDate})))
                                            .map(mo => (
                                                <div key={mo.id} className={`pc-event status-${mo.wipStatus.toLowerCase()}`} title={`${mo.product?.name} (${mo.planName}) - ${mo.wipStatus}`}>
                                                    {mo.startDate === dateStr ? `${mo.product?.sku}: ${mo.quantity}` : "•"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="pc-off-day">
                                    <span>NGHỈ</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <style>{`
                .pc-container { padding: 24px; }
                .pc-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
                .pc-header h2 { font-size: 18px; font-weight: 800; color: #1e293b; }
                .pc-nav-btn { 
                    width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #e2e8f0; 
                    background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
                    color: #64748b; transition: all 0.2s;
                }
                .pc-nav-btn:hover { background: #f8fafc; color: #7c3aed; border-color: #7c3aed; }
                
                .pc-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
                .pc-weekday { text-align: center; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }

                .pc-grid { display: grid; grid-template-columns: repeat(7, 1fr); border-left: 1px solid #f1f5f9; border-top: 1px solid #f1f5f9; }
                .pc-cell { min-height: 140px; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; padding: 8px; position: relative; transition: background 0.2s; }
                .pc-cell.empty { background: #fafafa; }
                .pc-cell.weekend { background: #f8fafc; }
                .pc-cell-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
                .pc-date { font-size: 13px; font-weight: 800; color: #64748b; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
                .pc-weekend-label { font-size: 10px; font-weight: 800; color: #94a3b8; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; }
                
                .pc-shifts { display: flex; flex-direction: column; gap: 8px; }
                .pc-shift-slot { display: flex; gap: 6px; align-items: flex-start; min-height: 40px; }
                .pc-shift-tag { font-size: 9px; font-weight: 900; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border-radius: 3px; flex-shrink: 0; margin-top: 2px; }
                .pc-shift-tag.morning { background: #fef3c7; color: #b45309; }
                .pc-shift-tag.afternoon { background: #e0f2fe; color: #0369a1; }

                .pc-events { display: flex; flex-direction: column; gap: 2px; flex: 1; }
                .pc-event { 
                    font-size: 9px; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis;
                    font-weight: 600;
                    color: white;
                }
                .pc-event.status-planned { background: #fbbf24; border: 1px solid #f59e0b; color: #78350f; }
                .pc-event.status-in_progress { background: #3b82f6; border: 1px solid #2563eb; color: white; }
                .pc-event.status-completed { background: #22c55e; border: 1px solid #16a34a; color: white; }

                .pc-off-day { height: 80px; display: flex; align-items: center; justify-content: center; color: #cbd5e1; font-size: 11px; font-weight: 800; letter-spacing: 2px; }
            `}</style>
        </div>
    );
};