import React, { useState, useEffect, useRef } from "react";
import "./SalesPages.css";
import customerService from "../../services/customerService";
import { AddCustomer } from "./AddCustomer";
import { EditCustomer } from "./EditCustomer";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + "đ" : "0đ";

// Reuse the CustomStatusSelect from Quotations!
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
                    <div className={`sq-select-item${value === "ALL" ? " sq-select-item--active" : ""}`} onClick={() => { onChange("ALL"); setIsOpen(false); }}>
                        <span>Tất cả</span>
                    </div>
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

const TooltipWrapper = ({ children, text }) => (
    <div className="sq-tooltip-container">
        {children}
        <span className="sq-tooltip-text">{text}</span>
    </div>
);

export const SalesCustomers = ({ onNavigate }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [areaFilter, setAreaFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [showFilters, setShowFilters] = useState(false);

    // Modal state
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const activeParam = statusFilter === "ALL" ? undefined : (statusFilter === "ACTIVE");
            const data = await customerService.getAll(activeParam);
            setCustomers(data);
        } catch (e) {
            setError("Lỗi: " + (e.response?.data?.message || "Không thể tải danh sách khách hàng"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCustomers();
    }, [statusFilter]);

    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Bạn có chắc muốn ${currentStatus ? "ngừng hoạt động" : "khôi phục"} khách hàng này?`)) return;
        try {
            await customerService.changeStatus(id, !currentStatus);
            loadCustomers();
        } catch (e) {
            alert("Lỗi khi cập nhật trạng thái");
        }
    };

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("ALL");
        setAreaFilter("ALL");
        setTypeFilter("ALL");
    };

    const filtered = customers.filter(c => {
        const matchSearch = (c.name?.toLowerCase() || "").includes(search.toLowerCase()) || 
                            (c.taxCode?.toLowerCase() || "").includes(search.toLowerCase()) || 
                            (c.phoneNumber?.toLowerCase() || "").includes(search.toLowerCase());
        const matchStatus = statusFilter === "ALL" || (statusFilter === "ACTIVE" ? c.active : !c.active);
        const matchArea = areaFilter === "ALL" || c.area === areaFilter;
        const matchType = typeFilter === "ALL" || c.customerType === typeFilter;
        return matchSearch && matchStatus && matchArea && matchType;
    });

    const TYPE_OPTIONS = [
        { value: "DISTRIBUTOR", label: "Đại lý cấp 1" },
        { value: "DISTRIBUTOR2", label: "Đại lý cấp 2" },
        { value: "RETAIL", label: "Bán lẻ" },
        { value: "PROJECT", label: "Dự án" }
    ];

    const AREA_OPTIONS = [
        { value: "NORTH", label: "Miền Bắc" },
        { value: "CENTRAL", label: "Miền Trung" },
        { value: "SOUTH", label: "Miền Nam" }
    ];

    const STATUS_OPTIONS = [
        { value: "ACTIVE", label: "Đang hoạt động", color: "#10b981" },
        { value: "INACTIVE", label: "Ngừng hoạt động", color: "#ef4444" }
    ];

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Danh sách Khách hàng</h1>
                </div>
            </div>

            <div className="sq-toolbar-wrap">
                <div className="sp-search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                    <input placeholder="Tìm mã, tên, số điện thoại..." value={search} onChange={e => setSearch(e.target.value)} />
                    <button className={`sq-filter-toggle${showFilters ? " sq-filter-toggle--active" : ""}`} onClick={() => setShowFilters(!showFilters)} title="Lọc nâng cao">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                    </button>
                </div>
                <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)} title="Thêm khách hàng">
                    Thêm khách hàng
                    <span className="sp-btn-plus">+</span>
                </button>
            </div>

            {showFilters && (
                <div className="sq-filter-panel">
                    <div className="sq-f-group"><label className="sq-f-label">Nhóm khách hàng</label><CustomStatusSelect value={typeFilter} options={TYPE_OPTIONS} onChange={setTypeFilter} /></div>
                    <div className="sq-f-group"><label className="sq-f-label">Khu vực</label><CustomStatusSelect value={areaFilter} options={AREA_OPTIONS} onChange={setAreaFilter} /></div>
                    <div className="sq-f-group"><label className="sq-f-label">Trạng thái</label><CustomStatusSelect value={statusFilter} options={STATUS_OPTIONS} onChange={setStatusFilter} /></div>
                    <div className="sq-f-group sq-f-group--btns"><label className="sq-f-label">&nbsp;</label><button className="sq-btn-clear" onClick={clearFilters} title="Xóa bộ lọc">✕</button></div>
                </div>
            )}

            {error ? (
                <div className="sp-state sp-state--error">{error}</div>
            ) : (
                <div className="sp-card">
                    <table className="sp-table">
                        <thead className="sq-table-head">
                            <tr>
                                <th>MÃ KH</th>
                                <th>KHÁCH HÀNG</th>
                                <th>SĐT / EMAIL</th>
                                <th>NHÓM</th>
                                <th>TRẠNG THÁI</th>
                                <th>CÔNG NỢ</th>
                                <th style={{ textAlign: "center" }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="sp-empty-row"><div className="sq-empty">Đang tải...</div></td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={7} className="sp-empty-row"><div className="sq-empty">Không tìm thấy khách hàng nào</div></td></tr>
                            ) : filtered.map(c => {
                                const typeLabel = TYPE_OPTIONS.find(t => t.value === c.customerType)?.label || "Chưa phân loại";
                                return (
                                    <tr key={c.id} className="sp-table__row">
                                        <td><span className="sq-quote-id">{c.taxCode || "—"}</span></td>
                                        <td>
                                            <div className="sp-td--name">{c.name}</div>
                                            {c.address && <div className="sp-td--muted" style={{fontSize: 12, marginTop: 4}}>{c.address}</div>}
                                        </td>
                                        <td className="sp-td--muted">{c.phoneNumber || "—"}<br/><small>{c.email || ""}</small></td>
                                        <td className="sp-td--muted">{typeLabel}</td>
                                        <td>
                                            <span className={`sq-badge`} style={{ backgroundColor: c.active ? "#10b981" : "#ef4444", color: "#fff" }}>
                                                {c.active ? "Hoạt động" : "Ngừng HĐ"}
                                            </span>
                                        </td>
                                        <td className="sp-td--price">{fmt(c.creditLimit)}</td>
                                        <td>
                                            <div className="sp-td--actions" style={{justifyContent:"center"}}>
                                                <TooltipWrapper text="Xem chi tiết">
                                                    <button className="sp-action-btn" onClick={() => onNavigate('customer-detail', c.id)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                                    </button>
                                                </TooltipWrapper>

                                                <TooltipWrapper text="Chỉnh sửa">
                                                    <button className="sp-action-btn" onClick={() => setEditingId(c.id)}>
                                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                    </button>
                                                </TooltipWrapper>

                                                <TooltipWrapper text={c.active ? "Ngừng hoạt động" : "Khôi phục"}>
                                                    <button className="sp-action-btn sq-reject-btn" style={{borderColor: c.active ? '#fecaca' : '#bbf7d0'}} onClick={() => handleToggleStatus(c.id, c.active)}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.active ? "#dc2626" : "#059669"} strokeWidth="2.5">
                                                            {c.active ? (
                                                                <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></>
                                                            ) : (
                                                                <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>
                                                            )}
                                                        </svg>
                                                    </button>
                                                </TooltipWrapper>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                    <div className="sq-table-foot">
                        <div className="sq-foot-info">
                            Hiển thị <strong>{filtered.length}</strong> trong tổng số <strong>{filtered.length}</strong> khách hàng
                        </div>
                    </div>
                </div>
            )}

            {showCreate && <AddCustomer onBack={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); loadCustomers(); }} />}
            {editingId && <EditCustomer customerId={editingId} onBack={() => setEditingId(null)} onSaved={() => { setEditingId(null); loadCustomers(); }} />}

            <style>{`
                .sq-toolbar-wrap { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
                .sq-toolbar-wrap .sp-search { flex: 1; }
                .sp-table__row { transition: background 0.2s; cursor: default; }
                .sp-table__row:hover { background: #f8fafc; }
                .sp-table td { padding: 16px 20px; vertical-align: middle; }
                .sq-empty { padding: 60px 0; text-align: center; color: #9ca3af; font-size: 14px; }
                .sq-btn-clear { background: #f3f4f6; border: 1.5px solid #e5e7eb; border-radius: 10px; width: 38px; height: 38px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #6b7280; transition: all .15s; }
                .sq-btn-clear:hover { background: #e5e7eb; color: #111827; }
                .sq-table-head th { color: #475569; font-weight: 700; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.8px; padding: 16px 20px; text-align: left; }
                .sq-table-foot { padding: 20px 28px; border-top: 1px solid #edf2f7; background: #fff; display: flex; align-items: center; justify-content: space-between; border-radius: 0 0 20px 20px; }
                .sq-foot-info { font-size: 13.5px; color: #64748b; font-weight: 500; }
                
                /* Custom Select Styles */
                .sq-custom-select { position: relative; width: 100%; }
                .sq-select-trigger { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; font-size: 14px; font-weight: 600; color: #1e293b; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all .2s; }
                .sq-select-trigger:hover, .sq-select-trigger--open { border-color: #6366f1; }
                .sq-select-popup { position: absolute; top: calc(100% + 8px); left: 0; width: 100%; background: #fff; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; padding: 8px; z-index: 1000; }
                .sq-select-item { padding: 10px 14px; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; border-radius: 8px; transition: all .15s; }
                .sq-select-item:hover, .sq-select-item--active { background: #f8fafc; color: #1e293b; }
                
                .sq-filter-panel { background: #fff; border-radius: 16px; padding: 20px 24px; margin-bottom: 20px; border: 1px solid #e2e8f0; display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 20px; align-items: end; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
                .sq-f-group { display: flex; flex-direction: column; gap: 8px; }
                .sq-f-label { font-size: 12.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }

                /* Tooltip Styles */
                .sq-tooltip-container { position: relative; display: inline-flex; align-items: center; }
                .sq-tooltip-text { visibility: hidden; width: max-content; background-color: #1e293b; color: #fff; text-align: center; border-radius: 6px; padding: 6px 8px; position: absolute; z-index: 1000; bottom: 125%; left: 50%; transform: translateX(-50%); opacity: 0; transition: opacity 0.2s; font-size: 11px; font-weight: 500; pointer-events: none; }
                .sq-tooltip-container:hover .sq-tooltip-text { visibility: visible; opacity: 1; }
                .sq-reject-btn:hover { background: #fef2f2 !important; border-color: #ef4444 !important; }
            `}</style>
        </div>
    );
};