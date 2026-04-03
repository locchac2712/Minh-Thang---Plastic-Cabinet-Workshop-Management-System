import React, { useState, useEffect } from "react";
import manufactureOrderService from "../../services/manufactureOrderService";
import "../production/PlanCalendar.css";

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
        } else {
            groupedMap.set(key, { ...ev, totalQuantity: ev.quantity || 0 });
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

export const PlanCalendarModal = ({ isOpen, onClose, onSelectDate }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        manufactureOrderService.getCalendar()
            .then(data => setEvents(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const days = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const RenderShiftEvents = ({ eventList }) => {
        if (eventList.length === 0) return <div className="pc-no-event">—</div>;
        return eventList.map(ev => {
            const si = MO_STATUS_INFO[ev.status] || MO_STATUS_INFO["PENDING"];
            return (
                <div key={`${ev.productName}-${ev.status}`} className="pc-event-pill" style={{ background: si.bg, color: si.color, fontSize: '10px', padding: '2px 4px', marginBottom: '2px' }}>
                   <b>[{ev.totalQuantity}]</b> {ev.productName}
                </div>
            );
        });
    };

    return (
        <div className="sq-modal-overlay" style={{ zIndex: 10001 }} onClick={onClose}>
            <div className="sq-modal-box" style={{ width: '900px', height: '80vh' }} onClick={e => e.stopPropagation()}>
                <div className="sq-modal-header">
                    <h2 className="sq-modal-title">📌 Lịch trình xưởng sản xuất</h2>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="sq-modal-body" style={{ padding: '20px' }}>
                    <div className="pc-toolbar" style={{ marginBottom: '15px' }}>
                        <div className="pc-nav">
                            <button className="cf-add-row-btn" style={{ padding: '6px 12px' }} onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>‹</button>
                            <span style={{ fontWeight: '800', fontSize: '16px', minWidth: '150px', textAlign: 'center' }}>Tháng {month + 1}, {year}</span>
                            <button className="cf-add-row-btn" style={{ padding: '6px 12px' }} onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>›</button>
                        </div>
                        <div className="pc-legend" style={{ fontSize: '12px' }}>
                            <span style={{ color: '#4f46e5', fontWeight: 'bold' }}>Bấm vào ngày để chọn</span>
                        </div>
                    </div>
                    
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="sp-spinner"></div></div>
                    ) : (
                        <div className="pc-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(l => <div key={l} style={{ textAlign: 'center', fontWeight: '800', fontSize: '12px', color: '#94a3b8' }}>{l}</div>)}
                            {days.map((day, idx) => {
                                const isSun = day?.getDay() === 0;
                                const { morning, afternoon } = getEventsForDay(events, day);
                                return (
                                    <div key={idx} 
                                        className={`pc-day-cell ${!day ? "pc-empty" : ""} ${isSun ? "pc-sun" : ""}`}
                                        style={{ height: '100px', border: '1px solid #f1f5f9', borderRadius: '12px', cursor: day && !isSun ? 'pointer' : 'default', position: 'relative', overflow: 'hidden' }}
                                        onClick={() => day && !isSun && onSelectDate(day)}
                                    >
                                        {day && (
                                            <div style={{ padding: '6px', height: '100%', background: morning.length > 0 || afternoon.length > 0 ? '#fcfdff' : '#fff' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '800', color: isSun ? '#ef4444' : '#64748b' }}>{day.getDate()}</span>
                                                {!isSun && (
                                                    <div style={{ marginTop: '4px' }}>
                                                        <RenderShiftEvents eventList={morning} />
                                                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                                                        <RenderShiftEvents eventList={afternoon} />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="sq-modal-footer">
                   <p style={{ fontSize: '12px', color: '#64748b' }}>* Lịch trình chỉ mang tính chất tham khảo dựa trên các lệnh sản xuất hiện có.</p>
                   <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng lại</button>
                </div>
            </div>
        </div>
    );
};
