import { useState, useEffect } from "react";
import "./CreateForms.css";
import quotationService from "../../services/quotationService.js";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v ?? 0) + " đ";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

export const ViewQuoteDetail = ({ quoteId, onClose }) => {
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await quotationService.getById(quoteId);
                setQuote(res);
            } catch (e) {
                console.error("Lỗi tải chi tiết:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [quoteId]);

    if (loading) return (
        <div className="cf-loading" style={{ height: "300px" }}>
            <div className="cf-spinner" /><span>Đang tải chi tiết...</span>
        </div>
    );

    if (!quote) return <div className="cf-error">Không tìm thấy báo giá</div>;

    return (
        <div className="cf-view-container">
            {/* Header */}
            <div className="cf-header">
                <div>
                    <h1 className="cf-title">Chi tiết Báo giá</h1>
                    <span className="cf-title-sub">{quote.quotationNumber}</span>
                </div>
                <button className="cf-back-btn" onClick={onClose}>Đóng</button>
            </div>

            <div className="cf-body">
                <div className="cf-left">
                    {/* Basic Info */}
                    <div className="cf-card">
                        <div className="cf-grid-3">
                            <div>
                                <div className="cf-label-small">MÃ BÁO GIÁ</div>
                                <div className="cf-quote-code">{quote.quotationNumber}</div>
                            </div>
                            <div>
                                <div className="cf-label-small">TRẠNG THÁI</div>
                                <span className={`sq-badge sq-badge--${(quote.status || "").toLowerCase()}`}>
                                    {quote.status}
                                </span>
                            </div>
                            <div>
                                <div className="cf-label-small">NGÀY TẠO</div>
                                <div className="cf-val-text">{fmtDate(quote.createdDate)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Staff */}
                    <div className="cf-card">
                        <div className="cf-grid-2">
                            <div className="cf-field">
                                <label className="cf-label">Khách hàng</label>
                                <div className="cf-input-readonly">{quote.customer?.name || "—"}</div>
                            </div>
                            <div className="cf-field">
                                <label className="cf-label">Nhân viên phụ trách</label>
                                <div className="cf-input-readonly">{quote.staff?.fullname || "—"}</div>
                            </div>
                        </div>
                        <div className="cf-grid-2" style={{ marginTop: 16 }}>
                            <div className="cf-field">
                                <label className="cf-label">Email</label>
                                <div className="cf-input-readonly">{quote.customer?.email || "—"}</div>
                            </div>
                            <div className="cf-field">
                                <label className="cf-label">Số điện thoại</label>
                                <div className="cf-input-readonly">{quote.customer?.phone || "—"}</div>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="cf-card">
                        <div className="cf-section-title">DANH SÁCH SẢN PHẨM</div>
                        <table className="cf-table">
                            <thead>
                                <tr>
                                    <th style={{ width: "40%" }}>SẢN PHẨM</th>
                                    <th>SL</th>
                                    <th>ĐƠN GIÁ</th>
                                    <th>CHIẾT KHẤU</th>
                                    <th style={{ textAlign: "right" }}>THÀNH TIỀN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(quote.details || []).map((d, i) => (
                                    <tr key={i}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{d.productName}</div>
                                            <div className="cf-table-sku">{d.sku}</div>
                                        </td>
                                        <td>{d.quantity}</td>
                                        <td>{fmt(d.unitPrice)}</td>
                                        <td>{d.discountPercent || 0}%</td>
                                        <td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(d.totalPrice)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="cf-right">
                    <div className="cf-card">
                        <div className="cf-sidebar-title">TỔNG KẾT</div>
                        <div className="cf-field" style={{ marginBottom: 18 }}>
                            <label className="cf-label">Hiệu lực đến</label>
                            <div className="cf-input-readonly">{fmtDate(quote.validUntil)}</div>
                        </div>
                        <div className="cf-summary-row">
                            <span className="cf-summary-label">Tạm tính:</span>
                            <span className="cf-summary-val">{fmt(quote.totalAmount)}</span>
                        </div>
                        <div className="cf-divider" />
                        <div className="cf-summary-row cf-summary-row--total">
                            <span>TỔNG CỘNG:</span>
                            <span className="cf-total-val">{fmt(quote.totalAmount)}</span>
                        </div>
                    </div>

                    {quote.note && (
                        <div className="cf-card">
                            <label className="cf-label">Ghi chú</label>
                            <div className="cf-textarea-readonly">{quote.note}</div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                .cf-view-container .cf-body { margin-top: 0; }
                .cf-val-text { font-size: 14px; font-weight: 500; color: #111827; }
                .cf-input-readonly { 
                    padding: 10px 14px; background: #f9fafb; border: 1.5px solid #e5e7eb; 
                    border-radius: 12px; font-size: 13.5px; color: #111827; min-height: 40px;
                }
                .cf-textarea-readonly {
                    padding: 12px; background: #f9fafb; border: 1.5px solid #e5e7eb;
                    border-radius: 12px; font-size: 13.5px; color: #4b5563; line-height: 1.6;
                    white-space: pre-wrap;
                }
                .cf-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
            `}</style>
        </div>
    );
};
