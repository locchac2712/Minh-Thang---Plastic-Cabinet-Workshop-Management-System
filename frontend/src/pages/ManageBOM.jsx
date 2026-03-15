import { useState, useEffect } from "react";
import "./ManageBOM.css";
import { useBoms } from "../hooks/useBoms";
import { useAuth } from "../context/AuthContext";
import { getStatusInfo } from "../services/bomService";
import bomService from "../services/bomService";
import api from "../services/api";

const fmt = (val) =>
    val != null
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
        : "—";

const calcMaterialCost = (detail) => {
  if (detail.price != null && detail.quantityRequired != null)
    return Number(detail.price) * Number(detail.quantityRequired);
  return null;
};

// ─────────────────────────────────────────────────────────────
// Shared: Material rows editor (dùng cho cả Create và Edit)
// ─────────────────────────────────────────────────────────────
const MaterialRowsEditor = ({ rows, setRows, materials }) => {
  const setRow = (idx, field, val) =>
      setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  const addRow    = () => setRows((p) => [...p, { materialId: "", quantityRequired: "" }]);
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
                <button
                    className="bom-remove-row"
                    onClick={() => removeRow(idx)}
                    disabled={rows.length === 1}
                >✕</button>
              </div>
          );
        })}
        <button className="bom-add-row" onClick={addRow}>+ Thêm vật tư</button>
      </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Create BOM Modal
