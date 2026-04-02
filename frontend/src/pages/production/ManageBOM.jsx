import { useState, useEffect } from "react";
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

const calcMaterialCost = (detail) => {
  if (detail.price != null && detail.quantityRequired != null)
    return Number(detail.price) * Number(detail.quantityRequired);
  return null;
};

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
      </div>
  );
};

// --- Modal: Create BOM ---
const CreateBomModal = ({ onSave, onClose, saving }) => {
  const [productId, setProductId] = useState("");
  const [version, setVersion] = useState("1.0");
  const [rows, setRows] = useState([{ materialId: "", quantityRequired: "" }]);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [pRes, mRes] = await Promise.all([api.get("/products"), api.get("/materials")]);
        setProducts(Array.isArray(pRes.data) ? pRes.data : (pRes.data?.data ?? []));
        setMaterials(Array.isArray(mRes.data) ? mRes.data : (mRes.data?.data ?? []));
      } catch (e) {
        console.error("Lỗi tải dropdown:", e);
      } finally { setLoadingData(false); }
    })();
  }, []);

  const handleSave = () => {
    const details = rows
        .filter((r) => r.materialId && r.quantityRequired)
        .map((r) => ({ materialId: Number(r.materialId), quantityRequired: Number(r.quantityRequired) }));
    onSave({ productId: Number(productId), version, details });
  };

  const valid = productId && version && rows.some((r) => r.materialId && r.quantityRequired);

  return (
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
          )}
        </div>
      </div>
  );
};

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

  const handleCreate = async (payload) => {
    setSaving(true);
    try {
      await create(payload);
      setShowCreate(false);
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
            </div>
        )}

        {showCreate && (
            <CreateBomModal
                onSave={handleCreate}
                onClose={() => setShowCreate(false)}
                saving={saving}
            />
        )}
      </div>
  );
};