import { useState } from "react";
import "./SalesPages.css";
import { CreateQuote } from "./CreateQuote.jsx";
import { EditQuote }   from "./EditQuote.jsx";
import { useQuotations } from "../../hooks/useQuotations";
import { getQuoteStatus } from "../../services/quotationService.js";
import quotationService from "../../services/quotationService.js";

const fmt = (v) => v != null ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "—";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

const STATUS_OPTIONS = [
    { value: "DRAFT",    label: "Nháp (Draft)"        },
    { value: "SENT",     label: "Đã gửi (Sent)"       },
    { value: "ACCEPTED", label: "Đã chốt (Accepted)"  },
    { value: "REJECTED", label: "Đã hủy (Rejected)"   },
    { value: "EXPIRED",  label: "Hết hạn (Expired)"   },
];

// ── Status Edit Modal ──────────────────────────────────────
const StatusModal = ({ quote, onClose, onSaved }) => {
    const [status,  setStatus]  = useState(quote.status);
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState(null);

    const handleSave = async () => {
        if (status === quote.status) { onClose(); return; }
        setSaving(true); setError(null);
        try {
            await quotationService.updateStatus(quote.id, status);
            onSaved();
        } catch (e) {
            setError(e.response?.data?.message || "Có lỗi xảy ra");
            setSaving(false);
        }
    };

    const cur = quotationService.getStatus(quote.status);

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

                    <div className="sq-modal__field">
                        <label className="sq-modal__label">Chuyển sang trạng thái mới</label>
                        <div className="sq-status-options">
                            {STATUS_OPTIONS.map(opt => {
                                const s = quotationService.getStatus(opt.value);
                                return (
                                    <button
                                        key={opt.value}
                                        className={`sq-status-opt${status === opt.value ? " sq-status-opt--active" : ""}`}
                                        onClick={() => setStatus(opt.value)}
                                    >
                                        <span className={`sq-badge ${s.cls}`} style={{ pointerEvents: "none" }}>{s.text}</span>
                                        {status === opt.value && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12"/>
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
                    <button className="cf-submit-btn" onClick={handleSave} disabled={saving || status === quote.status}>
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Main Page ──────────────────────────────────────────────
export const SalesQuotes = () => {
    const [view,          setView]          = useState("list");
    const [showCreate,    setShowCreate]    = useState(false);
    const [keyword,       setKeyword]       = useState("");
    const [statusFilter,  setStatusFilter]  = useState("");
    const [page,          setPage]          = useState(0);
    const [editingQuote,  setEditingQuote]  = useState(null);
    const [editingId,     setEditingId]     = useState(null);

    const { data, loading, error, refetch } = useQuotations({
        keyword: keyword || undefined,
        status:  statusFilter || undefined,
        page, size: 10,
    });

    const quotes = data?.content ?? [];
    const total  = data?.totalElements ?? 0;

    if (editingId) return (
        <EditQuote
            quoteId={editingId}
            onBack={() => setEditingId(null)}
            onSaved={() => { setEditingId(null); refetch(); }}
        />
    );

    if (showCreate) return (
        <CreateQuote
            onBack={() => setShowCreate(false)}
            onCreated={() => { setShowCreate(false); refetch(); }}
        />
    );

    return (
        <div className="sp-page">
            {/* Status edit modal */}
            {editingQuote && (
                <StatusModal
                    quote={editingQuote}
                    onClose={() => setEditingQuote(null)}
                    onSaved={() => { setEditingQuote(null); refetch(); }}
                />
            )}

            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Quản lý Báo giá</h1>
                    <p className="sp-sub">Theo dõi quy trình bán hàng và chốt đơn</p>
                </div>
                <div className="sp-header-actions">
                    <div className="sq-view-toggle">
                        <button className={`sq-view-btn${view==="grid"?" sq-view-btn--active":""}`} onClick={() => setView("grid")}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                            </svg>
                        </button>
                        <button className={`sq-view-btn${view==="list"?" sq-view-btn--active":""}`} onClick={() => setView("list")}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                            </svg>
                        </button>
                    </div>
                    <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)}>
                        Tạo báo giá <span className="sp-btn-plus">+</span>
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="sq-toolbar">
                <div className="sq-toolbar__left">
                    <div className="sp-search">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input placeholder="Tìm báo giá hoặc khách hàng..."
                               value={keyword} onChange={e => { setKeyword(e.target.value); setPage(0); }} />
                    </div>
                    <select className="sq-status-filter"
                            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(0); }}>
                        <option value="">Tất cả trạng thái</option>
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>
                <div className="sq-toolbar__right">
                    <div className="sq-stats">
                        <div className="sq-stat">
                            <span className="sq-stat__label">{total} BÁO GIÁ</span>
                            {/*<span className="sq-stat__val">{total}</span>*/}
                        </div>
                    </div>
                </div>
            </div>

            {loading && <div className="sp-state"><div className="sp-spinner"/><span>Đang tải...</span></div>}
            {error && !loading && <div className="sp-state sp-state--error">⚠️ {error}</div>}

            {!loading && !error && (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead>
                        <tr>
                            <th>Mã BG</th>
                            <th>Khách hàng</th>
                            <th>Nhân viên</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Ngày tạo</th>
                            <th>Hiệu lực đến</th>
                            <th>Thao tác</th>
                        </tr>
                        </thead>
                        <tbody>
                        {quotes.length === 0 ? (
                            <tr><td colSpan={8} className="sp-empty-row">
                                <div className="sq-empty"><div className="sq-empty__icon">📋</div><p>Không có báo giá nào</p></div>
                            </td></tr>
                        ) : quotes.map(q => {
                            const s = quotationService.getStatus(q.status);
                            return (
                                <tr key={q.id} className="sp-table__row">
                                    <td><span className="sq-quote-id">{q.quotationNumber}</span></td>
                                    <td className="sp-td--name">{q.customerName}</td>
                                    <td className="sp-td--muted">{q.staffName}</td>
                                    <td className="sp-td--price">{fmt(q.totalAmount)}</td>
                                    <td>
                                        <span className={`sq-badge ${s.cls}`}>{s.text}</span>
                                    </td>
                                    <td className="sp-td--muted">{fmtDate(q.createdDate)}</td>
                                    <td className="sp-td--muted">{fmtDate(q.validUntil)}</td>
                                    <td className="sp-td--actions">
                                        <button className="sp-action-btn" title="Xem chi tiết">
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                            </svg>
                                        </button>
                                        <button className="sp-action-btn" title="Sửa nội dung" onClick={() => setEditingId(q.id)}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>

                    {data?.totalPages > 1 && (
                        <div className="sp-pagination">
                            <span className="sp-pagination__info">{total} báo giá</span>
                            <div className="sp-pagination__right">
                                <button className="sp-page-btn" disabled={page===0} onClick={() => setPage(p => p-1)}>‹</button>
                                {Array.from({length: data.totalPages}, (_, i) => (
                                    <button key={i} className={`sp-page-btn${page===i?" sp-page-btn--active":""}`} onClick={() => setPage(i)}>{i+1}</button>
                                ))}
                                <button className="sp-page-btn" disabled={page===data.totalPages-1} onClick={() => setPage(p => p+1)}>›</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};