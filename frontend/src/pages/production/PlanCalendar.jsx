import { useState, useEffect } from "react";
import "./PlanCalendar.css";
import manufactureOrderService from "../../services/manufactureOrderService";

const MO_STATUS_INFO = {
    "PENDING": { text: "Chờ xử lý", color: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
    "PLANNED": { text: "Đã lên lịch", color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd" },
    "IN_PROGRESS": { text: "Đang SX", color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
    "COMPLETED": { text: "Hoàn thành", color: "#047857", bg: "#d1fae5", border: "#6ee7b7" },
    "CANCELLED": { text: "Đã hủy", color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
};

const MORNING_START = 8;
const MORNING_END = 12;
const AFTERNOON_START = 13;
const AFTERNOON_END = 17;

const isMorningShift = (startDate, endDate, day) => {
    const dayStart = new Date(day); dayStart.setHours(MORNING_START, 0, 0, 0);
    const dayMid = new Date(day); dayMid.setHours(MORNING_END, 0, 0, 0);
    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : s;
    return s < dayMid && e > dayStart;
};

const isAfternoonShift = (startDate, endDate, day) => {
    const dayMid = new Date(day); dayMid.setHours(AFTERNOON_START, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(AFTERNOON_END, 0, 0, 0);
    const s = new Date(startDate);
    const e = endDate ? new Date(endDate) : s;
    return s < dayEnd && e > dayMid;
};

const groupEvents = (events) => {
    const groupedMap = new Map();
    events.forEach(ev => {
        const key = `${ev.productName}-${ev.status}`;
        if (groupedMap.has(key)) {
            const existing = groupedMap.get(key);
            existing.totalQuantity = (existing.totalQuantity || 0) + (ev.quantity || 0);
            if (!existing.moNumbers.includes(ev.moNumber)) {
                existing.moNumbers.push(ev.moNumber);
            }
        } else {
            groupedMap.set(key, {
                ...ev,
                totalQuantity: ev.quantity || 0,
                moNumbers: [ev.moNumber]
            });
        }
    });
    return Array.from(groupedMap.values());
};

const getEventsForDay = (events, day) => {
    if (!day) return { morning: [], afternoon: [] };
    const startOfDay = new Date(day); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day); endOfDay.setHours(23, 59, 59, 999);

    const dayEvents = events.filter(ev => {
        if (!ev.startDate) return false;
        const s = new Date(ev.startDate);
        const e = ev.endDate ? new Date(ev.endDate) : s;
        return s <= endOfDay && e >= startOfDay;
    });

    return {
        morning: groupEvents(dayEvents.filter(ev => isMorningShift(ev.startDate, ev.endDate, day))),
        afternoon: groupEvents(dayEvents.filter(ev => isAfternoonShift(ev.startDate, ev.endDate, day))),
    };
};

const isSameDay = (d1, d2) =>
    d1 && d2 &&
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

export const PlanCalendar = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        setLoading(true);
        manufactureOrderService.getCalendar()
            .then(data => { setEvents(data); setError(null); })
            .catch(() => setError("Có lỗi khi tải lịch sản xuất."))
            .finally(() => setLoading(false));
    }, []);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const DAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

    // Component dùng chung để hiển thị danh sách sản phẩm sau khi gộp
    const RenderShiftEvents = ({ eventList }) => {
        if (eventList.length === 0) return <div className="pc-no-event">—</div>;
        return eventList.map(ev => {
            const si = MO_STATUS_INFO[ev.status] || MO_STATUS_INFO["PENDING"];
            return (
                <div
                    key={`${ev.productName}-${ev.status}`}
                    className="pc-event-pill"
                    style={{ background: si.bg, color: si.color, borderColor: si.border }}
                    title={`Sản phẩm: ${ev.productName}\nTổng số lượng: ${ev.totalQuantity}\nLệnh SX: ${ev.moNumbers.join(", ")}`}
                >
                    <span className="pc-event-id" style={{ fontWeight: 'bold' }}>
                        [{ev.totalQuantity}]
                    </span>
                    <span className="pc-event-name"> {ev.productName}</span>
                </div>
            );
        });
    };

    return (
        <div className="sp-page pc-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Lập lịch sản xuất</h1>
                    <p className="sp-sub">Lịch trình ca sáng / ca chiều — Không làm Chủ nhật</p>
                </div>
            </div>

            <div className="pc-toolbar">
                <button className="pc-btn" onClick={() => setCurrentDate(new Date())}>Tháng hiện tại</button>
                <div className="pc-nav">
                    <button className="pc-btn-icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>‹</button>
                    <span className="pc-month-label">Tháng {month + 1}, {year}</span>
                    <button className="pc-btn-icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>›</button>
                </div>
                <div className="pc-legend">
                    <div className="pc-legend-item">
                        <span className="pc-shift-badge pc-shift-morning">Ca sáng</span>
                        <span className="pc-legend-txt">8:00 – 12:00</span>
                    </div>
                    <div className="pc-legend-item">
                        <span className="pc-shift-badge pc-shift-afternoon">Ca chiều</span>
                        <span className="pc-legend-txt">13:00 – 17:00</span>
                    </div>
                </div>
            </div>

            <div className="sp-card pc-calendar-card">
                {loading ? (
                    <div className="sp-state"><div className="sp-spinner" /><span>Đang tải lịch...</span></div>
                ) : error ? (
                    <div className="sp-state sp-state--error">⚠️ {error}</div>
                ) : (
                    <div className="pc-grid">
                        {DAY_LABELS.map((label, i) => (
                            <div key={label} className={`pc-grid-header ${i === 0 ? "pc-grid-header--sun" : ""}`}>{label}</div>
                        ))}

                        {days.map((day, idx) => {
                            const isSun = day?.getDay() === 0;
                            const isToday = isSameDay(day, new Date());
                            const { morning, afternoon } = getEventsForDay(events, day);

                            return (
                                <div key={idx} className={`pc-day-cell ${!day ? "pc-empty-cell" : ""} ${isToday ? "pc-day-today" : ""} ${isSun ? "pc-day-sunday" : ""}`}>
                                    {day && (
                                        <>
                                            <div className="pc-day-number">
                                                <span className={isToday ? "pc-today-badge" : ""}>{day.getDate()}</span>
                                                {isSun && <span className="pc-sun-label">Nghỉ</span>}
                                            </div>
                                            {!isSun && (
                                                <>
                                                    <div className="pc-shift-row">
                                                        <div className="pc-shift-label pc-shift-label--morning"> Sáng</div>
                                                        <div className="pc-shift-events">
                                                            <RenderShiftEvents eventList={morning} />
                                                        </div>
                                                    </div>
                                                    <div className="pc-shift-divider" />
                                                    <div className="pc-shift-row">
                                                        <div className="pc-shift-label pc-shift-label--afternoon"> Chiều</div>
                                                        <div className="pc-shift-events">
                                                            <RenderShiftEvents eventList={afternoon} />
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};