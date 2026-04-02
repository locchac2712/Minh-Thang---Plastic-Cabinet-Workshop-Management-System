import { useState, useEffect } from "react";
<<<<<<< HEAD
import "../sales/SalesPages.css";
import { useBoms } from "../../hooks/useBoms";
import { useAuth } from "../../context/AuthContext";
import { getStatusInfo } from "../../services/bomService";
import bomService from "../../services/bomService";
import api from "../../services/api";

const fmt = (val) =>
    val != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val) : "—";
=======
import "./ManageBom.css";
import "../sales/SalesPages.css";
import { useBoms } from "../../hooks/useBoms.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { getStatusInfo } from "../../services/bomService.js";
import bomService from "../../services/bomService.js";
import api from "../../services/api.js";

// Helper định dạng tiền tệ
const fmt = (val) =>
    val != null
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
        : "—";

const InfoRow = ({ label, value }) => (
    <div className="sod-info-row">
        <span className="sod-info-label">{label}</span>
        <span className="sod-info-value">{value ?? "—"}</span>
    </div>
);
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63

const calcMaterialCost = (detail) => {
  if (detail.price != null && detail.quantityRequired != null)
    return Number(detail.price) * Number(detail.quantityRequired);
  return null;
};

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────
// Shared: Material rows editor
// ─────────────────────────────────────────────────────────────
const MaterialRowsEditor = ({ rows, setRows, materials }) => {
  const setRow = (idx, field, val) =>
      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  const addRow    = () => setRows((p) => [...p, { materialId: "", quantityRequired: "" }]);
  const removeRow = (idx) => setRows((p) => p.filter((_, i) => i !== idx));

  return (
      <div style={{ marginTop: "12px", border: "1.5px solid #f0f0f5", borderRadius: "14px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 42px", gap: "12px", background: "#f9fafb", padding: "10px 16px", borderBottom: "1px solid #f0f0f5" }}>
          <span className="sod-info-label" style={{ fontSize: "11px" }}>Vật tư nguyên liệu</span>
          <span className="sod-info-label" style={{ fontSize: "11px" }}>Số lượng</span>
          <span className="sod-info-label" style={{ fontSize: "11px" }}>Đơn vị</span>
          <span></span>
        </div>
        <div style={{ padding: "8px 16px 16px" }}>
          {rows.map((row, idx) => {
            const mat = materials.find((m) => String(m.id) === String(row.materialId));
            return (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 80px 42px", gap: "12px", marginTop: "12px", alignItems: "center" }}>
                  <select className="sq-f-input" style={{ width: "100%" }} value={row.materialId} onChange={(e) => setRow(idx, "materialId", e.target.value)}>
                    <option value="">-- Chọn vật tư --</option>
                    {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.materialName || m.name} ({m.sku})</option>
                    ))}
                  </select>
                  <input
                      className="sq-f-input" style={{ width: "100%" }}
                      type="number" min="0" step="0.0001" value={row.quantityRequired}
                      onChange={(e) => setRow(idx, "quantityRequired", e.target.value)} placeholder="0.00"
                  />
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#6b7280", textAlign: "center" }}>{mat?.unit || "—"}</div>
                  <button
                      style={{ background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: "10px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => removeRow(idx)} disabled={rows.length === 1} title="Xóa"
                  >✕</button>
                </div>
            );
          })}
          <button style={{ marginTop: "16px", background: "#f5f3ff", border: "1.5px dashed #7c3aed", color: "#7c3aed", borderRadius: "10px", padding: "8px 16px", fontWeight: 600, fontSize: "13px", cursor: "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={addRow}>
              <span>+ Thêm vật tư vào danh sách</span>
          </button>
        </div>
=======
// --- Sub-component: Material Rows Editor ---
const MaterialRowsEditor = ({ rows, setRows, materials }) => {
  const setRow = (idx, field, val) =>
      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  const addRow = () => setRows((p) => [...p, { materialId: "", quantityRequired: "" }]);
  const removeRow = (idx) => setRows((p) => p.filter((_, i) => i !== idx));

  return (
      <div className="bom-detail-table">
        <div className="bom-detail-header">
          <span>Vật tư nguyên liệu</span>
          <span>Số lượng</span>
          <span>Đơn vị</span>
          <span></span>
        </div>
        {rows.map((row, idx) => {
          const mat = materials.find((m) => String(m.id) === String(row.materialId));
          return (
              <div className="bom-detail-row" key={idx}>
                <select value={row.materialId} onChange={(e) => setRow(idx, "materialId", e.target.value)}>
                  <option value="">-- Chọn vật tư --</option>
                  {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.materialName || m.name} ({m.sku})
                      </option>
                  ))}
                </select>
                <input
                    type="number" min="0" step="0.0001"
                    value={row.quantityRequired}
                    onChange={(e) => setRow(idx, "quantityRequired", e.target.value)}
                    placeholder="0"
                />
                <span className="bom-detail-unit">{mat?.unit || "—"}</span>
                <button className="bom-remove-row" onClick={() => removeRow(idx)} disabled={rows.length === 1}>✕</button>
              </div>
          );
        })}
        <button className="bom-add-row" onClick={addRow}>+ Thêm vật tư</button>
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
      </div>
  );
};

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────
// Create BOM Modal
// ─────────────────────────────────────────────────────────────
const CreateBomModal = ({ onSave, onClose, saving }) => {
  const [productId,   setProductId]   = useState("");
  const [version,     setVersion]     = useState("1.0");
  const [rows,        setRows]        = useState([{ materialId: "", quantityRequired: "" }]);
  const [products,    setProducts]    = useState([]);
  const [materials,   setMaterials]   = useState([]);
=======
// --- Modal: Create BOM ---
const CreateBomModal = ({ onSave, onClose, saving }) => {
  const [productId, setProductId] = useState("");
  const [version, setVersion] = useState("1.0");
  const [rows, setRows] = useState([{ materialId: "", quantityRequired: "" }]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([api.get("/products"), api.get("/materials")]);
        setProducts(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data ?? []));
        setMaterials(Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data ?? []));
      } catch (e) {
<<<<<<< HEAD
        console.error("Lỗi:", e);
=======
        console.error("Lỗi tải dropdown:", e);
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
      } finally { setLoadingData(false); }
    })();
  }, []);

  const handleSave = () => {
<<<<<<< HEAD
    const details = rows.filter((r) => r.materialId && r.quantityRequired).map((r) => ({ materialId: Number(r.materialId), quantityRequired: Number(r.quantityRequired) }));
=======
    const details = rows
        .filter((r) => r.materialId && r.quantityRequired)
        .map((r) => ({ materialId: Number(r.materialId), quantityRequired: Number(r.quantityRequired) }));
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
    onSave({ productId: Number(productId), version, details });
  };

  const valid = productId && version && rows.some((r) => r.materialId && r.quantityRequired);

  return (
<<<<<<< HEAD
      <div className="sq-modal-overlay" onClick={onClose}>
        <div className="sq-modal-box sq-modal-box--large" onClick={(e) => e.stopPropagation()} style={{ width: "680px" }}>
          <div className="sq-modal-header">
            <div className="sq-modal-title-group">
                <h3 className="sq-modal-title">Thiết lập định mức (BOM) mới</h3>
                <span className="sq-modal-sub">Gán thành phần vật tư cho sản phẩm thành phẩm</span>
            </div>
            <button className="sq-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="sq-modal-body">
            {loadingData ? (
                <div className="sp-state"><div className="sp-spinner" /><span>Đang kết nối dữ liệu...</span></div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                    <div className="sq-f-group">
                      <label className="sq-f-label">Thành phẩm mục tiêu *</label>
                      <select className="sq-f-input" value={productId} onChange={(e) => setProductId(e.target.value)}>
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                      </select>
                    </div>
                    <div className="sq-f-group">
                      <label className="sq-f-label">Phiên bản *</label>
                      <input className="sq-f-input" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="VD: 1.0" />
                    </div>
                  </div>
                  
                  <div className="sq-f-group">
                    <label className="sq-f-label">Cấu trúc thành phần vật tư *</label>
                    <MaterialRowsEditor rows={rows} setRows={setRows} materials={materials} />
                  </div>
                </div>
            )}
          </div>
          
          {!loadingData && (
              <div className="sq-modal-footer">
                <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Hủy bỏ</button>
                <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={saving || !valid}>
                  {saving ? "Đang xử lý..." : "Lưu Định Mức"}
                </button>
              </div>
          )}
        </div>
      </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Edit BOM Modal
// ─────────────────────────────────────────────────────────────
const EditBomModal = ({ bom, onSave, onClose, saving }) => {
  const [version,     setVersion]     = useState(bom.version || "");
  const [isActive,    setIsActive]    = useState(bom.isActive ?? true);
  const [rows,        setRows]        = useState(
      bom.details?.length
          ? bom.details.map((d) => ({ materialId: String(d.materialId), quantityRequired: String(d.quantityRequired) }))
          : [{ materialId: "", quantityRequired: "" }]
  );
  const [materials,   setMaterials]   = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const mRes = await api.get("/materials");
        setMaterials(Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data ?? []));
      } catch (e) {
      } finally { setLoadingData(false); }
    })();
  }, []);

  const handleSave = () => {
    const details = rows.filter((r) => r.materialId && r.quantityRequired).map((r) => ({ materialId: Number(r.materialId), quantityRequired: Number(r.quantityRequired) }));
    onSave({ version, isActive, details });
  };

  const valid = version && rows.some((r) => r.materialId && r.quantityRequired);

  return (
      <div className="sq-modal-overlay" onClick={onClose}>
        <div className="sq-modal-box sq-modal-box--large" onClick={(e) => e.stopPropagation()} style={{ width: "680px" }}>
          <div className="sq-modal-header">
            <div className="sq-modal-title-group">
              <h3 className="sq-modal-title">Cập nhật cấu trúc BOM</h3>
              <span className="sq-modal-sub">{bom.productName} · v{bom.version}</span>
            </div>
            <button className="sq-modal-close" onClick={onClose}>✕</button>
          </div>
          
          <div className="sq-modal-body">
            {loadingData ? (
                <div className="sp-state"><div className="sp-spinner" /><span>Đang lấy dữ liệu...</span></div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div className="sq-f-group">
                      <label className="sq-f-label">Số hiệu phiên bản *</label>
                      <input className="sq-f-input" value={version} onChange={(e) => setVersion(e.target.value)} />
                    </div>
                    <div className="sq-f-group">
                      <label className="sq-f-label">Trạng thái định mức</label>
                      <select className="sq-f-input" value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                        <option value="true">Đang hoạt động (Active)</option>
                        <option value="false">Ngừng sử dụng (Inactive)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="sq-f-group">
                    <label className="sq-f-label">Sửa đổi danh sách vật tư *</label>
                    <MaterialRowsEditor rows={rows} setRows={setRows} materials={materials} />
                  </div>
                  
                  <div style={{ padding: "12px 18px", background: "#fefce8", border: "1.5px solid #fde047", color: "#854d0e", borderRadius: "14px", fontSize: "13px", lineHeight: "1.5" }}>
                    ⚠️ <b>Lưu ý:</b> Các thay đổi này có thể ảnh hưởng đến quá trình tính toán giá thành sản phẩm và kế hoạch sản xuất hiện tại.
                  </div>
                </div>
            )}
          </div>
          
          {!loadingData && (
              <div className="sq-modal-footer">
                <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose}>Đóng</button>
                <button className="sq-modal-btn sq-modal-btn--submit" onClick={handleSave} disabled={saving || !valid}>
                  {saving ? "Đang lưu..." : "Xác nhận cập nhật"}
                </button>
              </div>
=======
      <div className="bom-overlay" onClick={onClose}>
        <div className="bom-modal bom-modal--lg" onClick={(e) => e.stopPropagation()}>
          <div className="bom-modal__header">
            <h3>Tạo BOM mới</h3>
            <button className="bom-modal__close" onClick={onClose}>✕</button>
          </div>
          {loadingData ? (
              <div className="bom-modal__loading"><div className="bom-spinner" /><span>Đang tải...</span></div>
          ) : (
              <>
                <div className="bom-modal__body">
                  <div className="bom-form-row">
                    <div className="bom-form-group">
                      <label>Thành phẩm *</label>
                      <select value={productId} onChange={(e) => setProductId(e.target.value)}>
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="bom-form-group">
                      <label>Phiên bản *</label>
                      <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="VD: 1.0" />
                    </div>
                  </div>
                  <div className="bom-form-group">
                    <label>Danh sách vật tư *</label>
                    <MaterialRowsEditor rows={rows} setRows={setRows} materials={materials} />
                  </div>
                </div>
                <div className="bom-modal__footer">
                  <button className="btn btn--ghost" onClick={onClose}>Hủy</button>
                  <button className="btn btn--primary" onClick={handleSave} disabled={saving || !valid}>
                    {saving ? "Đang lưu..." : "Tạo BOM"}
                  </button>
                </div>
              </>
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
          )}
        </div>
      </div>
  );
};

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────
// BOM Detail (Modal Popup)
// ─────────────────────────────────────────────────────────────
const BomDetailModal = ({ bomId, onClose, onUpdated }) => {
  const { user } = useAuth();
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const fetchBom = async () => {
    try {
      const data = await bomService.getById(bomId);
      setBom(data);
    } catch {
      setError("Không tải được chi tiết định mức.");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBom(); }, [bomId]);

  const handleEdit = async (payload) => {
    setSaving(true);
    try {
      await bomService.update(bomId, payload);
      await fetchBom();
      setShowEdit(false);
      setToastMsg("Cập nhật định mức thành công!");
      setTimeout(() => setToastMsg(""), 3000);
      if (onUpdated) onUpdated();
    } catch (e) {
      setToastMsg("Lỗi hệ thống: Không thể lưu");
      setTimeout(() => setToastMsg(""), 3000);
    } finally { setSaving(false); }
  };

  const totalCost = bom?.details?.reduce((sum, d) => {
    const c = calcMaterialCost(d);
    return c != null ? sum + c : sum;
  }, 0) ?? null;

  const s = bom ? getStatusInfo(bom) : null;

  return (
      <div className="sq-modal-overlay" onClick={onClose}>
        <div className="sq-modal-box sq-modal-box--large" onClick={(e) => e.stopPropagation()} style={{ width: "800px" }}>
          
          {toastMsg && (
              <div className="cf-toast cf-toast--success" style={{ bottom: "auto", top: "24px" }}>
                {toastMsg}
              </div>
          )}

          <div className="sq-modal-header">
            <div className="sq-modal-title-group">
              <h3 className="sq-modal-title">Chi tiết Cấu trúc sản phẩm (BOM)</h3>
              <span className="sq-modal-sub">{bom?.productName || "Đang tải dữ liệu..."}</span>
            </div>
            <button className="sq-modal-close" onClick={onClose}>✕</button>
          </div>

          <div className="sq-modal-body" style={{ background: "#f9fafb" }}>
            {loading && <div className="sp-state"><div className="sp-spinner" /><span>Đang tải thông tin định mức...</span></div>}
            {error && <div className="sp-state sp-state--error">⚠️ {error}</div>}

            {bom && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr", gap: "16px" }}>
                    <div style={{ background: "#fff", padding: "18px", borderRadius: "16px", border: "1.5px solid #f0f0f5", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                      <div className="sod-info-label" style={{ marginBottom: "6px" }}>Số loại vật tư</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#111827" }}>{bom.details?.length ?? 0} <span style={{ fontSize: "14px", fontWeight: "500", color: "#6b7280" }}>loại</span></div>
                    </div>
                    <div style={{ background: "#fff", padding: "18px", borderRadius: "16px", border: "1.5px solid #f0f0f5", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                      <div className="sod-info-label" style={{ marginBottom: "6px" }}>Giá vốn nguyên liệu ước tính</div>
                      <div style={{ fontSize: "22px", fontWeight: "800", color: "#7c3aed" }}>
                        {totalCost != null && totalCost > 0 ? fmt(totalCost) : <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "15px" }}>Thiếu đơn giá VT</span>}
                      </div>
                    </div>
                    <div style={{ background: "#fff", padding: "18px", borderRadius: "16px", border: "1.5px solid #f0f0f5", boxShadow: "0 4px 12px rgba(0,0,0,0.02)" }}>
                      <div className="sod-info-label" style={{ marginBottom: "6px" }}>Phiên bản & Trạng thái</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="sq-quote-id" style={{ fontSize: "14px", padding: "4px 12px" }}>v{bom.version}</span>
                        <span className={`sq-badge ${s.cls}`} style={{ padding: "4px 12px" }}>{s.text}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#fff", borderRadius: "16px", border: "1.5px solid #f0f0f5", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.03)" }}>
                    <div style={{ padding: "16px 20px", fontWeight: "700", fontSize: "14px", borderBottom: "1.5px solid #f9fafb", color: "#374151" }}>Bảng kê nguyên vật liệu chi tiết</div>
                    <table className="sp-table" style={{ margin: 0 }}>
                      <thead className="sq-table-head">
                        <tr>
                          <th style={{ width: "50px" }}>#</th>
                          <th>Tên vật tư (SKU)</th>
                          <th style={{ textAlign: "right" }}>Định mức (SL)</th>
                          <th style={{ textAlign: "right" }}>Giá thành (ước lượng)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!bom.details?.length ? (
                            <tr><td colSpan={4} className="sp-empty-row">Chưa cấu trúc vật tư cho BOM này</td></tr>
                        ) : (
                            bom.details.map((d, idx) => {
                              const cost = calcMaterialCost(d);
                              return (
                                  <tr key={d.id} className="sp-table__row">
                                    <td className="sp-td--muted">{(idx + 1).toString().padStart(2, '0')}</td>
                                    <td>
                                      <div style={{ fontWeight: "600", color: "#111827" }}>{d.materialName}</div>
                                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>SKU: {d.materialSku}</div>
                                    </td>
                                    <td style={{ textAlign: "right", fontWeight: "700", color: "#374151" }}>
                                        {Number(d.quantityRequired).toLocaleString("vi-VN")} 
                                        <span style={{ fontSize: "12px", color: "#9ca3af", marginLeft: "4px", fontWeight: "500" }}>{d.unit || "đv"}</span>
                                    </td>
                                    <td style={{ textAlign: "right", color: cost != null ? "#059669" : "#9ca3af", fontWeight: "600" }}>
                                        {cost != null ? fmt(cost) : "—"}
                                    </td>
                                  </tr>
                              );
                            })
                        )}
                      </tbody>
                      {totalCost != null && totalCost > 0 && (
                          <tfoot style={{ background: "#f9fafb" }}>
                              <tr>
                                  <td colSpan={3} style={{ textAlign: "right", padding: "14px 20px", fontWeight: "700", color: "#6b7280" }}>TỔNG CHI PHÍ VẬT TƯ:</td>
                                  <td style={{ textAlign: "right", padding: "14px 20px", fontWeight: "800", color: "#7c3aed", fontSize: "16px" }}>{fmt(totalCost)}</td>
                              </tr>
                          </tfoot>
                      )}
                    </table>
                  </div>
                </div>
            )}
          </div>
          
          <div className="sq-modal-footer">
            <button className="sq-modal-btn sq-modal-btn--cancel" onClick={onClose} style={{ marginRight: "auto" }}>Đóng lại</button>
            {user && bom && (
                <button className="sq-modal-btn sq-modal-btn--submit" onClick={() => setShowEdit(true)}>Hiệu chỉnh BOM</button>
            )}
          </div>

          {showEdit && bom && (
              <EditBomModal bom={bom} onSave={handleEdit} onClose={() => setShowEdit(false)} saving={saving} />
          )}

        </div>
      </div>
  );
};


