import { useState } from "react";
import "./CreateForms.css";

const fmt = (v) => new Intl.NumberFormat("vi-VN").format(v) + " đ";

const MOCK_CUSTOMERS = [
    { id: 1, name: "Công ty TNHH Khách Hàng VIP" },
    { id: 2, name: "Anh Tuấn Mua Lẻ" },
];
const MOCK_PRODUCTS = [
    { id: 1, name: "Bàn làm việc Gỗ Sồi",             price: 1_500_000 },
    { id: 2, name: "Ghế xoay văn phòng cao cấp",       price: 800_000  },
    { id: 3, name: "Tủ hồ sơ 3 buồng Gỗ Công Nghiệp", price: 2_200_000 },
];

export const CreateOrder = ({ onBack }) => {
    const [custId,   setCustId]   = useState("");
    const [delivery, setDelivery] = useState("");
    const [address,  setAddress]  = useState("");
    const [note,     setNote]     = useState("");
    const [rows,     setRows]     = useState([{ productId: "", qty: 1, unitPrice: "" }]);

    const setRow = (i, f, v) => setRows(p => p.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
    const addRow    = () => setRows(p => [...p, { productId: "", qty: 1, unitPrice: "" }]);
    const removeRow = (i) => setRows(p => p.filter((_, idx) => idx !== i));
    const pickProduct = (i, pid) => {
        const pr = MOCK_PRODUCTS.find(p => String(p.id) === String(pid));
        setRows(p => p.map((r, idx) => idx === i ? { ...r, productId: pid, unitPrice: pr?.price ?? "" } : r));
    };
    const rowTotal = r => (r.qty || 0) * (Number(r.unitPrice) || 0);
    const total    = rows.reduce((s, r) => s + rowTotal(r), 0);

    return (
        <div className="cf-modal-overlay" onClick={onBack}>
            <div className="cf-modal-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="cf-modal-header">
                    <h2 className="cf-modal-title">Tạo đơn hàng</h2>
                    <button className="cf-modal-close" onClick={onBack}>✕</button>
                </div>

                {/* Body */}
                <div className="cf-modal-body">
                    {/* Order info */}
                    <div className="cf-card">
                        <div className="cf-section-label">Thông tin đơn hàng</div>
                        <div className="cf-grid-2">
                            <div className="cf-field">
                                <label className="cf-label">Khách hàng</label>
                                <select className="cf-select" value={custId} onChange={e => setCustId(e.target.value)}>
                                    <option value="">Chọn khách hàng</option>
                                    {MOCK_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="cf-field">
                                <label className="cf-label">Ngày giao hàng</label>
                                <input className="cf-input cf-input--date" type="date" value={delivery} onChange={e => setDelivery(e.target.value)} />
                            </div>
                        </div>
                        <div className="cf-field" style={{marginTop:16}}>
                            <label className="cf-label">Địa chỉ giao hàng</label>
                            <textarea className="cf-textarea cf-textarea--short" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="cf-field" style={{marginTop:16}}>
                            <label className="cf-label">Ghi chú</label>
                            <textarea className="cf-textarea cf-textarea--short" rows={2} value={note} onChange={e => setNote(e.target.value)} />
                        </div>
                    </div>

                    {/* Products */}
                    <div className="cf-card">
                        <div className="cf-section-header">
                            <span className="cf-section-label" style={{marginBottom:0}}>Sản phẩm</span>
                            <button className="cf-add-row-btn" onClick={addRow}>+ Thêm</button>
                        </div>
                        <table className="cf-table">
                            <thead>
                            <tr>
                                <th style={{width:"45%"}}>SẢN PHẨM</th>
                                <th>SỐ LƯỢNG</th>
                                <th>ĐƠN GIÁ</th>
                                <th>THÀNH TIỀN</th>
                                <th></th>
                            </tr>
                            </thead>
                            <tbody>
                            {rows.map((row, i) => (
                                <tr key={i}>
                                    <td>
                                        <select className="cf-table-select" value={row.productId} onChange={e => pickProduct(i, e.target.value)}>
                                            <option value="">Chọn SP</option>
                                            {MOCK_PRODUCTS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </td>
                                    <td><input className="cf-table-input cf-table-input--sm" type="number" min="1" value={row.qty} onChange={e => setRow(i,"qty",Number(e.target.value))} /></td>
                                    <td><input className="cf-table-input cf-table-input--sm" type="number" min="0" value={row.unitPrice} placeholder="" onChange={e => setRow(i,"unitPrice",e.target.value)} /></td>
                                    <td className="cf-td--amount">{fmt(rowTotal(row))}</td>
                                    <td><button className="cf-remove-btn" onClick={() => removeRow(i)} disabled={rows.length===1}>✕</button></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div className="cf-order-total">Tổng: <strong>{fmt(total)}</strong></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="cf-modal-footer">
                    <button className="cf-submit-btn cf-submit-btn--dark">Tạo đơn hàng</button>
                    <button className="cf-cancel-btn" onClick={onBack}>Hủy</button>
                </div>
            </div>
        </div>
    );
};