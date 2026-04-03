import React, { useState, useEffect } from "react";
import "./SalesPages.css";
import { CreateOrder } from "./CreateOrder.jsx";
import { SalesOrderDetail } from "./SalesOrderDetail.jsx";
import { useAuth } from "../../context/AuthContext";
import { useSalesOrders } from "../../hooks/useSalesOrders";
import { ApprovalModal } from "./ApprovalModal";
import salesOrderService, { ORDER_STATUS_MAP, PAYMENT_STATUS_MAP } from "../../services/salesOrderService.js";
import manufactureOrderService from "../../services/manufactureOrderService.js";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_VN = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

const SHIFTS = [
    { id: "morning", label: "Ca sáng", sub: "8:00 – 12:00", startH: 8, endH: 12 },
    { id: "afternoon", label: "Ca chiều", sub: "13:00 – 17:00", startH: 13, endH: 17 },
];

const isSameDay = (a, b) => a && b && a.toDateString() === b.toDateString();

// Cập nhật logic kiểm tra nằm trong khoảng để chính xác hơn về mặt thời gian
const isInRange = (date, start, end) => {
    if (!start || !end) return false;
    const d = new Date(date.setHours(0, 0, 0, 0)).getTime();
    const s = new Date(start.setHours(0, 0, 0, 0)).getTime();
    const e = new Date(end.setHours(0, 0, 0, 0)).getTime();
    return d > s && d < e;
};

