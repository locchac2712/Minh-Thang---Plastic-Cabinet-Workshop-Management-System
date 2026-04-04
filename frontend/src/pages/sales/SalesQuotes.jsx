import { useState, useRef, useEffect } from "react";
import "./SalesPages.css";
import { CreateQuoteModal } from "./CreateQuoteModal.jsx";
import { EditQuoteModal } from "./EditQuoteModal.jsx";
import { ViewQuoteModal } from "./ViewQuoteModal.jsx";
import { useQuotations } from "../../hooks/useQuotations";
import { getQuoteStatus } from "../../services/quotationService.js";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";
import { printQuotation } from "../../utils/printUtils";
import { fmt, fmtDate } from "../../utils/formatUtils";


const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Chờ duyệt" },
    { value: "SENT", label: "Đã gửi" },
    { value: "ACCEPTED", label: "Đã duyệt" },
    { value: "REJECTED", label: "Đã hủy" },
    { value: "EXPIRED", label: "Hết hạn" },
];

const PRICE_RANGE_OPTIONS = [
    { value: "all",      label: "Tất cả giá trị" },
    { value: "under5",   label: "Dưới 5 triệu" },
    { value: "5-10",     label: "5 - 10 triệu" },
    { value: "10-50",    label: "10 - 50 triệu" },
    { value: "50-100",   label: "50 - 100 triệu" },
    { value: "over100",  label: "Trên 100 triệu" },
];

const PRICE_RANGE_MAP = {
    all:      { min: undefined, max: undefined },
    under5:   { min: 0,        max: 5000000 },
    "5-10":   { min: 5000000,  max: 10000000 },
    "10-50":  { min: 10000000, max: 50000000 },
    "50-100": { min: 50000000, max: 100000000 },
    over100:  { min: 100000000,max: undefined },
};

// ── Shared UI Components ───────────
const TooltipWrapper = ({ children, text }) => (
    <div className="sq-tooltip-container">
        {children}
        <span className="sq-tooltip-text">{text}</span>
    </div>
);

const Toast = ({ msg, type, onClose }) => (
    <div className={`sq-toast sq-toast--${type}`}>
        <span>{msg}</span>
        <button onClick={onClose}>✕</button>
    </div>
);

