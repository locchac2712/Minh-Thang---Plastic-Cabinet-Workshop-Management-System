import { useState, useRef, useEffect } from "react";
import "./SalesPages.css";
import { CreateQuoteModal } from "./CreateQuoteModal.jsx";
import { EditQuoteModal } from "./EditQuoteModal.jsx";
import { ViewQuoteModal } from "./ViewQuoteModal.jsx";
import { useQuotations } from "../../hooks/useQuotations";
import { getQuoteStatus } from "../../services/quotationService.js";
import quotationService from "../../services/quotationService.js";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const STATUS_OPTIONS = [
    { value: "DRAFT", label: "Bản nháp" },
    { value: "SENT", label: "Đã gửi" },
    { value: "ACCEPTED", label: "Đã chốt" },
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

// ── Hàm gọi API tạo đơn từ báo giá ───────────────────────
const createOrderFromQuotation = async (quotationId) => {
    const res = await api.post(
        `/sales-orders/from-quotation/${quotationId}`,
        {}
    );
    const body = res.data;
    if (body.status !== "SUCCESS") throw new Error(body.message || "Tao don that bai");
    return body.data;
};

// ── Toast thông báo nhỏ ───────────────────────────────────
const Toast = ({ msg, type, onClose }) => (
    <div className={`sq-toast sq-toast--${type}`}>
        <span>{msg}</span>
        <button onClick={onClose}>✕</button>
    </div>
);

// ── Print Preview Popup (for list page) ───────────────────
const ListPrintPreview = ({ quoteId, onClose }) => {
    const printRef = useRef(null);
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        quotationService.getById(quoteId)
            .then(res => setQuote(res))
            .catch(err => console.error("Lỗi tải:", err))
            .finally(() => setLoading(false));
    }, [quoteId]);

    const handlePrint = () => {
        const content = printRef.current;
        const win = window.open("", "_blank", "width=800,height=600");
        win.document.write(`
            <html><head><title>Báo giá ${quote.quotationNumber}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #111; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #111; padding-bottom: 20px; }
                .header h1 { font-size: 22px; margin-bottom: 4px; }
                .header .code { font-size: 14px; color: #666; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
                .info-block label { font-size: 11px; color: #888; display: block; margin-bottom: 2px; }
                .info-block div { font-size: 14px; font-weight: 500; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
                th { background: #f5f5f5; text-align: left; padding: 8px 12px; font-size: 12px; border: 1px solid #ddd; }
                td { padding: 8px 12px; font-size: 13px; border: 1px solid #ddd; }
                .total-row { text-align: right; font-size: 16px; font-weight: 700; margin-top: 8px; }
                .note { margin-top: 20px; padding: 12px; background: #fffbe6; border: 1px solid #ffe58f; font-size: 13px; }
                @media print { body { padding: 20px; } }
            </style></head><body>${content.innerHTML}</body></html>
        `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
    };

    if (loading) {
        return (
            <div className="sq-modal-overlay" style={{ zIndex: 9999 }} onClick={onClose}>
                <div className="sq-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 40, textAlign: "center" }}>
                    <div className="sp-spinner" style={{ margin: "0 auto 12px" }} />
                    <span>Đang tải dữ liệu...</span>
                </div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="sq-modal-overlay" style={{ zIndex: 9999 }} onClick={onClose}>
                <div className="sq-modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 40, textAlign: "center" }}>
                    <span>⚠️ Không tải được dữ liệu</span>
                    <button className="sq-modal-btn sq-modal-btn--cancel" style={{ marginTop: 16 }} onClick={onClose}>Đóng</button>
                </div>
            </div>
        );
    }

    const details = quote.details || [];
    const subTotal = details.reduce((s, d) => s + (d.quantity * Number(d.unitPrice)), 0);
    const totalDiscount = details.reduce((s, d) => s + Number(d.discount || 0), 0);

    return (
        <div className="sq-modal-overlay" style={{ zIndex: 9999 }} onClick={onClose}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                <div className="sq-modal-header">
                    <div className="sq-modal-title-group">
                        <h2 className="sq-modal-title">Xem trước khi in</h2>
                    </div>
                    <button className="sq-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="sq-modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                    <div ref={printRef}>
                        <div className="header">
                            <h1>BÁO GIÁ</h1>
                            <div className="code">{quote.quotationNumber}</div>
                        </div>
                        <div className="info-grid">
                            <div className="info-block"><label>Khách hàng</label><div>{quote.customer?.name}</div></div>
                            <div className="info-block"><label>Ngày tạo</label><div>{fmtDate(quote.createdDate)}</div></div>
                            <div className="info-block"><label>Nhân viên</label><div>{quote.staff?.fullname}</div></div>
                            <div className="info-block"><label>Hiệu lực đến</label><div>{fmtDate(quote.validUntil)}</div></div>
                        </div>
                        <table>
                            <thead><tr><th>STT</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Chiết khấu</th><th style={{textAlign:"right"}}>Thành tiền</th></tr></thead>
                            <tbody>
                                {details.map((d, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}</td>
                                        <td>{d.productName}</td>
                                        <td>{d.quantity}</td>
                                        <td>{fmt(d.unitPrice)}</td>
                                        <td>{d.discountPercent || 0}%</td>
                                        <td style={{textAlign:"right"}}>{fmt(d.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalDiscount > 0 && (
                            <div style={{textAlign:"right", fontSize:"14px", color:"#666", marginBottom: 4}}>
                                Tạm tính: {fmt(subTotal)} | Chiết khấu: -{fmt(totalDiscount)}
                            </div>
                        )}
                        <div className="total-row">Tổng cộng: {fmt(quote.totalAmount)}</div>
                        {quote.note && <div className="note"><strong>Ghi chú:</strong> {quote.note}</div>}
                    </div>
                </div>
                <div className="sq-modal-footer">
                    <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                    <button className="sq-modal-btn sq-modal-btn--submit" onClick={handlePrint}>
                        In báo giá
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Status Edit Modal ──────────────────────────────────────
const StatusModal = ({ quote, onClose, onSaved }) => {
    const [status, setStatus] = useState(quote.status);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSave = async () => {
        if (status === quote.status) { onClose(); return; }
        setSaving(true);
        setError(null);
        try {
            await quotationService.updateStatus(quote.id, status);
            if (status === "ACCEPTED") {
                try {
                    const order = await createOrderFromQuotation(quote.id);
                    onSaved({ createdOrder: order });
                } catch (orderErr) {
                    const msg = orderErr.response?.data?.message || orderErr.message || "";
                    if (msg.includes("đã tồn tại") || msg.includes("đã tạo")) {
                        onSaved({ alreadyExists: true });
                    } else {
                        onSaved({ orderError: msg });
                    }
                }
            } else {
                onSaved({});
            }
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
            setSaving(false);
        }
    };

    const cur = getQuoteStatus(quote.status);

    return (
        <div className="sq-modal-overlay" onClick={onClose}>
            <div className="sq-modal" onClick={e => e.stopPropagation()}>
                <div className="sq-modal__header">
                    <div>
                        <h3 className="sq-modal__title">Cập nhật trạng thái</h3>
                        <span className="sq-modal__sub">{quote.quotationNumber} · {quote.customerName}</span>
                    </div>
                    <button className="sq-modal__close" onClick={onClose}>✕</button>
                </div>

                <div className="sq-modal__body">
                    <div className="sq-modal__current">
                        <span className="sq-modal__current-label">Trạng thái hiện tại:</span>
                        <span className={`sq-badge ${cur.cls}`}>{cur.text}</span>
                    </div>

                    {status === "ACCEPTED" && quote.status !== "ACCEPTED" && (
                        <div className="sq-modal__warn">
                            📦 Khi chốt báo giá, hệ thống sẽ <strong>tự động tạo đơn bán hàng</strong> từ báo giá này.
                        </div>
                    )}

                    <div className="sq-modal__field">
                        <label className="sq-modal__label">Chuyển sang trạng thái mới</label>
                        <div className="sq-status-options">
                            {STATUS_OPTIONS.map(opt => {
                                const s = getQuoteStatus(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        className={`sq-status-opt${status === opt.value ? " sq-status-opt--active" : ""}`}
                                        onClick={() => setStatus(opt.value)}
                                    >
                                        <span className={`sq-badge ${s.cls}`} style={{ pointerEvents: "none" }}>{s.text}</span>
                                        {status === opt.value && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {error && <div className="sq-modal__error">⚠️ {error}</div>}
                </div>

                <div className="sq-modal__footer">
                    <button className="cf-back-btn" onClick={onClose}>Hủy</button>
                    <button
                        className="cf-submit-btn"
                        onClick={handleSave}
                        disabled={saving || status === quote.status}
                    >
                        {saving
                            ? (status === "ACCEPTED" ? "Đang tạo đơn hàng..." : "Đang lưu...")
                            : "Lưu thay đổi"
                        }
                    </button>
                </div>
            </div>

            <style>{`
                .sq-modal__warn {
                    margin: 12px 0 0;
                    padding: 10px 14px;
                    border-radius: 10px;
                    background: #fefce8;
                    border: 1.5px solid #fde047;
                    color: #854d0e;
                    font-size: 13px;
                    line-height: 1.5;
                }
            `}</style>
        </div>
    );
};

// ── Custom Status Select ──────────────────────────────────
const CustomStatusSelect = ({ value, onChange, options, placeholder = "Chọn..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapRef = useRef(null);
    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div className="sq-custom-select" ref={wrapRef}>
            <div className={`sq-select-trigger${isOpen ? " sq-select-trigger--open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                <span style={{ fontFamily: "'Inter', sans-serif" }}>{selected ? selected.label : placeholder}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
            {isOpen && (
                <div className="sq-select-popup">
                    {options.map(o => (
                        <div
                            key={o.value}
                            className={`sq-select-item${value === o.value ? " sq-select-item--active" : ""}`}
                            onClick={() => { onChange(o.value); setIsOpen(false); }}
                            style={{ fontFamily: "'Inter', sans-serif" }}
                        >
                            {o.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Custom Date Range Picker (Fixed - no onBlur bug) ─────
const CustomDateRangePicker = ({ start, end, onStartChange, onEndChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const wrapRef = useRef(null);

    // Use mousedown outside to close — prevents the onBlur bug
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const formatDate = (dStr) => {
        if (!dStr) return "";
        const d = new Date(dStr);
        return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;
    };

    const handleDayClick = (dayStr) => {
        if (!start || (start && end)) {
            onStartChange(dayStr);
            onEndChange("");
        } else {
            if (new Date(dayStr) < new Date(start)) {
                onStartChange(dayStr);
                onEndChange("");
            } else {
                onEndChange(dayStr);
                setIsOpen(false);
            }
        }
    };

    const handlePrevMonth = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        setViewDate(new Date(year, month - 1));
    };

    const handleNextMonth = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        setViewDate(new Date(year, month + 1));
    };

    const renderCalendar = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i).toISOString().split("T")[0]);

        return (
            <div className="sq-calendar">
                <div className="sq-cal-header">
                    <button type="button" onMouseDown={handlePrevMonth}>&lt;</button>
                    <span>Tháng {month + 1}, {year}</span>
                    <button type="button" onMouseDown={handleNextMonth}>&gt;</button>
                </div>
                <div className="sq-cal-grid">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map(d => <div key={d} className="sq-cal-day-head">{d}</div>)}
                    {days.map((d, index) => {
                        if (!d) return <div key={`empty-${index}`} />;
                        const isStart = d === start;
                        const isEnd = d === end;
                        const inRange = start && end && new Date(d) > new Date(start) && new Date(d) < new Date(end);
                        return (
                            <div
                                key={d}
                                className={`sq-cal-day${isStart ? " sq-cal-day--start" : ""}${isEnd ? " sq-cal-day--end" : ""}${inRange ? " sq-cal-day--range" : ""}`}
                                onMouseDown={(e) => { e.preventDefault(); handleDayClick(d); }}
                            >
                                {new Date(d).getDate()}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="sq-custom-select" ref={wrapRef}>
            <div className={`sq-select-trigger${isOpen ? " sq-select-trigger--open" : ""}`} onClick={() => setIsOpen(!isOpen)}>
                <span style={{ fontFamily: "'Inter', sans-serif" }}>
                    {start ? `${formatDate(start)}${end ? ` - ${formatDate(end)}` : " - ..."}` : "Từ ngày - Đến ngày"}
                </span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            </div>
            {isOpen && (
                <div className="sq-select-popup sq-select-popup--calendar">
                    {renderCalendar()}
                </div>
            )}
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────
export const SalesQuotes = () => {
    const { hasRole } = useAuth();
    const isDirector = hasRole("DIRECTOR");

    const [view, setView] = useState("list");
    const [showCreate, setShowCreate] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [page, setPage] = useState(0);
    const [editingQuote, setEditingQuote] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [viewingId, setViewingId] = useState(null);
    const [printingId, setPrintingId] = useState(null);
    const [toast, setToast] = useState(null);

    // New filter states
    const [showFilters, setShowFilters] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [priceRangeId, setPriceRangeId] = useState("all");

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000);
    };

    const handleClearFilters = () => {
        setKeyword("");
        setStatusFilter("");
        setStartDate("");
        setEndDate("");
        setPriceRangeId("all");
        setPage(0);
    };

    const pRange = PRICE_RANGE_MAP[priceRangeId] || PRICE_RANGE_MAP.all;

    const { data, loading, error, refetch } = useQuotations({
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        minAmount: pRange.min,
        maxAmount: pRange.max,
        page, size: 10,
    });

    const quotes = data?.content ?? [];
    const total = data?.totalElements ?? 0;

    const handleStatusSaved = (result = {}) => {
        setEditingQuote(null);
        refetch();

        if (result.createdOrder) {
            showToast(
                `✅ Đã chốt báo giá và tạo đơn hàng ${result.createdOrder?.orderNumber || result.createdOrder?.order_number || ""} thành công!`,
                "success"
            );
        } else if (result.alreadyExists) {
            showToast("ℹ️ Đơn hàng từ báo giá này đã được tạo trước đó.", "info");
        } else if (result.orderError) {
            showToast(`⚠️ Cập nhật trạng thái thành công nhưng tạo đơn thất bại: ${result.orderError}`, "warn");
        }
    };

    return (
        <div className="sp-page">
            {/* Toast */}
            {toast && (
                <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Status modal */}
            {editingQuote && (
                <StatusModal
                    quote={editingQuote}
                    onClose={() => setEditingQuote(null)}
                    onSaved={handleStatusSaved}
                />
            )}

            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Danh sách báo giá</h1>
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
                            <input placeholder="Tìm mã báo giá hoặc tên khách hàng"
                                value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                            <button
                                className={`sq-filter-toggle${showFilters ? " sq-filter-toggle--active" : ""}`}
                                onClick={() => setShowFilters(!showFilters)}
                                title="Bộ lọc nâng cao"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>

                            </button>
                        </div>
                    </div>
                </div>
                <div className="sq-toolbar__right">
                    <div className="sp-header-actions">
                        <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)}>
                            Tạo báo giá
                            <span className="sp-btn-plus">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="sq-filter-panel">
                    <div className="sq-f-group">
                        <label className="sq-f-label" style={{ fontFamily: "'Inter', sans-serif" }}>Trạng thái</label>
                        <CustomStatusSelect
                            value={statusFilter}
                            options={[{ value: "", label: "Tất cả trạng thái" }, ...STATUS_OPTIONS]}
                            onChange={val => { setStatusFilter(val); setPage(0); }}
                        />
                    </div>
                    
                    <div className="sq-f-group">
                        <label className="sq-f-label" style={{ fontFamily: "'Inter', sans-serif" }}>Ngày hiệu lực</label>
                        <CustomDateRangePicker 
                            start={startDate} 
                            end={endDate}
                            onStartChange={v => { setStartDate(v); setPage(0); }}
                            onEndChange={v => { setEndDate(v); setPage(0); }}
                        />
                    </div>

                    <div className="sq-f-group">
                        <label className="sq-f-label" style={{ fontFamily: "'Inter', sans-serif" }}>Giá trị báo giá</label>
                        <CustomStatusSelect
                            value={priceRangeId}
                            options={PRICE_RANGE_OPTIONS}
                            onChange={val => { setPriceRangeId(val); setPage(0); }}
                            placeholder="Tất cả giá trị"
                        />
                    </div>

                    <div className="sq-f-group sq-f-group--btns">
                        <label className="sq-f-label" style={{ fontFamily: "'Inter', sans-serif" }}>&nbsp;</label>
                        <button className="sq-btn-clear" onClick={handleClearFilters} style={{ fontFamily: "'Inter', sans-serif" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            {loading && <div className="sp-state"><div className="sp-spinner" /><span>Đang tải...</span></div>}
            {error && !loading && <div className="sp-state sp-state--error">⚠️ {error}</div>}

            {!loading && !error && (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead className="sq-table-head">
                            <tr>
                                <th>Mã BG</th>
                                <th>Khách hàng</th>
                                {isDirector && <th>Nhân viên</th>}
                                <th>Tổng tiền</th>
                                <th>Trạng thái</th>
                                <th>Hiệu lực đến</th>
                                <th style={{ textAlign: "center" }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quotes.length === 0 ? (
                                <tr><td colSpan={isDirector ? 7 : 6} className="sp-empty-row">
                                    <div className="sq-empty">
                                        <div className="sq-empty__icon">📋</div>
                                        <p>Không có báo giá nào</p>
                                    </div>
                                </td></tr>
                            ) : quotes.map(q => {
                                const s = getQuoteStatus(q.status);
                                const statusLabel = STATUS_OPTIONS.find(o => o.value === q.status)?.label || q.status;
                                
                                return (
                                    <tr key={q.id} className="sp-table__row">
                                        <td><span className="sq-quote-id">{q.quotationNumber}</span></td>
                                        <td className="sp-td--name">{q.customerName}</td>
                                        {isDirector && <td className="sp-td--muted">{q.staffName || "—"}</td>}
                                        <td className="sp-td--price">{fmt(q.totalAmount)}</td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span 
                                                    className={`sq-badge ${s.cls}`}
                                                    onClick={() => setEditingQuote(q)}
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    {statusLabel}
                                                </span>
                                                {q.status === "ACCEPTED" && q.hasOrder && (
                                                    <span className="sq-has-order-tag">📦 Có đơn</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="sp-td--muted">{fmtDate(q.validUntil)}</td>
                                        <td>
                                            <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                                {q.status === "DRAFT" && (
                                                    <button className="sp-action-btn" title="In báo giá" onClick={() => setPrintingId(q.id)}>
                                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                                            <rect x="6" y="14" width="12" height="8" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button 
                                                    className="sp-action-btn" 
                                                    title="Xem chi tiết"
                                                    onClick={() => setViewingId(q.id)}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {total > 0 && (
                        <div className="sp-pagination">
                            <div className="sp-pagination__left">
                                Hiển thị <b>{(page * 10) + 1} - {Math.min((page + 1) * 10, total)}</b> trong tổng số <b>{total}</b> báo giá
                            </div>
                            <div className="sp-pagination__right">
                                <button 
                                    className="sp-page-btn" 
                                    disabled={page === 0}
                                    onClick={() => setPage(page - 1)}
                                >
                                    &lt;
                                </button>
                                {[...Array(data?.totalPages || 0)].map((_, i) => (
                                    <button 
                                        key={i}
                                        className={`sp-page-btn${page === i ? " sp-page-btn--active" : ""}`}
                                        onClick={() => setPage(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button 
                                    className="sp-page-btn" 
                                    disabled={page >= (data?.totalPages || 1) - 1}
                                    onClick={() => setPage(page + 1)}
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showCreate && (
                <CreateQuoteModal 
                    onClose={() => setShowCreate(false)} 
                    onCreated={() => { setShowCreate(false); refetch(); }}
                />
            )}

            {editingId && (
                <EditQuoteModal 
                    quoteId={editingId} 
                    onClose={() => setEditingId(null)} 
                    onSaved={() => { setEditingId(null); refetch(); }}
                />
            )}

            {viewingId && (
                <ViewQuoteModal 
                    quoteId={viewingId} 
                    onClose={() => setViewingId(null)}
                    onSaved={() => { refetch(); }}
                />
            )}

            {/* Print Preview Popup — opened from list print button */}
            {printingId && (
                <ListPrintPreview
                    quoteId={printingId}
                    onClose={() => setPrintingId(null)}
                />
            )}

            <style>{`
                .sq-toast {
                    position: fixed; top: 20px; right: 24px; z-index: 9999;
                    padding: 12px 16px; border-radius: 12px;
                    display: flex; align-items: center; gap: 10px;
                    font-size: 13px; font-weight: 600;
                    box-shadow: 0 8px 24px rgba(0,0,0,.15);
                    animation: toastIn .25s ease;
                    max-width: 420px;
                }
                @keyframes toastIn { from{transform:translateX(40px);opacity:0} to{transform:none;opacity:1} }
                .sq-toast--success { background: #f0fdf4; color: #15803d; border: 1.5px solid #bbf7d0; }
                .sq-toast--info    { background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; }
                .sq-toast--warn    { background: #fefce8; color: #854d0e; border: 1.5px solid #fde047; }
                .sq-toast button   {
                    background: none; border: none; cursor: pointer;
                    font-size: 14px; color: inherit; opacity: .6; margin-left: auto;
                }
                .sq-toast button:hover { opacity: 1; }
                .sq-has-order-tag {
                    display: inline-block; margin-left: 6px;
                    padding: 1px 7px; border-radius: 99px;
                    background: #eff6ff; color: #1d4ed8;
                    font-size: 10px; font-weight: 700; vertical-align: middle;
                }
            `}</style>
        </div>
    );
};