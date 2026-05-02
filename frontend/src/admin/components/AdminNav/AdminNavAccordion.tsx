import { useEffect, useId, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { adminPaths } from '../../config/adminPaths'
import { AdminNavItemLink } from './AdminNavItemLink'
import './AdminNavAccordion.css'

const LS_CATALOG_OPEN = 'tunhua-admin-nav-catalog-open'

function readOpen(fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(LS_CATALOG_OPEN)
    if (raw === null) return fallback
    const v = JSON.parse(raw) as unknown
    return typeof v === 'boolean' ? v : fallback
  } catch {
    return fallback
  }
}

type Props = {
  narrow: boolean
}

/**
 * Accordion cho nhóm Danh mục thành phẩm (theo ui/admin_sidebar.md).
 * Khi sidebar rail: hiển thị 2 link icon (categories + products), không dùng accordion.
 */
export function AdminCatalogAccordion({ narrow }: Props) {
  const { pathname } = useLocation()
  const catalogActive =
    pathname.startsWith(adminPaths.catalog.root + '/') || pathname === adminPaths.catalog.root
  const [open, setOpen] = useState(() => readOpen(true))
  const panelId = useId()
  const triggerId = useId()

  useEffect(() => {
    try {
      localStorage.setItem(LS_CATALOG_OPEN, JSON.stringify(open))
    } catch {
      /* ignore */
    }
  }, [open])

  if (narrow) {
    return (
      <div className="th-admin-nav-sub th-admin-nav-sub--stack" role="group" aria-label="Danh mục thành phẩm">
        <AdminNavItemLink
          to={adminPaths.catalog.categories}
          icon="category"
          label="Ngành hàng"
          narrow
          className="th-admin-nav-sublink"
        />
        <AdminNavItemLink
          to={adminPaths.catalog.products}
          icon="inventory_2"
          label="Mẫu tủ chuẩn"
          narrow
          className="th-admin-nav-sublink"
        />
      </div>
    )
  }

  return (
    <div className="th-admin-accordion">
      <button
        id={triggerId}
        type="button"
        className={`th-admin-accordion__trigger${catalogActive ? ' th-admin-accordion__trigger--active' : ''}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="material-symbols-outlined" aria-hidden>
          inventory
        </span>
        <span className="th-admin-accordion__title">Danh mục thành phẩm</span>
        <span className="material-symbols-outlined th-admin-accordion__chevron" aria-hidden>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {open ? (
        <div id={panelId} className="th-admin-accordion__panel" role="region" aria-labelledby={triggerId}>
          <div className="th-admin-nav-sub" role="group">
            <AdminNavItemLink
              to={adminPaths.catalog.categories}
              icon="category"
              label="Ngành hàng"
              className="th-admin-nav-sublink"
            />
            <AdminNavItemLink
              to={adminPaths.catalog.products}
              icon="shelves"
              label="Mẫu tủ chuẩn"
              className="th-admin-nav-sublink"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
