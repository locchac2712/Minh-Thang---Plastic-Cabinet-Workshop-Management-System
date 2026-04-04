import { useState, useEffect } from "react";
import "./SalesPages.css";
import customerService from "../../services/customerService";

const fmt = (v) => v != null ? v.toLocaleString("vi-VN") + " đ" : "—";

export const DebtManagement = () => {
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const loadDebtors = async () => {
            setLoading(true);
            try {
                const data = await customerService.getAll(true); // Chỉ lấy khách đang hoạt động
                setDebtors(data.filter(c => c.currentDebt > 0));
            } catch (e) {
                console.error("Lỗi khi tải danh sách nợ", e);
            } finally {
                setLoading(false);
            }
        };
        loadDebtors();
    }, []);

    const getRisk = (debt, limit) => {
        if (!limit || limit === 0) return { label: "N/A", color: "#94a3b8" };
        const ratio = (debt / limit) * 100;
        if (ratio > 90) return { label: "NGUY CƠ CAO", color: "#ef4444" };
        if (ratio > 50) return { label: "CẦN CHÚ Ý",  color: "#f59e0b" };
        return { label: "AN TOÀN",      color: "#10b981" };
    };

    const filtered = debtors.filter(d => 
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.taxCode?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="sp-page">
            <div className="sp-page-header">
                <div>
                    <h1 className="sp-title">Quản lý Công nợ</h1>
                    <p className="sp-sub">Kiểm soát rủi ro tài chính và hạn mức tín dụng khách hàng</p>
                </div>
            </div>

            <div className="so-toolbar">
                <div className="so-toolbar-main">
                    <div className="sp-search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            placeholder="Tìm kiếm khách hàng đang nợ..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="sp-card">
                {loading ? (
                    <div className="cf-loading" style={{padding: "60px 0"}}>
                        <div className="cf-spinner"></div>
                        <span>Đang tải danh sách công nợ...</span>
                    </div>
                ) : (
                    <table className="sp-table">
                        <thead>
                        <tr>
                            <th>KHÁCH HÀNG</th>
                            <th>DƯ NỢ HIỆN TẠI</th>
                            <th>HẠN MỨC</th>
                            <th>SỬ DỤNG HẠN MỨC</th>
                            <th>MỨC ĐỘ RỦI RO</th>
                            <th>THAO TÁC</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} className="sp-empty-row">Không có khách hàng nào đang nợ</td></tr>
                        ) : filtered.map((d) => {
                            const risk = getRisk(d.currentDebt, d.creditLimit);
                            const ratio = d.creditLimit > 0 ? (d.currentDebt / d.creditLimit) * 100 : 0;
                            return (
                                <tr key={d.id} className="sp-table__row">
                                    <td className="sp-td--name">
                                        <div style={{fontWeight:600}}>{d.name}</div>
                                        <div style={{fontSize:11, color:"#64748b"}}>{d.taxCode}</div>
                                    </td>
                                    <td className="sp-td--price" style={{color: "#e11d48", fontWeight: 700}}>{fmt(d.currentDebt)}</td>
                                    <td className="sp-td--price" style={{color: "#64748b"}}>{fmt(d.creditLimit)}</td>
                                    <td style={{width: 200}}>
                                        <div className="debt-progress-bg">
                                            <div className="debt-progress-bar" style={{ 
                                                width: `${Math.min(ratio, 100)}%`,
                                                backgroundColor: risk.color 
                                            }}></div>
                                        </div>
                                        <div style={{textAlign:"right", fontSize:10, marginTop:4, color:"#64748b"}}>{ratio.toFixed(1)}%</div>
                                    </td>
                                    <td>
                                        <span className="risk-badge" style={{backgroundColor: risk.color + "1A", color: risk.color, border: `1px solid ${risk.color}33`}}>
                                            {risk.label}
                                        </span>
                                    </td>
                                    <td className="sp-td--actions">
                                        <button className="sp-btn-outline" style={{padding:"4px 12px", fontSize:11}}>Nhắc nợ</button>
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