// ─────────────────────────────────────────────────────────────
// BOM List Main Component
// ─────────────────────────────────────────────────────────────
export const ManageBOM = () => {
  const { boms, loading, error, refetch, create } = useBoms();
  const { user } = useAuth();
  const [search,     setSearch]     = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [detailId,   setDetailId]   = useState(null);

  const [page, setPage] = useState(0);
  const pageSize = 10;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = boms.filter((b) =>
      (b.productName || "").toLowerCase().includes(search.toLowerCase()) ||
      (b.version || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.length;
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(total / pageSize);

=======
// --- Main Component: ManageBOM ---
export const ManageBOM = () => {
  const { boms, loading, error, refetch, create } = useBoms();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [view, setView] = useState("LIST");
  const [selectedBom, setSelectedBom] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleViewDetail = async (id) => {
    setDetailLoading(true);
    try {
      const data = await bomService.getById(id);
      setSelectedBom(data);
      setView("DETAIL");
      window.scrollTo(0, 0);
    } catch (e) {
      showToast("Lỗi lấy chi tiết BOM", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = boms.filter((b) =>
      b.productName?.toLowerCase().includes(search.toLowerCase()) ||
      b.version?.toLowerCase().includes(search.toLowerCase())
  );

>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await create(payload);
      setShowCreate(false);
<<<<<<< HEAD
      showToast("Khởi tạo cấu trúc BOM thành công!");
    } catch (e) {
      showToast(e.response?.data?.message || "Có lỗi xảy ra khi tạo BOM", "error");
    } finally { setSaving(false); }
  };

  return (
      <div className="sp-page">
        {/* Toast */}
        {toast && (
            <div className={`cf-toast cf-toast--${toast.type === "error" ? "error" : "success"}`}>
                <span>{toast.msg}</span>
                <button onClick={() => setToast(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.6, marginLeft: "10px" }}>✕</button>
            </div>
        )}

        <div className="sp-page-header">
          <div>
            <h1 className="sp-title">Định mức Vật tư (BOM)</h1>
          </div>
        </div>

        <div className="sq-toolbar">
          <div className="sq-toolbar__left">
            <div className="sq-search-wrap">
              <div className="sp-search">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  <input placeholder="Tìm theo tên thành phẩm hoặc phiên bản..."
                         value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
              </div>
            </div>
          </div>
          <div className="sq-toolbar__right">
              <div className="sp-header-actions">
                  {user && (
                      <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)}>
                          Thiết lập BOM
                          <span className="sp-btn-plus">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                          </span>
                      </button>
                  )}
              </div>
          </div>
        </div>

        {loading && <div className="sp-state"><div className="sp-spinner"/><span>Đang thu thập dữ liệu định mức...</span></div>}
        
        {error && !loading && (
            <div className="sp-state sp-state--error">
              <span style={{ fontSize: 32 }}>⚠️</span>
              <span style={{ fontWeight: 600 }}>{error}</span>

            </div>
        )}

        {!loading && !error && (
            <div className="sp-card">
              <table className="sp-table">
                <thead className="sq-table-head">
                  <tr>
                    <th style={{ width: "60px" }}>STT</th>
                    <th>Mã số</th>
                    <th>Tên sản phẩm</th>
                    <th>Phiên bản</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: "center" }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="sp-empty-row">
                          <div className="sq-empty">
                            <div className="sq-empty__icon">📒</div>
                            <p>{search ? "Không tìm thấy BOM phù hợp" : "Chưa có định mức nào được thiết lập"}</p>
                          </div>
                        </td>
                      </tr>
                  ) : (
                      paginated.map((b, idx) => {
                        const s = getStatusInfo(b);
                        return (
                            <tr key={b.id} className="sp-table__row" style={{ cursor: "pointer" }} onClick={() => setDetailId(b.id)}>
                              <td className="sp-td--muted">{(page * pageSize) + idx + 1}</td>
                              <td><span className="sq-quote-id">BOM-{b.id}</span></td>
                              <td className="sp-td--name">{b.productName}</td>
                              <td><span style={{ background: "#f9fafb", color: "#4b5563", padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: "600", border: "1.5px solid #f0f0f5" }}>v{b.version}</span></td>
                              <td><span className={`sq-badge ${s.cls}`}>{s.text}</span></td>
                              <td>
                                  <div className="sp-td--actions" style={{ justifyContent: "center" }}>
                                      <button 
                                          className="sp-action-btn" 
                                          title="Xem chi tiết"
                                          onClick={(e) => { e.stopPropagation(); setDetailId(b.id); }}
                                      >
                                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                          </svg>
                                      </button>
                                  </div>
                              </td>
                            </tr>
                        );
                      })
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {total > 0 && (
                  <div className="sp-pagination">
                      <div className="sp-pagination__left">
                          Hiển thị <b>{(page * pageSize) + 1} - {Math.min((page + 1) * pageSize, total)}</b> trong tổng số <b>{total}</b> định mức
                      </div>
                      <div className="sp-pagination__right">
                          <button className="sp-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>&lt;</button>
                          {[...Array(totalPages)].map((_, i) => (
                              <button 
                                  key={i} 
                                  className={`sp-page-btn${page === i ? " sp-page-btn--active" : ""}`}
                                  onClick={() => setPage(i)}
                              >
                                  {i + 1}
                              </button>
                          ))}
                          <button className="sp-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>&gt;</button>
                      </div>
                  </div>
              )}
=======
      showToast("Tạo BOM thành công!");
    } catch (e) {
      showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
    } finally { setSaving(false); }
  };

  if (view === "DETAIL" && selectedBom) {
    const s = getStatusInfo(selectedBom);
    return (
      <div className="sod-page">
        <div className="sod-header">
            <div>
                <h1 className="sod-title">📑 Chi tiết BOM</h1>
                <div className="sod-header-meta">
                    <span className="so-order-id">BOM-{selectedBom.id}</span>
                    <span className={`so-badge ${s.cls}`}>{s.text}</span>
                </div>
            </div>
            <button className="cf-back-btn" onClick={() => { setView("LIST"); setSelectedBom(null); }}>← Quay lại danh sách</button>
        </div>

        <div className="sod-grid">
            <div className="sod-col-main">
                <div className="sod-card">
                    <div className="sod-card__title">ℹ️ Thông tin BOM</div>
                    <div className="sod-info-grid">
                        <InfoRow label="Sản phẩm áp dụng" value={selectedBom.productName} />
                        <InfoRow label="Mã SKU" value={selectedBom.productSku} />
                        <InfoRow label="Phiên bản phát hành" value={`v${selectedBom.version}`} />
                    </div>
                </div>

                <div className="sod-card">
                    <div className="sod-card__title">📦 Danh mục Nguyên vật liệu</div>
                    <table className="sod-table">
                        <thead>
                            <tr><th>#</th><th>Vật tư (Nguyên liệu)</th><th style={{textAlign: "center"}}>Định mức</th><th>Đơn vị</th></tr>
                        </thead>
                        <tbody>
                            {(selectedBom.details || []).map((item, i) => (
                                <tr key={i}>
                                    <td className="sod-td--idx">{i + 1}</td>
                                    <td className="sod-td--name">{item.materialName || item.material?.name || `Phiếu vật tư #${item.materialId}`}</td>
                                    <td style={{ fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>{item.quantityRequired}</td>
                                    <td>{item.unit || item.material?.unit}</td>
                                </tr>
                            ))}
                            {(!selectedBom.details || selectedBom.details.length === 0) && (
                                <tr><td colSpan={4} style={{textAlign: "center", color: "#9ca3af", padding: "12px"}}>Không có vật tư nào được định nghĩa</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
      <div className="sp-page">
        {toast && <div className={`bom-toast bom-toast--${toast.type}`}>{toast.msg}</div>}

        <div className="sp-page-header">
            <div>
                <h1 className="sp-title">Quản lý BOM</h1>
                <p className="sp-sub">Danh sách định mức nguyên vật liệu sản xuất</p>
            </div>
        </div>

        <div className="so-toolbar">
            <div className="so-toolbar-main">
                <div className="sp-search">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        placeholder="Tìm theo mã BOM hoặc sản phẩm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="sp-search-filter" title="Lọc dữ liệu">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="so-toolbar-actions">
                {user && (
                    <button className="sp-btn-primary sp-btn-primary--pill" onClick={() => setShowCreate(true)}>
                        Tạo BOM mới <span className="sp-btn-plus">+</span>
                    </button>
                )}
            </div>
        </div>

        {loading ? (
            <div className="sp-state"><div className="sp-spinner" /><span>Đang tải...</span></div>
        ) : error ? (
            <div className="sp-state sp-state--error">⚠️ Có lỗi xảy ra khi tải dữ liệu</div>
        ) : (
            <div className="sp-card">
                <table className="sp-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Mã BOM</th>
                            <th>Sản phẩm</th>
                            <th>Phiên bản</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="sp-empty-row">
                                    <div className="sq-empty">
                                        <div className="sq-empty__icon">📋</div>
                                        <p>Không tìm thấy dữ liệu BOM nào</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filtered.map((b, idx) => {
                                const s = getStatusInfo(b);
                                return (
                                    <tr key={b.id} className="sp-table__row">
                                        <td>{idx + 1}</td>
                                        <td><span className="so-order-id">BOM-{b.id}</span></td>
                                        <td className="sp-td--name">{b.productName}</td>
                                        <td className="sp-td--muted">v{b.version}</td>
                                        <td><span className={`so-badge ${s.cls}`}>{s.text}</span></td>
                                        <td className="sp-td--actions">
                                            <button className="sp-action-btn" title="Xem chi tiết" onClick={() => handleViewDetail(b.id)}>
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
            </div>
        )}

        {showCreate && (
<<<<<<< HEAD
            <CreateBomModal onSave={handleCreate} onClose={() => setShowCreate(false)} saving={saving} />
        )}

        {detailId && (
            <BomDetailModal 
                bomId={detailId} 
                onClose={() => setDetailId(null)} 
                onUpdated={() => refetch()} 
=======
            <CreateBomModal
                onSave={handleCreate}
                onClose={() => setShowCreate(false)}
                saving={saving}
>>>>>>> b41d7805ca057f97a138d29eb1ed6847fe7a8d63
            />
        )}
      </div>
  );
};