// ─────────────────────────────────────────────────────────────
const CreateBomModal = ({ onSave, onClose, saving }) => {
  const [productId,   setProductId]   = useState("");
  const [version,     setVersion]     = useState("1.0");
  const [rows,        setRows]        = useState([{ materialId: "", quantityRequired: "" }]);
  const [products,    setProducts]    = useState([]);
  const [materials,   setMaterials]   = useState([]);
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

// ─────────────────────────────────────────────────────────────
// Edit BOM Modal
// BomUpdateRequest: { version, isActive, details:[{materialId, quantityRequired}] }
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
        console.error("Lỗi tải vật tư:", e);
      } finally { setLoadingData(false); }
    })();
  }, []);

  const handleSave = () => {
    const details = rows
        .filter((r) => r.materialId && r.quantityRequired)
        .map((r) => ({ materialId: Number(r.materialId), quantityRequired: Number(r.quantityRequired) }));
    // BomUpdateRequest: { version, isActive, details }
    onSave({ version, isActive, details });
  };

  const valid = version && rows.some((r) => r.materialId && r.quantityRequired);

  return (
      <div className="bom-overlay" onClick={onClose}>
        <div className="bom-modal bom-modal--lg" onClick={(e) => e.stopPropagation()}>
          <div className="bom-modal__header">
            <div>
              <h3>Chỉnh sửa BOM</h3>
              <span className="bom-modal__subtitle">{bom.productName} · v{bom.version}</span>
            </div>
            <button className="bom-modal__close" onClick={onClose}>✕</button>
          </div>
          {loadingData ? (
              <div className="bom-modal__loading"><div className="bom-spinner" /><span>Đang tải...</span></div>
          ) : (
              <>
                <div className="bom-modal__body">
                  {/* Version + isActive */}
                  <div className="bom-form-row">
                    <div className="bom-form-group">
                      <label>Phiên bản *</label>
                      <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="VD: 1.0" />
                    </div>
                    <div className="bom-form-group">
                      <label>Trạng thái</label>
                      <select value={isActive ? "true" : "false"} onChange={(e) => setIsActive(e.target.value === "true")}>
                        <option value="true">Đang hoạt động</option>
                        <option value="false">Ngừng dùng</option>
                      </select>
                    </div>
                  </div>

                  {/* Material rows */}
                  <div className="bom-form-group">
                    <label>Danh sách vật tư *</label>
                    <MaterialRowsEditor rows={rows} setRows={setRows} materials={materials} />
                  </div>

                  {/* Note về isApproved */}
                  <div className="bom-note">
                    ℹ️ Sau khi chỉnh sửa, BOM sẽ cần được duyệt lại bởi Admin / Giám đốc.
                  </div>
                </div>
                <div className="bom-modal__footer">
                  <button className="btn btn--ghost" onClick={onClose}>Hủy</button>
                  <button className="btn btn--primary" onClick={handleSave} disabled={saving || !valid}>
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </>
          )}
        </div>
      </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BOM Detail
// ─────────────────────────────────────────────────────────────
const BomDetail = ({ bomId, onBack, onUpdated }) => {
  const { user } = useAuth();
  const [bom,      setBom]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await bomService.getById(bomId);
        setBom(data);
      } catch {
        setError("Không thể tải chi tiết BOM");
      } finally { setLoading(false); }
    })();
  }, [bomId]);

  const handleEdit = async (payload) => {
    setSaving(true);
    try {
      await bomService.update(bomId, payload);
      // Reload lại detail sau khi update
      const fresh = await bomService.getById(bomId);
      setBom(fresh);
      setShowEdit(false);
      showToast("Cập nhật BOM thành công!");
      if (onUpdated) onUpdated();
    } catch (e) {
      showToast(e.response?.data?.message || "Có lỗi xảy ra", "error");
    } finally { setSaving(false); }
  };

  const totalCost = bom?.details?.reduce((sum, d) => {
    const c = calcMaterialCost(d);
    return c != null ? sum + c : sum;
  }, 0) ?? null;

  const s = bom ? getStatusInfo(bom) : null;

  return (
      <div className="bom-detail-page">
        {toast && <div className={`bom-toast bom-toast--${toast.type}`}>{toast.msg}</div>}

        <div className="bom-topbar">
          <button className="bom-back-btn" onClick={onBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Quay lại danh sách
          </button>
          {user && bom && (
              <button className="btn btn--primary" onClick={() => setShowEdit(true)} disabled={saving}>
                ✏️ Chỉnh sửa BOM
              </button>
          )}
        </div>

        {loading && <div className="bom-state"><div className="bom-spinner" /><span>Đang tải...</span></div>}
        {error   && <div className="bom-state bom-state--error">⚠️ {error}</div>}

        {bom && !loading && (
            <>
              <div className="bom-header-card">
                <div className="bom-header-card__left">
                  <div className="bom-avatar">📋</div>
                  <div>
                    <h1 className="bom-title">{bom.productName}</h1>
                    <div className="bom-meta">
                      <span className="bom-sku-badge">{bom.productSku}</span>
                      <span className="bom-version-badge">v{bom.version}</span>
                    </div>
                  </div>
                </div>
                <div className="bom-header-card__right">
                  <span className={`bom-status ${s.cls}`}>{s.text}</span>
                </div>
              </div>

              <div className="bom-summary-row">
                <div className="bom-summary-card">
                  <span className="bom-summary-label">Số loại vật tư</span>
                  <span className="bom-summary-value">{bom.details?.length ?? 0}</span>
                </div>
                <div className="bom-summary-card">
                  <span className="bom-summary-label">Tổng chi phí BOM</span>
                  <span className="bom-summary-value bom-summary-value--accent">
                {totalCost != null && totalCost > 0 ? fmt(totalCost) : "Chưa có giá"}
              </span>
                </div>
                <div className="bom-summary-card">
                  <span className="bom-summary-label">Phiên bản</span>
                  <span className="bom-summary-value">v{bom.version}</span>
                </div>
                <div className="bom-summary-card">
                  <span className="bom-summary-label">Trạng thái</span>
                  <span className={`bom-status ${s.cls}`} style={{ fontSize: 12 }}>{s.text}</span>
                </div>
              </div>

              <div className="bom-card">
                <div className="bom-card__header">
                  <span className="bom-card__title">🔩 Thành phần vật tư</span>
                </div>
                <table className="bom-table">
                  <thead>
                  <tr>
                    <th>#</th>
                    <th>SKU</th>
                    <th>Tên vật tư</th>
                    <th>Số lượng</th>
                    <th>Đơn vị tính</th>
                    <th>Chi phí vật tư</th>
                  </tr>
                  </thead>
                  <tbody>
                  {!bom.details?.length ? (
                      <tr><td colSpan={6} className="bom-empty">Chưa có vật tư nào</td></tr>
                  ) : (
                      bom.details.map((d, idx) => {
                        const cost = calcMaterialCost(d);
                        return (
                            <tr key={d.id}>
                              <td className="bom-td--idx">{idx + 1}</td>
                              <td><span className="bom-mat-code">{d.materialSku}</span></td>
                              <td className="bom-td--name">{d.materialName}</td>
                              <td>{Number(d.quantityRequired).toLocaleString("vi-VN")}</td>
                              <td>{d.unit || "—"}</td>
                              <td>{cost != null ? fmt(cost) : <span className="bom-no-price">Chưa có giá</span>}</td>
                            </tr>
                        );
                      })
                  )}
                  </tbody>
                  {totalCost != null && totalCost > 0 && (
                      <tfoot>
                      <tr className="bom-tfoot-row">
                        <td colSpan={5} style={{ textAlign: "right", fontWeight: 600 }}>Tổng chi phí BOM</td>
                        <td style={{ fontWeight: 700, color: "var(--accent)" }}>{fmt(totalCost)}</td>
                      </tr>
                      </tfoot>
                  )}
                </table>
              </div>
            </>
        )}

        {showEdit && bom && (
            <EditBomModal
                bom={bom}
                onSave={handleEdit}
                onClose={() => setShowEdit(false)}
                saving={saving}
            />
        )}
      </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BOM List
// ─────────────────────────────────────────────────────────────
export const ManageBOM = () => {
  const { boms, loading, error, refetch, create } = useBoms();
  const { user } = useAuth();
  const [search,     setSearch]     = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState(null);
  const [detailId,   setDetailId]   = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
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

  if (detailId) {
    return (
        <BomDetail
            bomId={detailId}
            onBack={() => { setDetailId(null); refetch(); }}
            onUpdated={() => refetch()}
        />
    );
  }

  return (
      <div className="bom-page">
        {toast && <div className={`bom-toast bom-toast--${toast.type}`}>{toast.msg}</div>}

        <div className="bom-bar">
          <div className="bom-bar__left">
            <div className="bom-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                  placeholder="Tìm theo tên sản phẩm hoặc phiên bản..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="bom-count">{filtered.length} BOM</span>
          </div>
          <div className="bom-bar__right">
            <button className="btn btn--ghost" onClick={refetch} disabled={loading}>🔄 Làm mới</button>
            {user && (
                <button className="btn btn--primary" onClick={() => setShowCreate(true)}>+ Tạo BOM mới</button>
            )}
          </div>
        </div>

        {loading && <div className="bom-state"><div className="bom-spinner"/><span>Đang tải...</span></div>}
        {error && !loading && (
            <div className="bom-state bom-state--error">
              <span style={{ fontSize: 36 }}>⚠️</span>
              <span style={{ fontWeight: 500 }}>{error}</span>
              {error.includes("đăng nhập")
                  ? <span style={{ fontSize: 13 }}>Vui lòng đăng nhập lại</span>
                  : <button className="btn btn--ghost" onClick={refetch}>🔄 Thử lại</button>}
            </div>
        )}

        {!loading && !error && (
            <div className="bom-table-wrap">
              <table className="bom-list-table">
                <thead>
                <tr>
                  <th>#</th>
                  <th>BOM ID</th>
                  <th>Tên sản phẩm</th>
                  <th>Phiên bản</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
                </thead>
                <tbody>
                {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="bom-empty">Không có dữ liệu</td></tr>
                ) : (
                    filtered.map((b, idx) => {
                      const s = getStatusInfo(b);
                      return (
                          <tr key={b.id} className="bom-row--clickable" onClick={() => setDetailId(b.id)}>
                            <td className="bom-td--idx">{idx + 1}</td>
                            <td><span className="bom-id-badge">BOM-{b.id}</span></td>
                            <td className="bom-td--name">{b.productName}</td>
                            <td><span className="bom-version-chip">v{b.version}</span></td>
                            <td><span className={`bom-status ${s.cls}`}>{s.text}</span></td>
                            <td className="bom-td--arrow">›</td>
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