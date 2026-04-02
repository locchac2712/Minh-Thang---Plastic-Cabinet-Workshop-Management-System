// ============================================================
// src/pages/ControlMaterial.jsx
// Danh sách: SKU | Tên | Tồn kho — click để xem chi tiết
// ============================================================
import { useState } from "react";
import "./ControlMaterial.css";
import { useMaterials } from "../../hooks/useMaterials.js";
import { useAuth } from "../../context/AuthContext.jsx";

export const ControlMaterial = ({ onSelectMaterial }) => {
  const { materials, loading, error, refetch } = useMaterials();
  const { user, hasRole } = useAuth();
  const isLoggedIn = !!user;
  const canWrite   = isLoggedIn;
  const [search, setSearch] = useState("");


  const filtered = materials.filter((m) =>
      m.materialName?.toLowerCase().includes(search.toLowerCase()) ||
      m.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
      <div className="mat-page">

        {/* Toolbar */}
        <div className="mat-bar">
          <div className="mat-bar__left">
            <div className="mat-search">
              <span className="mat-search__icon">🔍</span>
              <input
                  placeholder="Tìm theo tên hoặc SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="mat-count">{filtered.length} vật liệu</span>
          </div>
          <div className="mat-bar__right">
            <button className="btn btn--ghost" onClick={refetch} disabled={loading}>
              🔄 Làm mới
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
            <div className="mat-state">
              <div className="mat-spinner" />
              <span>Đang tải dữ liệu...</span>
            </div>
        )}

        {/* Error */}
        {error && !loading && (
            <div className="mat-state mat-state--error">
              <span style={{ fontSize: 36 }}>⚠️</span>
              <span style={{ fontWeight: 500 }}>{error}</span>
              {error.includes("đăng nhập") ? (
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
              Vui lòng nhấn nút <strong>Login</strong> ở góc trên bên phải
            </span>
              ) : (
                  <button className="btn btn--ghost" onClick={refetch}>🔄 Thử lại</button>
              )}
            </div>
        )}

        {/* Table */}
        {!loading && !error && (
            <div className="mat-table-wrap">
              <table className="mat-table">
                <thead>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  <th>Tên vật liệu</th>
                  <th>Tồn kho</th>
                  <th>Chi tiết</th>
                  <th></th>
                </tr>
                </thead>
                <tbody>
                {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="mat-empty">Không có dữ liệu</td>
                    </tr>
                ) : (
                    filtered.map((m, idx) => (
                        <tr
                            key={m.id}
                            className="mat-row--clickable"
                            onClick={() => onSelectMaterial(m)}
                        >
                          <td className="mat-td--idx">{idx + 1}</td>
                          <td><span className="mat-code">{m.sku}</span></td>
                          <td className="mat-td--name">
                            {(m.materialName || m.name)
                                ? (m.materialName || m.name)
                                : <span
                                    className="mat-missing-name"
                                    onClick={(e) => { e.stopPropagation(); onSelectMaterial(m); }}
                                >

                          </span>
                            }
                          </td>
                          <td>
                      <span className={`mat-qty${m.currentStock <= 0 ? " mat-qty--zero" : ""}`}>
                        {m.currentStock ?? 0}
                        <span className="mat-qty-unit"> {m.unit}</span>
                      </span>
                          </td>

                          <td className="mat-td--arrow">›</td>
                        </tr>
                    ))
                )}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
};