const CustomStatusSelect = ({ value, onChange, options, placeholder = "Chọn..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapRef = useRef(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="sq-custom-select" ref={wrapRef}>
            <div className={`sq-select-trigger${isOpen ? " sq-select-trigger--open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                <span style={{ color: selected?.color }}>{selected ? selected.label : placeholder}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
            </div>
            {isOpen && (
                <div className="sq-select-popup">
                    {options.map(o => (
                        <div key={o.value} className={`sq-select-item${value === o.value ? " sq-select-item--active" : ""}`} onClick={() => { onChange(o.value); setIsOpen(false); }}>
                            <span style={{ color: o.color }}>{o.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CustomDateRangePicker = ({ start, end, onStartChange, onEndChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const wrapRef = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const formatDate = (dStr) => {
        if (!dStr) return "";
        const d = new Date(dStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    const handleDayClick = (dayStr) => {
        if (!start || (start && end)) { onStartChange(dayStr); onEndChange(""); }
        else {
            if (new Date(dayStr) < new Date(start)) { onStartChange(dayStr); onEndChange(""); }
            else { onEndChange(dayStr); setIsOpen(false); }
        }
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear(), month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i).toISOString().split("T")[0]);

        return (
            <div className="sq-calendar">
                <div className="sq-cal-header">
                    <button type="button" onClick={() => setViewDate(new Date(year, month - 1))}>&lt;</button>
                    <span>Tháng {month + 1}, {year}</span>
                    <button type="button" onClick={() => setViewDate(new Date(year, month + 1))}>&gt;</button>
                </div>
                <div className="sq-cal-grid">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => <div key={d} className="sq-cal-day-head">{d}</div>)}
                    {days.map((d, index) => {
                        if (!d) return <div key={`empty-${index}`} />;
                        const isStart = d === start, isEnd = d === end, inRange = start && end && new Date(d) > new Date(start) && new Date(d) < new Date(end);
                        return <div key={d} className={`sq-cal-day${isStart ? " sq-cal-day--start" : ""}${isEnd ? " sq-cal-day--end" : ""}${inRange ? " sq-cal-day--range" : ""}`} onClick={() => handleDayClick(d)}>{new Date(d).getDate()}</div>;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="sq-custom-select" ref={wrapRef}>
            <div className={`sq-select-trigger${isOpen ? " sq-select-trigger--open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                <span>{start ? `${formatDate(start)}${end ? ` - ${formatDate(end)}` : " - ..."}` : "Từ ngày - Đến ngày"}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </div>
            {isOpen && <div className="sq-select-popup sq-select-popup--calendar">{renderCalendar()}</div>}
        </div>
    );
};

// ── Main Page Component ───────────────────────────────────
export const SalesQuotes = () => {
    const { hasRole, user } = useAuth();
    const isDirector = hasRole("DIRECTOR");

    // Filter states
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [priceRangeId, setPriceRangeId] = useState("all");
    const [page, setPage] = useState(0);

    // Visibility + Action states
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewingId, setViewingId] = useState(null);
    const [printingId, setPrintingId] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleClearFilters = () => {
        setSearchTerm("");
        setDebouncedSearch("");
        setStatusFilter("");
        setStartDate("");
        setEndDate("");
        setPriceRangeId("all");
    };

    const handlePrint = async (qId) => {
        try {
            setPrintingId(qId);
            const res = await quotationService.getById(qId);
            printQuotation(res);
        } catch (e) {
            console.error("Lỗi khi tải dữ liệu in:", e);
            showToast("Không thể tải thông tin để in báo giá!", "error");
        } finally {
            setPrintingId(null);
        }
    };

    const handleSend = async (id) => {
        try {
            setUpdatingId(id);
            await quotationService.updateStatus(id, "WAITING_APPROVAL");
            showToast("Đã gửi báo giá cho Giám đốc phê duyệt!");
            refetch();
        } catch (err) {
            showToast(err.response?.data?.message || "Lỗi khi gửi báo giá", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleUpdateStatus = async (id, newStatus) => {
        let reason = null;
        if (newStatus === "REJECTED") {
            reason = window.prompt("Vui lòng nhập lý do từ chối báo giá này:");
            if (reason === null) return;
            if (!reason.trim()) {
                alert("Lý do từ chối là bắt buộc!");
                return;
            }
        } else {
            if (!window.confirm(`Bạn có chắc chắn muốn chuyển trạng thái báo giá sang ${newStatus}?`)) return;
        }

        try {
            setUpdatingId(id);
            await quotationService.updateStatus(id, newStatus, reason);
            showToast("Cập nhật trạng thái thành công!");
            refetch();
        } catch (err) {
            showToast(err.response?.data?.message || "Lỗi khi cập nhật trạng thái", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const pRange = PRICE_RANGE_MAP[priceRangeId] || PRICE_RANGE_MAP.all;

    const { data, loading, error, refetch } = useQuotations({
        keyword: debouncedSearch || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: pRange.min,
        maxAmount: pRange.max,
        page: page, size: 10,
    });

    const quotes = data?.content ?? [];
    const total = data?.totalElements ?? 0;

    return (
        <div className="sp-page">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <div className="sp-page-header">
                <div><h1 className="sp-title">Danh sách Báo giá</h1></div>
            </div>

            <div className="sq-toolbar-wrap">
                <div className="sp-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input placeholder="Tìm mã báo giá, khách hàng..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }} />
                    <button className={`sq-filter-toggle${showFilters ? " sq-filter-toggle--active" : ""}`} onClick={() => setShowFilters(!showFilters)} title="Lọc nâng cao">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    </button>
                </div>
                <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)} title="Tạo báo giá mới">
                    Tạo báo giá
                    <span className="sp-btn-plus">+</span>
                </button>
            </div>

            {showFilters && (
                <div className="sq-filter-panel">
                    <div className="sq-f-group"><label className="sq-f-label">Trạng thái</label><CustomStatusSelect value={statusFilter} options={[{ value: "", label: "Tất cả trạng thái" }, ...STATUS_OPTIONS]} onChange={val => { setStatusFilter(val); setPage(0); }} /></div>
                    <div className="sq-f-group"><label className="sq-f-label">Ngày tạo</label><CustomDateRangePicker start={startDate} end={endDate} onStartChange={v => { setStartDate(v); setPage(0); }} onEndChange={v => { setEndDate(v); setPage(0); }} /></div>
                    <div className="sq-f-group"><label className="sq-f-label">Giá trị</label><CustomStatusSelect value={priceRangeId} options={PRICE_RANGE_OPTIONS} onChange={val => { setPriceRangeId(val); setPage(0); }} /></div>
                    <div className="sq-f-group sq-f-group--btns"><label className="sq-f-label">&nbsp;</label><button className="sq-btn-clear" onClick={handleClearFilters} title="Xóa bộ lọc">✕</button></div>
                </div>
            )}

            {error ? (
                <div className="sp-state sp-state--error">{error}</div>
            ) : (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead className="sq-table-head">
                            <tr>
                                <th>Mã BG</th>
                                <th>Khách hàng</th>
                                {isDirector && <th>Nhân viên</th>}
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Hiệu lực</th>
                                <th style={{ textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.length === 0 ? (
                                <tr><td colSpan={isDirector ? 7 : 6} className="sp-empty-row"><div className="sq-empty">Không tìm thấy báo giá nào</div></td></tr>
                            ) : quotes.map(q => {
                                const s = getQuoteStatus(q.status);
                                const label = STATUS_OPTIONS.find(o => o.value === q.status)?.label || q.status;
                                const isDraftOrRejected = q.status === "DRAFT" || q.status === "REJECTED";
                                const isWaiting = q.status === "WAITING_APPROVAL";
                                const isApproved = q.status === "APPROVED";
                                
                                return (
                                    <tr key={q.id} className="sp-table__row">
                                        <td><span className="sq-quote-id">{q.quotationNumber}</span></td>
                                        <td className="sp-td--name">{q.customerName}</td>
                                        {isDirector && <td className="sp-td--muted">{q.staffName}</td>}
                                        <td className="sp-td--price">{fmt(q.totalAmount)}</td>
                                        <td>
                                            {q.status === "REJECTED" && q.rejectionReason ? (
                                                <TooltipWrapper text={`Lý do: ${q.rejectionReason}`}>
                                                    <span className={`sq-badge ${s.cls}`}>{label}</span>
                                                </TooltipWrapper>
                                            ) : (
                                                <span className={`sq-badge ${s.cls}`}>{label}</span>
                                            )}
                                        </td>
                                        <td className="sp-td--muted">{fmtDate(q.validUntil)}</td>
                                        <td>
                                            <div className="sp-td--actions" style={{justifyContent:"center"}}>
                                                <TooltipWrapper text="Xem chi tiết">
                                                    <button className="sp-action-btn" onClick={() => setViewingId(q.id)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    </button>
                                                </TooltipWrapper>

                                                {(isDraftOrRejected) && (
                                                    <TooltipWrapper text="Chỉnh sửa">
                                                        <button className="sp-action-btn" onClick={() => setEditingId(q.id)}>
                                                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                        </button>
                                                    </TooltipWrapper>
                                                )}

                                                {(isDraftOrRejected) && (
                                                    <TooltipWrapper text="Gửi duyệt">
                                                        <button 
                                                            className={`sp-action-btn ${updatingId === q.id ? "sq-spinning" : ""}`} 
                                                            disabled={updatingId === q.id}
                                                            onClick={() => handleSend(q.id)}
                                                        >
                                                            {updatingId === q.id ? <div className="sp-spinner sp-spinner--small" /> : 
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                                                            }
                                                        </button>
                                                    </TooltipWrapper>
                                                )}

                                                {isDirector && isWaiting && (
                                                    <>
                                                        <TooltipWrapper text="Phê duyệt">
                                                            <button className="sp-action-btn sq-approve-btn" onClick={() => handleUpdateStatus(q.id, "APPROVED")}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                                            </button>
                                                        </TooltipWrapper>
                                                        <TooltipWrapper text="Từ chối/Yêu cầu sửa">
                                                            <button className="sp-action-btn sq-reject-btn" onClick={() => handleUpdateStatus(q.id, "REJECTED")}>
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                            </button>
                                                        </TooltipWrapper>
                                                    </>
                                                )}

                                                {(isApproved || q.status === "ACCEPTED") && (
                                                    <TooltipWrapper text="In báo giá">
                                                        <button 
                                                            className={`sp-action-btn ${printingId === q.id ? "sq-spinning" : ""}`} 
                                                            onClick={(e) => { e.stopPropagation(); handlePrint(q.id); }} 
                                                            disabled={printingId === q.id}
                                                        >
                                                            {printingId === q.id ? <div className="sp-spinner sp-spinner--small" /> : 
                                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                                                            }
                                                        </button>
                                                    </TooltipWrapper>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    {total > 0 && (
                        <div className="sq-table-foot">
                            <div className="sq-foot-info">
                                Hiển thị <strong>{page * 10 + 1}</strong> - <strong>{Math.min(total, (page + 1) * 10)}</strong> trên <strong>{total}</strong> báo giá
                            </div>
                            <div className="sq-pagination">
                                <button className="sq-page-nav" disabled={page === 0} onClick={() => setPage(page - 1)} title="Trang trước">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
                                </button>
                                <div className="sq-page-numbers">
                                    {[...Array(data?.totalPages || 0)].map((_, i) => (
                                        <button key={i} className={`sq-page-num${page === i ? " sq-page-num--active" : ""}`} onClick={() => setPage(i)}>{i + 1}</button>
                                    ))}
                                </div>
                                <button className="sq-page-nav" disabled={page >= (data?.totalPages || 1) - 1} onClick={() => setPage(page + 1)} title="Trang sau">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showCreate && <CreateQuoteModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refetch(); showToast("Đã tạo báo giá thành công!"); }} />}
            {editingId && <EditQuoteModal quoteId={editingId} onClose={() => setEditingId(null)} onSaved={() => { setEditingId(null); refetch(); showToast("Đã cập nhật báo giá!"); }} />}
            {viewingId && <ViewQuoteModal quoteId={viewingId} onClose={() => setViewingId(null)} onSaved={() => { refetch(); }} />}

            <style>{`
                .sq-toolbar-wrap { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
                .sq-toolbar-wrap .sp-search { flex: 1; }
                .sp-table__row { transition: background 0.2s; cursor: default; }
                .sp-table__row:hover { background: #f8fafc; }
                .sp-table td { padding: 16px 20px; vertical-align: middle; }
                .sq-toast { position: fixed; top: 20px; right: 24px; z-index: 10000; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; box-shadow: 0 10px 30px rgba(0,0,0,.15); animation: toastIn .3s ease; }
                @keyframes toastIn { from{transform:translateX(50px);opacity:0} to{transform:none;opacity:1} }
                .sq-toast--success { background: #f0fdf4; color: #15803d; border: 1.5px solid #bbf7d0; }
                .sq-toast--error { background: #fef2f2; color: #b91c1c; border: 1.5px solid #fecaca; }
                .sq-toast button { background: none; border: none; cursor: pointer; color: inherit; opacity: .5; margin-left: 20px; }
                .sq-empty { padding: 60px 0; text-align: center; color: #9ca3af; font-size: 14px; }
                .sq-btn-clear { background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 10px; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #6b7280; transition: all .15s; }
                .sq-btn-clear:hover { background: #e5e7eb; color: #111827; }
                .sq-table-head th { color: #475569; font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.8px; padding: 16px 20px; }
                .sq-table-foot { padding: 20px 28px; border-top: 1px solid #edf2f7; background: #fff; display: flex; align-items: center; justify-content: space-between; border-radius: 0 0 20px 20px; }
                .sq-foot-info { font-size: 13.5px; color: #64748b; font-weight: 500; }
                .sq-pagination { display: flex; align-items: center; gap: 8px; }
                .sq-page-nav { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; color: #475569; cursor: pointer; transition: all .2s; }
                .sq-page-nav:hover:not(:disabled) { border-color: #4f46e5; color: #4f46e5; background: #eff6ff; }
                .sq-page-nav:disabled { opacity: 0.3; cursor: not-allowed; }
                .sq-page-numbers { display: flex; align-items: center; gap: 6px; }
                .sq-page-num { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 10px; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 13.5px; font-weight: 700; color: #475569; cursor: pointer; transition: all .2s; }
                .sq-page-num:hover { border-color: #4f46e5; color: #4f46e5; }
                .sq-page-num--active { background: #4f46e5; border-color: #4f46e5; color: #fff; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
                .sq-spinning { cursor: wait; pointer-events: none; }
                .sp-spinner--small { width: 14px; height: 14px; border-width: 2px; }

                /* Tooltip Styles */
                .sq-tooltip-container { position: relative; display: inline-flex; align-items: center; }
                .sq-tooltip-text {
                    visibility: hidden;
                    width: 120px;
                    background-color: #1e293b;
                    color: #fff;
                    text-align: center;
                    border-radius: 6px;
                    padding: 6px 4px;
                    position: absolute;
                    z-index: 1000;
                    bottom: 125%;
                    left: 50%;
                    margin-left: -60px;
                    opacity: 0;
                    transition: opacity 0.2s;
                    font-size: 11px;
                    font-weight: 500;
                    pointer-events: none;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .sq-tooltip-text::after {
                    content: "";
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: #1e293b transparent transparent transparent;
                }
                .sq-tooltip-container:hover .sq-tooltip-text { visibility: visible; opacity: 1; }

                /* Action Button Overrides */
                .sq-approve-btn:hover { background: #ecfdf5 !important; border-color: #10b981 !important; }
                .sq-reject-btn:hover { background: #fef2f2 !important; border-color: #ef4444 !important; }
            `}</style>
        </div>
    );
};
