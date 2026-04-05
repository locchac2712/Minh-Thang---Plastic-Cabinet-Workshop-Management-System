import React, { useState, useEffect } from "react";
import "./CreateWorkOrder.css";
import "../sales/CreateForms.css";
import productionPlanService from "../../services/productionPlanService";
import productService from "../../services/productService";
import bomService from "../../services/bomService";
import manufactureOrderService from "../../services/manufactureOrderService";

export const CreateWorkOrder = ({ onBack }) => {
    // Entities
    const [plans, setPlans] = useState([]);
    const [products, setProducts] = useState([]);
    
    // Selection state
    const [selectedPlanId, setSelectedPlanId] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [technicalNotes, setTechnicalNotes] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
    const [endDate, setEndDate] = useState("");

    // Calculated state
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [bom, setBom] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(false);

    // Initial load
    useEffect(() => {
        setLoading(true);
        Promise.all([
            productionPlanService.getAll(),
            productService.getAll()
        ]).then(([plansData, productsData]) => {
            setPlans(plansData);
            setProducts(productsData);
            setLoading(false);
        }).catch(err => {
            console.error("Lỗi khi tải dữ liệu:", err);
            setLoading(false);
        });
    }, []);

    // Selection handlers
    useEffect(() => {
        if (selectedPlanId) {
            const plan = plans.find(p => p.id === parseInt(selectedPlanId));
            setSelectedPlan(plan);
        } else {
            setSelectedPlan(null);
        }
    }, [selectedPlanId, plans]);

    useEffect(() => {
        if (selectedProductId) {
            // Giả định backend trả về BOM theo productId thông qua bomService
            // Nếu không có API getByProductId, ta có thể dùng getAll rồi lọc
            setLoading(true);
            bomService.getAll().then(allBoms => {
                const activeBom = allBoms.find(b => b.productId === parseInt(selectedProductId) && b.isApproved && b.isActive);
                if (activeBom) {
                    return bomService.getById(activeBom.id);
                }
                return null;
            }).then(bomDetail => {
                setBom(bomDetail);
                setLoading(false);
            }).catch(err => {
                console.error("Lỗi tải BOM:", err);
                setLoading(false);
            });
        } else {
            setBom(null);
        }
    }, [selectedProductId]);

    // Material calculations
    useEffect(() => {
        if (bom && quantity > 0) {
            const calculated = bom.details.map(d => ({
                ...d,
                totalNeeded: d.quantityRequired * quantity
            }));
            setMaterials(calculated);
        } else {
            setMaterials([]);
        }
    }, [bom, quantity]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPlanId || !selectedProductId || !quantity || !startDate || !endDate) {
            alert("Vui lòng điền đầy đủ thông tin!");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                productionPlanId: parseInt(selectedPlanId),
                productId: parseInt(selectedProductId),
                quantity: parseInt(quantity),
                technicalNotes,
                requestedStartDate: new Date(startDate).toISOString(),
                requestedEndDate: new Date(endDate).toISOString(),
                salesOrderId: selectedPlan?.salesOrderId 
            };
            
            await manufactureOrderService.manualSchedule(payload);
            alert("Tạo Lệnh Sản Xuất thành công!");
            onBack();
        } catch (err) {
            alert("Lỗi: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sq-modal-overlay" onClick={onBack}>
            <div className="sq-modal-box sq-modal-box--large" onClick={e => e.stopPropagation()}>
                <div className="sq-modal-header">
                    <h2 className="sq-modal-title">Tạo Lệnh Sản Xuất</h2>
                    <button className="sq-modal-close" onClick={onBack}>✕</button>
                </div>

                <div className="sq-modal-body" style={{ background: '#f8fafc' }}>
                    <div className="cwo-grid">
                        {/* CỘT TRÁI: Cấu hình Parent & Core Info */}
                        <div className="cwo-card">
                            <div className="cwo-card-title">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
                                Phân cấp & Kế hoạch
                            </div>
                            
                            <div className="cwo-field">
                                <label className="cwo-label">Kế hoạch Sản xuất</label>
                                <select 
                                    className="cwo-select"
                                    value={selectedPlanId}
                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                >
                                    <option value="">-- Chọn Kế hoạch --</option>
                                    {plans.map(p => (
                                        <option key={p.id} value={p.id}>{p.planName}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedPlan && (
                                <div className="cwo-plan-info">
                                    <div className="cwo-plan-meta">
                                        <span>Trạng thái</span>
                                        <span className="cwo-badge cwo-badge-purple">{selectedPlan.status}</span>
                                    </div>
                                    <div className="cwo-plan-name">{selectedPlan.planName}</div>
                                    <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Bắt đầu:</span> <b>{new Date(selectedPlan.startDate).toLocaleDateString()}</b>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                            <span>Kết thúc:</span> <b>{new Date(selectedPlan.endDate).toLocaleDateString()}</b>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="cwo-card-title" style={{ marginTop: '32px' }}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                                Sản phẩm mục tiêu
                            </div>

                            <div className="cwo-field">
                                <label className="cwo-label">Sản phẩm</label>
                                <select 
                                    className="cwo-select"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">-- Chọn Sản phẩm --</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="cwo-field">
                                <label className="cwo-label">Số lượng sản xuất</label>
                                <input 
                                    type="number" 
                                    className="cwo-input"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* CỘT PHẢI: CHI TIẾT & NGUYÊN VẬT LIỆU */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div className="cwo-card">
                                <div className="cwo-card-title">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    Thời gian & Ghi chú
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div className="cwo-field">
                                        <label className="cwo-label">Ngày bắt đầu</label>
                                        <input 
                                            type="datetime-local" 
                                            className="cwo-input"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="cwo-field">
                                        <label className="cwo-label">Dự kiến kết thúc</label>
                                        <input 
                                            type="datetime-local" 
                                            className="cwo-input"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="cwo-field">
                                    <label className="cwo-label">Ghi chú kỹ thuật</label>
                                    <textarea 
                                        className="cwo-input"
                                        rows="3"
                                        style={{ minHeight: '80px', resize: 'vertical' }}
                                        placeholder="Nhập các yêu cầu kỹ thuật đặc biệt..."
                                        value={technicalNotes}
                                        onChange={(e) => setTechnicalNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="cwo-card" style={{ flex: 1 }}>
                                <div className="cwo-card-title" style={{ justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                                        Nguyên vật liệu cần thiết
                                    </div>
                                    {bom && <span className="cwo-badge cwo-badge-blue">BOM v{bom.version}</span>}
                                </div>

                                {materials.length > 0 ? (
                                    <table className="cwo-materials-table">
                                        <thead>
                                            <tr>
                                                <th>Nguyên vật liệu</th>
                                                <th>Định mức (1 SP)</th>
                                                <th style={{ textAlign: 'right' }}>Tổng nhu cầu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {materials.map((m, idx) => (
                                                <tr key={idx}>
                                                    <td>
                                                        <div className="cwo-mat-name">{m.materialName}</div>
                                                        <div className="cwo-mat-sku">{m.materialSku}</div>
                                                    </td>
                                                    <td>{m.quantityRequired} {m.unit}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <span className="cwo-mat-qty">{m.totalNeeded}</span>
                                                        <span style={{ marginLeft: '4px', fontSize: '12px', color: '#64748b' }}>{m.unit}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="cwo-empty-materials">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h2l2 3h4a2 2 0 0 1 2 2Z"/><path d="M3 10h18"/><circle cx="12" cy="14" r="3"/></svg>
                                        <p>{selectedProductId ? "Sản phẩm chưa cấu hình BOM hoặc đang tải..." : "Vui lòng chọn sản phẩm để xem vật tư"}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sq-modal-footer">
                    <button type="button" className="sq-modal-btn sq-modal-btn--cancel" onClick={onBack}>Hủy bỏ</button>
                    <button 
                        type="button" 
                        className="sq-modal-btn sq-modal-btn--submit" 
                        disabled={loading || !selectedPlanId || !selectedProductId}
                        onClick={handleSubmit}
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', border: 'none' }}
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận & Phát hành lệnh"}
                    </button>
                </div>
            </div>
        </div>
    );
};