export const SalesOrders = () => {
    const { user } = useAuth();
    const [keyword, setKeyword] = useState("");
    const [payFilter, setPayFilter] = useState("");
    const [page, setPage] = useState(0);
    const [showCreate, setShowCreate] = useState(false);
    const [viewId, setViewId] = useState(null);
    const [selectedForApproval, setSelectedForApproval] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [quickScheduleOrderId, setQuickScheduleOrderId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    const isSalesStaff = user?.role === "ROLE_SALES_STAFF";

    const { data, refetch } = useSalesOrders({
        keyword: keyword || undefined,
        paymentStatus: payFilter || undefined,
        status: statusFilter || undefined,
        page, size: 10,
    });

    const handleApprovalSubmit = async (isApproved, limit, note) => {
        try {
            const payload = { isApproved, newCreditLimit: limit, approvalNote: note };
            await salesOrderService.processApproval(selectedForApproval.id, payload);
            alert(isApproved ? "Phê duyệt đơn hàng thành công!" : "Từ chối đơn hàng thành công!");
            setSelectedForApproval(null);
            refetch();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể xử lý"));
        }
    };

    const orders = data?.content ?? [];

    if (viewId) return <SalesOrderDetail orderId={viewId} onBack={() => setViewId(null)} isSalesStaff={isSalesStaff} />;

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <h1 className="sp-title">Quản lý đơn hàng</h1>
            </div>

            <div className="so-toolbar">
                <div className="so-toolbar-main">
                    <div className="sp-search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo mã đơn hoặc tên khách..."
                            value={keyword}
                            onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                        />
                        <button
                            className="sp-search-filter"
                            title="Lọc nâng cao"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                            </svg>
                        </button>

                        {showFilters && (
                            <div className="sp-filter-popover">
                                <div className="sp-filter-field">
                                    <span className="sp-filter-label">Trạng thái</span>
                                    <select
                                        className="sp-filter-select"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="PENDING">Chờ xử lý</option>
                                        <option value="PROCESSING">Đang sản xuất</option>
                                        <option value="DELIVERED">Đã giao</option>
                                        <option value="CANCELLED">Hủy</option>
                                        <option value="PENDING_APPROVAL">Chờ duyệt</option>
                                    </select>
                                </div>
                                <div className="sp-filter-field">
                                    <span className="sp-filter-label">Thanh toán</span>
                                    <select
                                        className="sp-filter-select"
                                        value={payFilter}
                                        onChange={(e) => setPayFilter(e.target.value)}
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="UNPAID">Chưa thanh toán</option>
                                        <option value="PARTIAL">Thanh toán một phần</option>
                                        <option value="PAID">Đã thanh toán</option>
                                        <option value="DEPOSITED">Đã đặt cọc</option>
                                    </select>
                                </div>
                                <button
                                    className="sp-filter-clear"
                                    onClick={() => { setStatusFilter(""); setPayFilter(""); setShowFilters(false); }}
                                >
                                    Xóa lọc
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="so-toolbar-actions">
                    <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)}>
                        Tạo đơn hàng mới <span className="sp-btn-plus">+</span>
                    </button>
                </div>
            </div>

            <div className="sp-card">
                <table className="sp-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Trạng thái</th><th>Thanh toán</th><th>Tổng tiền</th><th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="sp-empty-row">Không có đơn hàng nào</td>
                            </tr>
                        ) : orders.map(o => {
                            const os = ORDER_STATUS_MAP[o.status?.trim()] || { text: o.status || "—", cls: "so-badge--default" };
                            const py = PAYMENT_STATUS_MAP[o.paymentStatus] || {};
                            const canSchedule = !o.hasManufactureOrder && (o.paymentStatus === "PAID" || o.paymentStatus === "DEPOSITED");

                            return (
                                <tr key={o.id}>
                                    <td>{o.orderNumber}</td>
                                    <td>{o.customerName}</td>
                                    <td>{fmtDate(o.createdDate)}</td>
                                    <td>{os.text}</td>
                                    <td>{py.text}</td>
                                    <td>{fmt(o.totalAmount)}</td>
                                    <td className="sp-td--actions">
                                        <button 
                                            className="sp-action-btn" 
                                            title="Xem chi tiết"
                                            onClick={() => setViewId(o.id)}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </button>
                                        
                                        {canSchedule && (
                                            <button 
                                                className="sp-action-btn" 
                                                title="Lập lịch sản xuất"
                                                onClick={() => setQuickScheduleOrderId(o.id)}
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                        )}
                                        
                                        {o.status === "PENDING_APPROVAL" && (
                                            <button 
                                                className="sp-btn-primary" 
                                                style={{ fontSize: "11px", padding: "4px 10px" }}
                                                onClick={() => setSelectedForApproval(o)}
                                            >
                                                Duyệt
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {data && data.totalPages > 1 && (
                    <div style={{ marginTop: "15px", display: "flex", justifyContent: "center", gap: "10px", alignItems: "center" }}>
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", background: page === 0 ? "#f3f4f6" : "white", cursor: page === 0 ? "not-allowed" : "pointer" }}
                        >
                            ‹ Trước
                        </button>
                        <span>Trang {page + 1} / {data.totalPages}</span>
                        <button
                            onClick={() => setPage(Math.min(data.totalPages - 1, page + 1))}
                            disabled={page >= data.totalPages - 1}
                            style={{ padding: "6px 12px", border: "1px solid #d1d5db", borderRadius: "4px", background: page >= data.totalPages - 1 ? "#f3f4f6" : "white", cursor: page >= data.totalPages - 1 ? "not-allowed" : "pointer" }}
                        >
                            Sau ›
                        </button>
                    </div>
                )}
            </div>

            {selectedForApproval && (
                <ApprovalModal
                    order={selectedForApproval}
                    onClose={() => setSelectedForApproval(null)}
                    onSubmit={handleApprovalSubmit}
                />
            )}

            {quickScheduleOrderId != null && (
                <QuickScheduleModal
                    orderId={quickScheduleOrderId}
                    onClose={() => {
                        setQuickScheduleOrderId(null);
                        refetch(); // Quan trọng: Cập nhật lại trạng thái hasManufactureOrder từ server
                    }}
                />
            )}

            {showCreate && <CreateOrder onBack={() => setShowCreate(false)} />}
        </div>
    );
};

/* ================= COMPONENT HỖ TRỢ ================= */

const ShiftSelector = ({ label, onPick, selectedShiftId }) => {
    return (
        <div className="so-shift-group">
            <div className="so-shift-label">{label}</div>
            <div className="so-shift-grid">
                {SHIFTS.map(s => {
                    const isSelected = selectedShiftId === s.id;
                    const Icon = s.id === "morning" ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                        </svg>
                    );

                    return (
                        <button
                            key={s.id}
                            type="button"
                            className={`so-shift-card ${isSelected ? 'so-shift-card--active' : ''}`}
                            onClick={() => onPick(s)}
                        >
                            <div className="so-shift-card__icon">{Icon}</div>
                            <div className="so-shift-card__content">
                                <div className="so-shift-card__title">{s.label}</div>
                                <div className="so-shift-card__time">{s.sub}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const RangeCalendarPicker = ({ startDate, endDate, onRangeChange, busyDates }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();

    const handleDayClick = (dayNum) => {
        const clickedDate = new Date(year, month, dayNum);

        if (!startDate || (startDate && endDate)) {
            // Trường hợp bắt đầu chọn mới hoặc chọn lại từ đầu
            onRangeChange(clickedDate, null);
        } else {
            // Đã có startDate, giờ chọn endDate
            if (clickedDate < startDate) {
                // Nếu click ngày trước startDate thì đặt ngày đó làm startDate mới
                onRangeChange(clickedDate, null);
            } else {
                onRangeChange(startDate, clickedDate);
            }
        }
    };

    return (
        <div className="so-calendar">
            <div className="so-calendar-header">
                <button
                    type="button"
                    className="so-calendar-nav"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                </button>
                <div className="so-calendar-title">{MONTH_VN[month]} {year}</div>
                <button
                    type="button"
                    className="so-calendar-nav"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"/>
                    </svg>
                </button>
            </div>

            <div className="so-calendar-grid">
                {DAY_NAMES.map(d => (
                    <div key={d} className="so-calendar-weekday">{d}</div>
                ))}

                {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`e-${i}`} className="so-calendar-day--empty" />)}

                {Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(year, month, i + 1);
                    const isStart = isSameDay(date, startDate);
                    const isEnd = isSameDay(date, endDate);
                    const inRange = isInRange(new Date(date), startDate, endDate);
                    const isToday = isSameDay(date, new Date());
                    const isSunday = date.getDay() === 0;

                    const isBusy = busyDates.some(busy => {
                        const busyStart = new Date(busy.startDate);
                        const busyEnd = new Date(busy.endDate);
                        return date >= busyStart && date <= busyEnd;
                    });

                    let dayCls = "so-calendar-day";
                    if (isStart) dayCls += " so-calendar-day--start";
                    if (isEnd) dayCls += " so-calendar-day--end";
                    if (inRange) dayCls += " so-calendar-day--range";
                    if (isToday) dayCls += " so-calendar-day--today";
                    if (isBusy) dayCls += " so-calendar-day--busy";
                    if (isSunday) dayCls += " so-calendar-day--sunday";

                    return (
                        <div
                            key={i}
                            className={dayCls}
                            onClick={() => !isBusy && handleDayClick(i + 1)}
                        >
                            <span className="so-calendar-day-num">{i + 1}</span>
                        </div>
                    );
                })}
            </div>
            <div className="so-calendar-footer">
                {!startDate ? "Chọn ngày bắt đầu" : !endDate ? "Chọn ngày kết thúc" : "Đã chọn xong khoảng ngày"}
            </div>
        </div>
    );
};

export const QuickScheduleModal = ({ orderId, onClose }) => {
    const [orderRef, setOrderRef] = useState(null);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startShift, setStartShift] = useState(null);
    const [endShift, setEndShift] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calendarData, setCalendarData] = useState([]);

    useEffect(() => {
        if (orderId) {
            salesOrderService.getById(orderId).then(setOrderRef).catch(console.error);
        }
        // Fetch calendar data to disable busy dates
        manufactureOrderService.getCalendar().then(setCalendarData).catch(console.error);
    }, [orderId]);

    const handleRangeChange = (start, end) => {
        setStartDate(start);
        setEndDate(end);
        // Reset ca nếu ngày bị xóa
        if (!start) setStartShift(null);
        if (!end) setEndShift(null);
    };

    const handleSubmit = async () => {
        if (!startDate || !endDate || !startShift || !endShift) {
            alert("Vui lòng chọn đầy đủ ngày và ca sản xuất!");
            return;
        }

        if (!orderRef || !orderRef.details || orderRef.details.length === 0) {
            alert("Không thể tải thông tin đơn hàng hoặc đơn hàng không có sản phẩm!");
            return;
        }

        const sDate = new Date(startDate);
        sDate.setHours(startShift.startH, 0, 0, 0);

        const eDate = new Date(endDate);
        eDate.setHours(endShift.endH, 0, 0, 0);

        if (eDate <= sDate) {
            alert("Thời gian kết thúc phải lớn hơn thời gian bắt đầu!");
            return;
        }

        setLoading(true);
        try {
            // Lập lịch cho tất cả sản phẩm trong đơn hàng
            const promises = orderRef.details.map(item =>
                manufactureOrderService.manualSchedule({
                    salesOrderId: orderId,
                    productId: item.productId,
                    quantity: item.quantity,
                    technicalNotes: "",
                    requestedStartDate: sDate.toISOString(),
                    requestedEndDate: eDate.toISOString(),
                })
            );
            await Promise.all(promises);
            alert("Lập lịch sản xuất thành công cho tất cả sản phẩm!");
            onClose();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || "Không thể lập lịch"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sp-modal-overlay">
            <div className="sp-modal-content sp-modal--light" style={{ width: "500px" }}>
                <div className="sp-modal-header">
                    <span className="sp-modal-title">Lập lịch sản xuất</span>
                    <button className="sp-modal-close" onClick={onClose}>&times;</button>
                </div>

                <div className="sp-modal-body">
                    <div className="info-box-light" style={{ marginBottom: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <span style={{ fontSize: "14px", color: "#64748b" }}>Đơn hàng:</span>
                            <span className="so-order-id">{orderRef?.orderNumber || "..."}</span>
                        </div>
                        <div className="so-modal-product-summary">
                            {orderRef?.details?.map((item, idx) => (
                                <div key={idx} className="so-modal-product-item">
                                    <span className="so-modal-product-name">{item.productName}</span>
                                    <span className="so-modal-product-qty">x{item.quantity}</span>
                                </div>
                            ))}
                            {(!orderRef?.details || orderRef.details.length === 0) && (
                                <div className="so-modal-product-empty">Đang tải thông tin sản phẩm...</div>
                            )}
                        </div>
                    </div>

                    <RangeCalendarPicker
                        startDate={startDate}
                        endDate={endDate}
                        onRangeChange={handleRangeChange}
                        busyDates={calendarData}
                    />

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "20px" }}>
                        <div>
                            {startDate && (
                                <ShiftSelector
                                    label={`Bắt đầu (${fmtDate(startDate)})`}
                                    selectedShiftId={startShift?.id}
                                    onPick={setStartShift}
                                />
                            )}
                        </div>
                        <div>
                            {endDate && (
                                <ShiftSelector
                                    label={`Kết thúc (${fmtDate(endDate)})`}
                                    selectedShiftId={endShift?.id}
                                    onPick={setEndShift}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <div className="sp-modal-footer">
                    <button className="btn-cancel" onClick={onClose}>Hủy bỏ</button>
                    <button className="btn-submit" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang lưu..." : "Xác nhận lập lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
};
