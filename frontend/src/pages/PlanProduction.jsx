import {useState, useEffect, useCallback} from "react";
import axios from "axios";

// ── Axios instance với JWT tự động từ localStorage ────────
const api = axios.create();
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    return config;
});

// ── Styles (injected inline) ──────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Be+Vietnam+Pro:wght@300;400;500;600;700&display=swap');

  .wo-root {
    --bg:        #f5f4f0;
    --surface:   #ffffff;
    --surface2:  #f9f8f5;
    --border:    #e4e2db;
    --text:      #1a1916;
    --text-sub:  #6b6860;
    --accent:    #1a6b3c;
    --accent-lt: #e8f5ee;
    --warn:      #b45309;
    --warn-lt:   #fef3c7;
    --danger:    #b91c1c;
    --danger-lt: #fef2f2;
    --mono:      'IBM Plex Mono', monospace;
    --sans:      'Be Vietnam Pro', sans-serif;
    --radius:    8px;
    --shadow:    0 1px 3px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.05);
    --shadow-md: 0 4px 16px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.06);

    font-family: var(--sans);
    background: var(--bg);
    min-height: 100vh;
    color: var(--text);
  }

  /* ── Page layout ── */
  .wo-page { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }

  .wo-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 24px;
  }
  .wo-title  { font-size: 22px; font-weight: 700; letter-spacing: -.4px; margin: 0 0 4px; }
  .wo-sub    { font-size: 13px; color: var(--text-sub); margin: 0; }

  /* ── Toolbar ── */
  .wo-toolbar {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px; flex-wrap: wrap;
  }
  .wo-search {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 7px 12px; flex: 1; min-width: 240px;
    transition: border-color .15s;
  }
  .wo-search:focus-within { border-color: var(--accent); }
  .wo-search input {
    border: none; outline: none; background: transparent;
    font-family: var(--sans); font-size: 13px; color: var(--text); width: 100%;
  }
  .wo-count { font-size: 12px; color: var(--text-sub); white-space: nowrap; }

  /* ── Buttons ── */
  .wo-btn-primary {
    background: var(--accent); color: #fff; border: none;
    border-radius: var(--radius); padding: 9px 16px;
    font-family: var(--sans); font-size: 13px; font-weight: 600;
    cursor: pointer; transition: opacity .15s; white-space: nowrap;
  }
  .wo-btn-primary:hover:not(:disabled) { opacity: .85; }
  .wo-btn-primary:disabled { opacity: .45; cursor: not-allowed; }
  .wo-btn-ghost {
    background: transparent; color: var(--text); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 9px 16px;
    font-family: var(--sans); font-size: 13px; font-weight: 500;
    cursor: pointer; transition: background .15s;
  }
  .wo-btn-ghost:hover { background: var(--surface2); }

  /* ── Table ── */
  .wo-table-wrap {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow);
  }
  .wo-list-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .wo-list-table thead tr {
    background: var(--surface2); border-bottom: 1px solid var(--border);
  }
  .wo-list-table th {
    padding: 10px 14px; text-align: left;
    font-size: 11px; font-weight: 600; letter-spacing: .5px;
    text-transform: uppercase; color: var(--text-sub); white-space: nowrap;
  }
  .wo-list-table td { padding: 11px 14px; border-bottom: 1px solid var(--border); }
  .wo-list-table tbody tr:last-child td { border-bottom: none; }
  .wo-list-table tbody tr:hover { background: var(--surface2); }
  .wo-td--center { text-align: center; }
  .wo-td--customer { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ── Badges ── */
  .wo-order-id {
    font-family: var(--mono); font-size: 12px; font-weight: 600;
    color: var(--accent); background: var(--accent-lt);
    padding: 2px 7px; border-radius: 4px;
  }
  .wo-sku {
    font-family: var(--mono); font-size: 11px; color: var(--text-sub);
    background: var(--surface2); padding: 2px 6px; border-radius: 3px;
  }
  .wo-priority {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 20px; letter-spacing: .3px;
  }
  .wo-pri--low     { background: #f1f5f9; color: #475569; }
  .wo-pri--medium  { background: #eff6ff; color: #1d4ed8; }
  .wo-pri--high    { background: var(--warn-lt); color: var(--warn); }
  .wo-pri--urgent  { background: #fef2f2; color: #dc2626; }

  .wo-status-badge {
    display: inline-block; font-size: 11px; font-weight: 600;
    padding: 2px 8px; border-radius: 20px; letter-spacing: .3px;
  }
  .wo-status--confirmed   { background: #eff6ff; color: #1d4ed8; }
  .wo-status--in-progress { background: var(--warn-lt); color: var(--warn); }
  .wo-status--completed   { background: var(--accent-lt); color: var(--accent); }
  .wo-status--cancelled   { background: #f1f5f9; color: #94a3b8; }

  .wo-days { font-size: 12px; font-weight: 500; }
  .wo-days--warn    { color: var(--warn); font-weight: 600; }
  .wo-days--overdue { color: var(--danger); font-weight: 700; }

  .wo-view-btn {
    background: var(--accent-lt); color: var(--accent); border: none;
    border-radius: 5px; padding: 5px 12px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .wo-view-btn:hover { background: var(--accent); color: #fff; }

  .wo-empty {
    text-align: center; color: var(--text-sub);
    font-size: 13px; padding: 40px !important;
  }

  /* ── Skeleton ── */
  .wo-row--skeleton td { padding: 13px 14px; }
  .wo-skeleton-cell {
    display: block; height: 13px; border-radius: 4px;
    background: linear-gradient(90deg, var(--border) 25%, #f0ede8 50%, var(--border) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.3s infinite;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* ── Error banner ── */
  .wo-error-banner {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--danger-lt); border: 1px solid #fca5a5; color: var(--danger);
    border-radius: var(--radius); padding: 10px 16px; margin-bottom: 12px; font-size: 13px;
  }
  .wo-error-banner button {
    background: var(--danger); color: #fff; border: none;
    border-radius: 5px; padding: 4px 12px; cursor: pointer; font-size: 12px; font-weight: 600;
  }

  /* ── Pagination ── */
  .wo-pagination { display: flex; gap: 6px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
  .wo-page-btn {
    padding: 6px 12px; border-radius: 6px; border: 1px solid var(--border);
    background: var(--surface); cursor: pointer; font-size: 13px; color: var(--text);
    font-family: var(--sans); transition: all .15s;
  }
  .wo-page-btn:hover:not(:disabled) { background: var(--accent); color: #fff; border-color: var(--accent); }
  .wo-page-btn--active { background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 600; }
  .wo-page-btn:disabled { opacity: .4; cursor: not-allowed; }

  /* ── Modal ── */
  .wo-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 999; padding: 20px; backdrop-filter: blur(2px);
  }
  .wo-modal {
    background: var(--surface); border-radius: 12px; width: 100%; max-width: 620px;
    max-height: 90vh; display: flex; flex-direction: column;
    box-shadow: var(--shadow-md); animation: slideUp .2s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  .wo-modal__header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
  }
  .wo-modal__title { font-size: 16px; font-weight: 700; margin: 0 0 4px; }
  .wo-modal__id { font-family: var(--mono); font-size: 12px; color: var(--text-sub); }
  .wo-modal__close {
    background: none; border: none; cursor: pointer; font-size: 18px;
    color: var(--text-sub); line-height: 1; padding: 2px;
  }
  .wo-modal__body { padding: 20px 24px; overflow-y: auto; flex: 1; }
  .wo-modal__footer {
    padding: 16px 24px; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end; gap: 10px;
  }

  /* ── Form ── */
  .wo-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .wo-field { display: flex; flex-direction: column; gap: 5px; }
  .wo-label { font-size: 12px; font-weight: 600; color: var(--text-sub); text-transform: uppercase; letter-spacing: .4px; }
  .wo-input {
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 8px 11px; font-family: var(--sans); font-size: 13px; color: var(--text);
    background: var(--surface); outline: none; transition: border-color .15s;
    width: 100%; box-sizing: border-box;
  }
  .wo-input:focus { border-color: var(--accent); }
  .wo-select {
    border: 1px solid var(--border); border-radius: var(--radius);
    padding: 8px 11px; font-family: var(--sans); font-size: 13px; color: var(--text);
    background: var(--surface); outline: none; cursor: pointer; width: 100%;
  }
  .wo-input--sm { width: 80px; }

  /* ── Items table in modal ── */
  .wo-items-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .wo-add-item {
    background: var(--accent-lt); color: var(--accent); border: none;
    border-radius: 5px; padding: 4px 10px; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .wo-add-item:hover { background: var(--accent); color: #fff; }
  .wo-items-table { border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .wo-items-head {
    display: grid; grid-template-columns: 1fr 100px 80px 32px;
    gap: 8px; padding: 7px 10px;
    background: var(--surface2); font-size: 11px; font-weight: 600;
    color: var(--text-sub); text-transform: uppercase; letter-spacing: .4px;
  }
  .wo-items-row {
    display: grid; grid-template-columns: 1fr 100px 80px 32px;
    gap: 8px; padding: 7px 10px; border-top: 1px solid var(--border); align-items: center;
  }
  .wo-remove-item {
    background: none; border: none; color: #dc2626; cursor: pointer;
    font-size: 14px; padding: 2px; line-height: 1;
  }
  .wo-remove-item:disabled { opacity: .3; cursor: not-allowed; }

  /* ── Detail page ── */
  .wo-detail-header { margin-bottom: 22px; }
  .wo-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
  .wo-breadcrumb-btn {
    background: none; border: none; cursor: pointer; font-size: 13px;
    color: var(--accent); font-family: var(--sans); font-weight: 500; padding: 0;
  }
  .wo-breadcrumb-btn:hover { text-decoration: underline; }
  .wo-breadcrumb-sep { color: var(--text-sub); }
  .wo-breadcrumb-cur { font-size: 13px; color: var(--text-sub); }
  .wo-detail-title { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  .wo-detail-meta { display: flex; gap: 8px; flex-wrap: wrap; }

  .wo-detail-grid {
    display: grid; grid-template-columns: 1fr 260px; gap: 20px; align-items: start;
  }
  @media(max-width:900px) { .wo-detail-grid { grid-template-columns: 1fr; } }

  .wo-detail-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 20px; margin-bottom: 16px;
    box-shadow: var(--shadow);
  }
  .wo-card-title { font-size: 13px; font-weight: 700; margin-bottom: 14px; color: var(--text); }

  .wo-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .wo-info-item { display: flex; flex-direction: column; gap: 3px; }
  .wo-info-item--full { grid-column: 1 / -1; }
  .wo-info-label { font-size: 11px; font-weight: 600; color: var(--text-sub); text-transform: uppercase; letter-spacing: .4px; }
  .wo-info-val { font-size: 13px; color: var(--text); font-weight: 500; }
  .wo-info-val--warn { color: var(--danger); font-weight: 700; }

  .wo-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .wo-table th {
    padding: 8px 10px; text-align: left; font-size: 11px;
    font-weight: 600; text-transform: uppercase; letter-spacing: .4px;
    color: var(--text-sub); border-bottom: 1px solid var(--border);
  }
  .wo-table td { padding: 9px 10px; border-bottom: 1px solid var(--border); }
  .wo-table tbody tr:last-child td { border-bottom: none; }
  .wo-table tfoot td {
    padding: 9px 10px; font-size: 12px;
    border-top: 2px solid var(--border); background: var(--surface2);
  }
  .wo-td--idx { color: var(--text-sub); font-size: 12px; width: 30px; }
  .wo-td--name { font-weight: 500; }

  .wo-summary-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 13px;
  }
  .wo-summary-item:last-child { border-bottom: none; }
  .wo-summary-item span { color: var(--text-sub); }
  .wo-text--warn { color: var(--warn); }
`;

// ── Constants ─────────────────────────────────────────────
const PRIORITY = {
    LOW:    {text: "Thấp",     cls: "wo-pri--low"},
    MEDIUM: {text: "Trung bình", cls: "wo-pri--medium"},
    HIGH:   {text: "Cao",      cls: "wo-pri--high"},
    URGENT: {text: "Ưu tiên",  cls: "wo-pri--urgent"},
};

const STATUS = {
    CONFIRMED:   {text: "Confirmed",   cls: "wo-status--confirmed"},
    IN_PROGRESS: {text: "In Progress", cls: "wo-status--in-progress"},
    COMPLETED:   {text: "Completed",   cls: "wo-status--completed"},
    CANCELLED:   {text: "Cancelled",   cls: "wo-status--cancelled"},
};

const PAGE_SIZE = 10;

// ── Helpers ───────────────────────────────────────────────
const fmtDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN");
};

const fmtCurrency = (n) => {
    if (n == null) return "—";
    return Number(n).toLocaleString("vi-VN") + " ₫";
};

const getDaysRemaining = (d) => {
    if (!d) return null;
    return Math.ceil((new Date(d) - new Date()) / (1000 * 60 * 60 * 24));
};

// priorityLevel: 1 = HIGH, 2 = MEDIUM, 3 = LOW
const getPriorityKey = (level) => {
    if (level === 1) return "HIGH";
    if (level === 2) return "MEDIUM";
    if (level === 3) return "LOW";
    return "MEDIUM";
};

// ── Hook: fetch /production-queue ─────────────────────────
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

            const res = await api.get(`/api/v1/sales-orders/production-queue?${params}`);

            // ResponseObject { status, message, data: Page<SalesOrderDetailResponse> }
            const pageData = res.data?.data;
            setOrders(pageData?.content        ?? []);
            setTotalPages(pageData?.totalPages    ?? 0);
            setTotalElements(pageData?.totalElements ?? 0);
        } catch (err) {
            setError(err.response?.data?.message ?? err.message ?? "Có lỗi xảy ra");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [keyword, page]);

    useEffect(() => { fetchQueue(); }, [fetchQueue]);

    return {orders, totalPages, totalElements, loading, error, refetch: fetchQueue};
};

// ── Skeleton rows ─────────────────────────────────────────
const SkeletonRows = () =>
    Array.from({length: 5}).map((_, i) => (
        <tr key={i} className="wo-row--skeleton">
            {Array.from({length: 9}).map((__, j) => (
                <td key={j}><span className="wo-skeleton-cell"/></td>
            ))}
        </tr>
    ));

// ── Pagination ────────────────────────────────────────────
const Pagination = ({page, totalPages, onChange}) => {
    if (totalPages <= 1) return null;

    // Hiển thị max 7 trang, dùng ellipsis nếu nhiều hơn
    const getPages = () => {
        if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i);
        const pages = [];
        pages.push(0);
        if (page > 3) pages.push("...");
        for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
        if (page < totalPages - 4) pages.push("...");
        pages.push(totalPages - 1);
        return pages;
    };

    return (
        <div className="wo-pagination">
            <button className="wo-page-btn" disabled={page === 0} onClick={() => onChange(page - 1)}>‹ Trước</button>
            {getPages().map((p, i) =>
                p === "..." ? (
                    <span key={`e${i}`} style={{padding: "6px 4px", color: "var(--text-sub)"}}>…</span>
                ) : (
                    <button
                        key={p}
                        className={`wo-page-btn${page === p ? " wo-page-btn--active" : ""}`}
                        onClick={() => onChange(p)}
                    >{p + 1}</button>
                )
            )}
            <button className="wo-page-btn" disabled={page === totalPages - 1} onClick={() => onChange(page + 1)}>Sau ›</button>
        </div>
    );
};

// ── Create Modal ──────────────────────────────────────────
const CreateWOModal = ({onClose, onSave}) => {
    const [form, setForm] = useState({
        orderId:  `WO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900 + 100)).padStart(3, "0")}`,
        customer: "", dueDate: "", priority: "MEDIUM", note: "",
    });
    const [items, setItems] = useState([{product: "", sku: "", quantity: 1}]);

    const setF    = (f, v) => setForm(p => ({...p, [f]: v}));
    const setItem = (i, f, v) => setItems(p => p.map((r, idx) => idx === i ? {...r, [f]: v} : r));
    const addItem = () => setItems(p => [...p, {product: "", sku: "", quantity: 1}]);
    const removeItem = (i) => setItems(p => p.filter((_, idx) => idx !== i));
    const valid = form.customer && form.dueDate && items.some(r => r.product);

    return (
        <div className="wo-overlay" onClick={onClose}>
            <div className="wo-modal" onClick={e => e.stopPropagation()}>
                <div className="wo-modal__header">
                    <div>
                        <h3 className="wo-modal__title">Tạo Work Order mới</h3>
                        <span className="wo-modal__id">{form.orderId}</span>
                    </div>
                    <button className="wo-modal__close" onClick={onClose}>✕</button>
                </div>

                <div className="wo-modal__body">
                    <div className="wo-form-grid">
                        <div className="wo-field">
                            <label className="wo-label">Khách hàng *</label>
                            <input className="wo-input" value={form.customer}
                                   onChange={e => setF("customer", e.target.value)}
                                   placeholder="Tên khách hàng..."/>
                        </div>
                        <div className="wo-field">
                            <label className="wo-label">Ngày hoàn thành *</label>
                            <input className="wo-input" type="date" value={form.dueDate}
                                   onChange={e => setF("dueDate", e.target.value)}/>
                        </div>
                        <div className="wo-field">
                            <label className="wo-label">Độ ưu tiên</label>
                            <select className="wo-select" value={form.priority}
                                    onChange={e => setF("priority", e.target.value)}>
                                <option value="LOW">Thấp</option>
                                <option value="MEDIUM">Trung bình</option>
                                <option value="HIGH">Cao</option>
                                <option value="URGENT">Ưu tiên</option>
                            </select>
                        </div>
                        <div className="wo-field">
                            <label className="wo-label">Ghi chú</label>
                            <input className="wo-input" value={form.note}
                                   onChange={e => setF("note", e.target.value)}
                                   placeholder="Ghi chú..."/>
                        </div>
                    </div>

                    <div className="wo-field" style={{marginTop: 16}}>
                        <div className="wo-items-header">
                            <label className="wo-label">Sản phẩm cần sản xuất</label>
                            <button className="wo-add-item" onClick={addItem}>+ Thêm</button>
                        </div>
                        <div className="wo-items-table">
                            <div className="wo-items-head">
                                <span>Tên sản phẩm</span><span>SKU</span><span>Số lượng</span><span></span>
                            </div>
                            {items.map((row, i) => (
                                <div key={i} className="wo-items-row">
                                    <input className="wo-input" value={row.product}
                                           onChange={e => setItem(i, "product", e.target.value)}
                                           placeholder="Tên sản phẩm..."/>
                                    <input className="wo-input" value={row.sku}
                                           onChange={e => setItem(i, "sku", e.target.value)}
                                           placeholder="SKU"/>
                                    <input className="wo-input wo-input--sm" type="number" min="1" value={row.quantity}
                                           onChange={e => setItem(i, "quantity", Number(e.target.value))}/>
                                    <button className="wo-remove-item" onClick={() => removeItem(i)}
                                            disabled={items.length === 1}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="wo-modal__footer">
                    <button className="wo-btn-ghost" onClick={onClose}>Hủy</button>
                    <button className="wo-btn-primary" disabled={!valid}
                            onClick={() => onSave({...form, items, status: "CONFIRMED", id: Date.now(), details: []})}>
                        Tạo Work Order
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Detail Page ───────────────────────────────────────────
const WorkOrderDetail = ({order, onBack}) => {
    // Map từ SalesOrderDetailResponse
    const priorityKey = getPriorityKey(order.priorityLevel);
    const p           = PRIORITY[priorityKey] || {text: String(order.priorityLevel), cls: ""};
    const s           = STATUS[order.status]  || {text: order.status, cls: ""};
    const totalUnits  = order.details?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ?? 0;
    const days        = getDaysRemaining(order.createdDate);

    return (
        <div className="wo-page">
            <div className="wo-detail-header">
                <div className="wo-breadcrumb">
                    <button className="wo-breadcrumb-btn" onClick={onBack}>← Danh sách</button>
                    <span className="wo-breadcrumb-sep">›</span>
                    <span className="wo-breadcrumb-cur">{order.orderNumber}</span>
                </div>
                <h1 className="wo-detail-title">{order.orderNumber}</h1>
                <div className="wo-detail-meta">
                    <span className={`wo-priority ${p.cls}`}>{p.text}</span>
                    <span className={`wo-status-badge ${s.cls}`}>{s.text}</span>
                    {order.quotationNumber && (
                        <span style={{fontSize: 12, color: "var(--text-sub)"}}>
                            từ báo giá <strong>{order.quotationNumber}</strong>
                        </span>
                    )}
                </div>
            </div>

            <div className="wo-detail-grid">
                {/* ── Left column ── */}
                <div>
                    {/* Thông tin chung */}
                    <div className="wo-detail-card">
                        <div className="wo-card-title">Thông tin chung</div>
                        <div className="wo-info-grid">
                            <div className="wo-info-item">
                                <span className="wo-info-label">Order ID</span>
                                <span className="wo-info-val">
                                    <span className="wo-order-id">{order.orderNumber}</span>
                                </span>
                            </div>
                            <div className="wo-info-item">
                                <span className="wo-info-label">Ngày tạo</span>
                                <span className="wo-info-val">{fmtDate(order.createdDate)}</span>
                            </div>
                            <div className="wo-info-item">
                                <span className="wo-info-label">Trạng thái đơn</span>
                                <span className={`wo-status-badge ${s.cls}`}>{s.text}</span>
                            </div>
                            <div className="wo-info-item">
                                <span className="wo-info-label">Thanh toán</span>
                                <span className="wo-info-val">{order.paymentStatus ?? "—"}</span>
                            </div>
                            <div className="wo-info-item">
                                <span className="wo-info-label">Độ ưu tiên</span>
                                <span className={`wo-priority ${p.cls}`}>{p.text}</span>
                            </div>
                            <div className="wo-info-item">
                                <span className="wo-info-label">Tổng tiền</span>
                                <span className="wo-info-val" style={{fontWeight: 700, color: "var(--accent)"}}>
                                    {fmtCurrency(order.totalAmount)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin khách hàng */}
                    {order.customer && (
                        <div className="wo-detail-card">
                            <div className="wo-card-title">Khách hàng</div>
                            <div className="wo-info-grid">
                                <div className="wo-info-item">
                                    <span className="wo-info-label">Tên</span>
                                    <span className="wo-info-val">{order.customer.name}</span>
                                </div>
                                <div className="wo-info-item">
                                    <span className="wo-info-label">SĐT</span>
                                    <span className="wo-info-val">{order.customer.phone ?? "—"}</span>
                                </div>
                                <div className="wo-info-item">
                                    <span className="wo-info-label">Email</span>
                                    <span className="wo-info-val">{order.customer.email ?? "—"}</span>
                                </div>
                                <div className="wo-info-item">
                                    <span className="wo-info-label">Địa chỉ</span>
                                    <span className="wo-info-val">{order.customer.address ?? "—"}</span>
                                </div>
                                <div className="wo-info-item">
                                    <span className="wo-info-label">Hạn mức tín dụng</span>
                                    <span className="wo-info-val">{fmtCurrency(order.customer.creditLimit)}</span>
                                </div>
                                <div className="wo-info-item">
                                    <span className="wo-info-label">Công nợ hiện tại</span>
                                    <span className={`wo-info-val${order.customer.currentDebt > 0 ? " wo-info-val--warn" : ""}`}>
                                        {fmtCurrency(order.customer.currentDebt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chi tiết sản phẩm — dùng `details` từ SalesOrderDetailResponse */}
                    {order.details?.length > 0 && (
                        <div className="wo-detail-card">
                            <div className="wo-card-title">Sản phẩm cần sản xuất</div>
                            <table className="wo-table">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Sản phẩm</th>
                                    <th>SKU</th>
                                    <th>SL</th>
                                    <th>Đơn giá</th>
                                    <th>CK</th>
                                    <th>Thành tiền</th>
                                </tr>
                                </thead>
                                <tbody>
                                {order.details.map((d, i) => (
                                    <tr key={d.id ?? i}>
                                        <td className="wo-td--idx">{i + 1}</td>
                                        <td className="wo-td--name">{d.productName}</td>
                                        <td><span className="wo-sku">{d.productSku}</span></td>
                                        <td><strong>{d.quantity}</strong></td>
                                        <td>{fmtCurrency(d.unitPrice)}</td>
                                        <td>{d.discount ?? 0}%</td>
                                        <td><strong>{fmtCurrency(d.totalLineAmount)}</strong></td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr>
                                    <td colSpan={3} style={{textAlign: "right", fontWeight: 600}}>Tổng</td>
                                    <td><strong style={{color: "var(--accent)"}}>{totalUnits}</strong></td>
                                    <td colSpan={2}/>
                                    <td><strong style={{color: "var(--accent)"}}>{fmtCurrency(order.totalAmount)}</strong></td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Right sidebar ── */}
                <div>
                    <div className="wo-detail-card">
                        <div className="wo-card-title">Tóm tắt</div>
                        <div className="wo-summary-item">
                            <span>Số loại SP</span>
                            <strong>{order.details?.length ?? 0} loại</strong>
                        </div>
                        <div className="wo-summary-item">
                            <span>Tổng SL</span>
                            <strong>{totalUnits}</strong>
                        </div>
                        <div className="wo-summary-item">
                            <span>Tổng tiền</span>
                            <strong style={{color: "var(--accent)"}}>{fmtCurrency(order.totalAmount)}</strong>
                        </div>
                        <div className="wo-summary-item">
                            <span>Độ ưu tiên</span>
                            <strong><span className={`wo-priority ${p.cls}`}>{p.text}</span></strong>
                        </div>
                        <div className="wo-summary-item">
                            <span>Trạng thái TT</span>
                            <strong>{order.paymentStatus ?? "—"}</strong>
                        </div>
                        {days != null && (
                            <div className="wo-summary-item">
                                <span>Ngày tạo</span>
                                <strong>{fmtDate(order.createdDate)}</strong>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Main component ────────────────────────────────────────
export const PlanProduction = () => {
    const [search,         setSearch]         = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page,           setPage]           = useState(0);
    const [showCreate,     setShowCreate]     = useState(false);
    const [viewOrder,      setViewOrder]      = useState(null);

    // Debounce search 400ms
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(0);
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    const {orders, totalPages, totalElements, loading, error, refetch} =
        useProductionQueue(debouncedSearch, page);

    // Inject CSS một lần
    useEffect(() => {
        const id = "wo-styles";
        if (!document.getElementById(id)) {
            const tag = document.createElement("style");
            tag.id = id;
            tag.textContent = css;
            document.head.appendChild(tag);
        }
        return () => {}; // giữ lại style khi unmount (dùng chung)
    }, []);

    if (viewOrder) {
        return (
            <div className="wo-root">
                <WorkOrderDetail order={viewOrder} onBack={() => setViewOrder(null)}/>
            </div>
        );
    }

    return (
        <div className="wo-root">
            <div className="wo-page">
                {/* Header */}
                <div className="wo-header">
                    <div>
                        <h1 className="wo-title">Execute Work Order</h1>
                        <p className="wo-sub">Quản lý và theo dõi lệnh sản xuất</p>
                    </div>
                    <button className="wo-btn-primary" onClick={() => setShowCreate(true)}>
                        + Tạo Work Order
                    </button>
                </div>

                {/* Toolbar */}
                <div className="wo-toolbar">
                    <div className="wo-search">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            placeholder="Tìm theo Order ID hoặc khách hàng..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <span className="wo-count">
                        {loading ? "Đang tải..." : `${totalElements} work orders`}
                    </span>
                </div>

                {/* Error */}
                {error && (
                    <div className="wo-error-banner">
                        <span>⚠ {error}</span>
                        <button onClick={refetch}>Thử lại</button>
                    </div>
                )}

                {/* Table */}
                <div className="wo-table-wrap">
                    <table className="wo-list-table">
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Khách hàng</th>
                            <th>Số loại SP</th>
                            <th>Số lượng</th>
                            <th>Ngày tạo</th>
                            <th>Tổng tiền</th>
                            <th>Độ ưu tiên</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <SkeletonRows/>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={9} className="wo-empty">Không có dữ liệu</td></tr>
                        ) : orders.map((o) => {
                            // ── Map đúng field SalesOrderDetailResponse ──
                            const priorityKey = getPriorityKey(o.priorityLevel);
                            const p           = PRIORITY[priorityKey] || {text: String(o.priorityLevel), cls: ""};
                            const s           = STATUS[o.status]      || {text: o.status, cls: ""};
                            const totalUnits  = o.details?.reduce((sum, d) => sum + (d.quantity ?? 0), 0) ?? 0;

                            return (
                                <tr key={o.id} className="wo-row">
                                    <td><span className="wo-order-id">{o.orderNumber}</span></td>
                                    <td className="wo-td--customer">{o.customer?.name ?? "—"}</td>
                                    <td className="wo-td--center">{o.details?.length ?? 0} loại</td>
                                    <td className="wo-td--center">{totalUnits}</td>
                                    <td>{fmtDate(o.createdDate)}</td>
                                    <td style={{fontWeight: 600}}>{fmtCurrency(o.totalAmount)}</td>
                                    <td><span className={`wo-priority ${p.cls}`}>{p.text}</span></td>
                                    <td><span className={`wo-status-badge ${s.cls}`}>{s.text}</span></td>
                                    <td>
                                        <button className="wo-view-btn" onClick={() => setViewOrder(o)}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                <Pagination page={page} totalPages={totalPages} onChange={setPage}/>
            </div>

            {showCreate && (
                <CreateWOModal
                    onClose={() => setShowCreate(false)}
                    onSave={() => {
                        setShowCreate(false);
                        refetch();
                    }}
                />
            )}
        </div>
    );
};