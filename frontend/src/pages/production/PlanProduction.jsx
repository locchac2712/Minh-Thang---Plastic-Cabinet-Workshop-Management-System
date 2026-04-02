import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../sales/SalesPages.css";
import { ORDER_STATUS_MAP } from "../../services/salesOrderService.js";
import manufactureOrderService from "../../services/manufactureOrderService.js";

const api = axios.create();
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
});

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");
const fmtCurrency = (n) => n != null ? new Intl.NumberFormat("vi-VN").format(n) + " đ" : "0 đ";

const getPriorityBadge = (p) => {
    const styles = {
        1: { bg: "#fef2f2", color: "#dc2626", label: "Cao", cls: "so-badge--cancelled" },
        2: { bg: "#fffbeb", color: "#d97706", label: "Trung bình", cls: "so-badge--deposit" },
        3: { bg: "#f0f9ff", color: "#0284c7", label: "Thấp", cls: "so-badge--delivered" },
    };
    const style = styles[p] || { bg: "#f1f5f9", color: "#64748b", label: "N/A", cls: "so-badge--pending" };
    return (
        <span className={`so-badge ${style.cls}`}>{style.label}</span>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="sod-info-row">
        <span className="sod-info-label">{label}</span>
        <span className="sod-info-value">{value ?? "—"}</span>
    </div>
);

export const PlanProduction = () => {
    const [view, setView] = useState("LIST");
    const [search, setSearch] = useState("");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [schedItem, setSchedItem] = useState(null);
    const [schedStart, setSchedStart] = useState("");
    const [schedEnd, setSchedEnd] = useState("");


    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/v1/sales-orders/production-queue`, {
                params: { keyword: search, page: 0, size: 50 }
            });
            setOrders(res.data?.data?.content || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    }, [search]);

    useEffect(() => { if (view === "LIST") fetchData(); }, [fetchData, view]);

    const handleGoToDetail = async (id) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/v1/sales-orders/${id}`);
            if (res.data?.status === "SUCCESS") {
                setSelectedOrder(res.data.data);
                setView("DETAIL");
                window.scrollTo(0, 0);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleScheduleSubmit = async () => {
        if (!schedStart || !schedEnd) return alert("Vui lòng chọn ngày bắt đầu và kết thúc!");
        try {
            await manufactureOrderService.manualSchedule({
                salesOrderId: selectedOrder.id,
                productId: schedItem.productId || schedItem.product?.id,
                quantity: schedItem.quantity,
                technicalNotes: "",
                requestedStartDate: schedStart,
                requestedEndDate: schedEnd
            });
            alert("Đã xếp lịch sản xuất thành công!");
            setShowModal(false);
        } catch (err) {
            alert(err.response?.data?.message || err.message);
        }
    };

    // ── GIAO DIỆN TRANG CHI TIẾT ĐẦY ĐỦ THÔNG TIN ──
    if (view === "DETAIL" && selectedOrder) {
        const os = ORDER_STATUS_MAP[selectedOrder.status] || { text: selectedOrder.status, cls: "" };
        return (
            <div className="sod-page">
                <div className="sod-header">
                    <div>
                        <h1 className="sod-title">📑 Kế hoạch Sản xuất</h1>
                        <div className="sod-header-meta">
                            <span className="so-order-id">#{selectedOrder.orderNumber}</span>
                            <span className={`so-badge ${os.cls}`}>{os.text}</span>
                        </div>
                    </div>
                    <button className="cf-back-btn" onClick={() => { setView("LIST"); setSelectedOrder(null); }}>← Quay lại danh sách</button>
                </div>

                <div className="sod-grid">
                    <div className="sod-col-main">
                        <div className="sod-card">
                            <div className="sod-card__title">ℹ️ Thông tin khách hàng & thời gian</div>
                            <div className="sod-info-grid">
                                <InfoRow label="Khách hàng"     value={selectedOrder.customerName || selectedOrder.customer?.name} />
                                <InfoRow label="Mã KH"          value={selectedOrder.customerId || selectedOrder.customer?.id || selectedOrder.customer?.code} />
                                <InfoRow label="Ngày đặt"       value={fmtDate(selectedOrder.createdDate)} />
                                <InfoRow label="Hạn giao (dự kiến)" value={fmtDate(selectedOrder.dueDate)} />
                            </div>
                        </div>

                        <div className="sod-card">
                            <div className="sod-card__title">📦 Cần sản xuất</div>
                            <table className="sod-table">
                                <thead>
                                    <tr><th>#</th><th>Sản phẩm</th><th style={{textAlign: "center"}}>SL</th><th>Đơn giá</th><th>Xếp lịch</th></tr>
                                </thead>
                                <tbody>
                                    {((selectedOrder.details || selectedOrder.items) || []).map((item, i) => (
                                        <tr key={i}>
                                            <td className="sod-td--idx">{i + 1}</td>
                                            <td className="sod-td--name">{item.productName || item.product?.name}</td>
                                            <td style={{ fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>{item.quantity}</td>
                                            <td>{fmtCurrency(item.unitPrice)}</td>
                                            <td className="sod-td--amount">
                                                <button onClick={() => {
                                                    setSchedItem(item);
                                                    setShowModal(true);
                                                }} style={{background:"none", border:"none", cursor:"pointer"}} title="Chọn ngày bắt đầu & kết thúc dự kiến">
                                                    ✏️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {((selectedOrder.details || selectedOrder.items) == null || (selectedOrder.details || selectedOrder.items).length === 0) && (
                                        <tr><td colSpan={5} style={{textAlign: "center", color: "#9ca3af", padding: "12px"}}>Không có sản phẩm</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="sod-col-side">
                        <div className="sod-card">
                            <div className="sod-card__title">⚙️ Điều phối sản xuất</div>
                            <div className="sod-side-row">
                                <span className="sod-side-label">Tổng tiền</span>
                                <span className="sod-side-value" style={{color: "#7c3aed", fontWeight: 700}}>{fmtCurrency(selectedOrder.totalAmount)}</span>
                            </div>
                            <div className="sod-divider"/>
                            <div className="sod-side-row" style={{ alignItems: "center" }}>
                                <span className="sod-side-label">Độ ưu tiên</span>
                                {getPriorityBadge(selectedOrder.priorityLevel)}
                            </div>
                        </div>

                        <div className="sod-card">
                            <div className="sod-card__title">📝 Ghi chú sản xuất</div>
                            <p style={{ fontSize: "13px", color: "#475569", lineHeight: "1.5", margin: 0 }}>
                                {selectedOrder.note || "Không có ghi chú nào thêm."}
                            </p>
                        </div>
                    </div>
                </div>

                {showModal && (
                    <div className="so-modal-overlay">
                        <div className="so-modal">
                            <div className="so-modal-header">
                                <h2>Xếp lịch sản xuất thủ công</h2>
                                <button className="so-modal-close" onClick={() => setShowModal(false)}>&times;</button>
                            </div>
                            <div className="so-modal-body">
                                <p style={{marginBottom: "1rem"}}>Mã SP: {schedItem?.productName || schedItem?.product?.name}</p>
                                <div className="so-form-group">
                                    <label>Ngày bắt đầu dự kiến</label>
                                    <input type="datetime-local" className="so-input" value={schedStart} onChange={e => setSchedStart(e.target.value)} />
                                </div>
                                <div className="so-form-group">
                                    <label>Ngày kết thúc dự kiến</label>
                                    <input type="datetime-local" className="so-input" value={schedEnd} onChange={e => setSchedEnd(e.target.value)} />
                                </div>
                                <div className="so-modal-footer">
                                    <button className="so-btn-cancel" onClick={() => setShowModal(false)}>Hủy</button>
                                    <button className="sp-btn-primary" onClick={handleScheduleSubmit}>Lưu và Chốt Lịch</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── GIAO DIỆN TRANG DANH SÁCH ──
    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Danh sách kế hoạch sản xuất</h1>
                    <p className="sp-sub">Quản lý và điều phối danh sách các lệnh sản xuất</p>
                </div>
            </div>

            <div className="so-toolbar">
                <div className="so-toolbar-main">
                    <div className="sp-search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            placeholder="Tìm theo mã đơn hoặc khách hàng..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <button className="sp-search-filter" title="Lọc dữ liệu" onClick={() => setShowFilters(!showFilters)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="so-toolbar-actions">
                    <button className="sp-btn-primary sp-btn-primary--pill">
                        Tạo lệnh sản xuất <span className="sp-btn-plus">+</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="sp-state"><div className="sp-spinner" /><span>Đang tải...</span></div>
            ) : (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Ngày đặt</th>
                                <th>Hạn giao</th>
                                <th>Ưu tiên</th>
                                <th>Trạng thái</th>
                                <th>Tổng tiền</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="sp-empty-row">
                                        <div className="sq-empty">
                                            <div className="sq-empty__icon">📋</div>
                                            <p>Không có dữ liệu chờ kế hoạch</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.map(o => {
                                const os = ORDER_STATUS_MAP[o.status] || { text: o.status, cls: "" };
                                return (
                                    <tr key={o.id} className="sp-table__row">
                                        <td><span className="so-order-id">{o.orderNumber}</span></td>
                                        <td className="sp-td--name">{o.customerName || o.customer?.name || "Khách lẻ"}</td>
                                        <td className="sp-td--muted">{fmtDate(o.createdDate)}</td>
                                        <td className="sp-td--muted" style={{color: "#dc2626", fontWeight: "600"}}>{fmtDate(o.dueDate)}</td>
                                        <td>{getPriorityBadge(o.priorityLevel)}</td>
                                        <td><span className={`so-badge ${os.cls}`}>{os.text}</span></td>
                                        <td className="sp-td--price">{fmtCurrency(o.totalAmount)}</td>
                                        <td className="sp-td--actions">
                                            <button
                                                className="sp-action-btn"
                                                title="Xem chi tiết"
                                                onClick={() => handleGoToDetail(o.id)}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};