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

            <div className="sp-card">
                <div style={{ display: "flex", gap: "15px", marginBottom: "15px", alignItems: "center" }}>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn hoặc tên khách..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        style={{ flex: 1, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="PROCESSING">Đang sản xuất</option>
                        <option value="DELIVERED">Đã giao</option>
                        <option value="CANCELLED">Hủy</option>
                        <option value="PENDING_APPROVAL">Chờ duyệt</option>
                    </select>
                    <select
                        value={payFilter}
                        onChange={(e) => setPayFilter(e.target.value)}
                        style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px" }}
                    >
                        <option value="">Tất cả thanh toán</option>
                        <option value="UNPAID">Chưa thanh toán</option>
                        <option value="PARTIAL">Thanh toán một phần</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="DEPOSITED">Đã đặt cọc</option>
                    </select>
                    <button onClick={refetch} style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                        Tìm kiếm
                    </button>
                </div>
                <table className="sp-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th><th>Khách hàng</th><th>Ngày đặt</th><th>Trạng thái</th><th>Thanh toán</th><th>Tổng tiền</th><th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => {
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
                                    <td>
                                        <button onClick={() => setViewId(o.id)}>👁️</button>
                                        {canSchedule && (
                                            <button onClick={() => setQuickScheduleOrderId(o.id)} title="Lập lịch sản xuất">✏️</button>
                                        )}
                                        {o.status === "PENDING_APPROVAL" && (
                                            <button onClick={() => setSelectedForApproval(o)}>Duyệt</button>
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

const ShiftSelector = ({ label, onPick, selectedShiftId }) => (
    <div style={{ marginTop: "10px" }}>
        <div style={{ fontSize: "0.8em", color: "#6b7280", marginBottom: "6px" }}>{label}</div>
        <div style={{ display: "flex", gap: 8 }}>
            {SHIFTS.map(s => {
                const isSelected = selectedShiftId === s.id;
                return (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => onPick(s)}
                        style={{
                            flex: 1,
                            padding: "8px 10px",
                            border: isSelected ? "2px solid #2563eb" : "1px solid #d1d5db",
                            backgroundColor: isSelected ? "#eff6ff" : "white",
                            borderRadius: "6px",
                            cursor: "pointer",
                            textAlign: "center",
                        }}
                    >
                        <div style={{ fontWeight: 600, fontSize: "0.85em" }}>{s.label}</div>
                        <div style={{ fontSize: "0.72em", color: "#6b7280", marginTop: 2 }}>{s.sub}</div>
                    </button>
                );
            })}
        </div>
    </div>
);

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
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px", userSelect: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(year, month - 1, 1))}
                    style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "2px 12px", cursor: "pointer" }}
                >‹</button>
                <strong style={{ fontSize: "0.92em" }}>{MONTH_VN[month]} {year}</strong>
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(year, month + 1, 1))}
                    style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "2px 12px", cursor: "pointer" }}
                >›</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", gap: "2px" }}>
                {DAY_NAMES.map(d => (
                    <div key={d} style={{ fontWeight: 700, padding: "4px 0", fontSize: "0.72em", color: "#9ca3af" }}>{d}</div>
                ))}

                {Array.from({ length: firstDayIndex }).map((_, i) => <div key={`e-${i}`} />)}

                {Array.from({ length: daysInMonth }, (_, i) => {
                    const date = new Date(year, month, i + 1);
                    const isStart = isSameDay(date, startDate);
                    const isEnd = isSameDay(date, endDate);
                    const inRange = isInRange(new Date(date), startDate, endDate);

                    const isToday = isSameDay(date, new Date());

                    let bg = "transparent";
                    let color = "#111827";
                    let borderRadius = "6px";

                    if (isStart || isEnd) {
                        bg = "#2563eb"; color = "white";
                        if (isStart && endDate) borderRadius = "6px 0 0 6px";
                        if (isEnd) borderRadius = "0 6px 6px 0";
                        if (isStart && isEnd) borderRadius = "6px";
                    } else if (inRange) {
                        bg = "#dbeafe"; color = "#1d4ed8"; borderRadius = "0";
                    }

                    // Kiểm tra ngày có nằm trong danh sách bận không
                    const isBusy = busyDates.some(busy => {
                        const busyStart = new Date(busy.startDate);
                        const busyEnd = new Date(busy.endDate);
                        return date >= busyStart && date <= busyEnd;
                    });

                    return (
                        <div
                            key={i}
                            onClick={() => !isBusy && handleDayClick(i + 1)}
                            style={{
                                padding: "7px 2px",
                                cursor: isBusy ? "not-allowed" : "pointer",
                                backgroundColor: isBusy ? "#f3f4f6" : bg,
                                color: isBusy ? "#9ca3af" : color,
                                borderRadius,
                                fontSize: "0.83em",
                                fontWeight: isToday || isStart || isEnd ? 700 : 400,
                                border: isToday && !isStart && !isEnd ? "1px solid #2563eb" : "none"
                            }}
                        >
                            {i + 1}
                        </div>
                    );
                })}
            </div>
            <div style={{ marginTop: "10px", fontSize: "0.75em", color: "#6b7280", textAlign: "center" }}>
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
        <div className="so-modal-overlay">
            <div className="so-modal" style={{ maxWidth: "450px", padding: "24px", background: "#fff", borderRadius: "12px" }}>
                <h2 style={{ marginBottom: "10px" }}>Lập lịch sản xuất</h2>
                <p style={{ marginBottom: "15px" }}>Đơn hàng: <strong>{orderRef?.orderNumber}</strong></p>

                <RangeCalendarPicker
                    startDate={startDate}
                    endDate={endDate}
                    onRangeChange={handleRangeChange}
                    busyDates={calendarData}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
                    <div>
                        {startDate && (
                            <ShiftSelector
                                label={`Ca bắt đầu (${fmtDate(startDate)})`}
                                selectedShiftId={startShift?.id}
                                onPick={setStartShift}
                            />
                        )}
                    </div>
                    <div>
                        {endDate && (
                            <ShiftSelector
                                label={`Ca kết thúc (${fmtDate(endDate)})`}
                                selectedShiftId={endShift?.id}
                                onPick={setEndShift}
                            />
                        )}
                    </div>
                </div>

                <div style={{ marginTop: "25px", display: "flex", gap: "10px" }}>
                    <button className="sp-btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang lưu..." : "Xác nhận lập lịch"}
                    </button>
                    <button className="sp-btn-outline" onClick={onClose}>Hủy bỏ</button>
                </div>
            </div>
        </div>
    );
};